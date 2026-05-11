import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { db, usersTable, attendanceTable } from "@workspace/db";
import {
  ListAttendanceQueryParams,
  PunchInBody,
  PunchOutBody,
  GetAttendanceParams,
  ValidateAttendanceParams,
  ValidateAttendanceBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getAuthUser(req: any, res: any) {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (!dbUser) {
    res.status(404).json({ error: "User not found. Call /users/me/sync first." });
    return null;
  }
  return dbUser;
}

function serializeRecord(record: typeof attendanceTable.$inferSelect, user?: typeof usersTable.$inferSelect) {
  return {
    ...record,
    punchInTime: record.punchInTime?.toISOString(),
    punchOutTime: record.punchOutTime?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    user: user ? { ...user, createdAt: user.createdAt.toISOString() } : undefined,
  };
}

// GET /attendance
router.get("/attendance", async (req, res): Promise<void> => {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const query = ListAttendanceQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { userId, date, startDate, endDate, page = 1, limit = 20 } = query.data;

  const conditions: any[] = [];

  // Role-based access
  if (user.role === "employee") {
    conditions.push(eq(attendanceTable.userId, user.id));
  } else if (userId) {
    conditions.push(eq(attendanceTable.userId, Number(userId)));
  }

  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    conditions.push(gte(attendanceTable.punchInTime, d));
    conditions.push(lte(attendanceTable.punchInTime, next));
  } else {
    if (startDate) conditions.push(gte(attendanceTable.punchInTime, new Date(startDate)));
    if (endDate) {
      const e = new Date(endDate);
      e.setDate(e.getDate() + 1);
      conditions.push(lte(attendanceTable.punchInTime, e));
    }
  }

  const offset = (Number(page) - 1) * Number(limit);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [records, countResult] = await Promise.all([
    db.select({
      record: attendanceTable,
      user: usersTable,
    })
      .from(attendanceTable)
      .leftJoin(usersTable, eq(attendanceTable.userId, usersTable.id))
      .where(where)
      .orderBy(desc(attendanceTable.punchInTime))
      .limit(Number(limit))
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` })
      .from(attendanceTable)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  res.json({
    records: records.map(r => serializeRecord(r.record, r.user ?? undefined)),
    total,
    page: Number(page),
    limit: Number(limit),
  });
});

// POST /attendance/punch-in
router.post("/attendance/punch-in", async (req, res): Promise<void> => {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const parsed = PunchInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check if already punched in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [existing] = await db.select()
    .from(attendanceTable)
    .where(
      and(
        eq(attendanceTable.userId, user.id),
        gte(attendanceTable.punchInTime, today),
        lte(attendanceTable.punchInTime, tomorrow),
      )
    );

  if (existing) {
    res.status(409).json({ error: "Already punched in today" });
    return;
  }

  const { selfieBase64, latitude, longitude } = parsed.data;

  // selfieBase64 may arrive as a full data URL ("data:image/jpeg;base64,...") or raw base64
  const selfieUrl = selfieBase64
    ? selfieBase64.startsWith("data:")
      ? selfieBase64
      : `data:image/jpeg;base64,${selfieBase64}`
    : null;

  const [record] = await db.insert(attendanceTable).values({
    userId: user.id,
    punchInTime: new Date(),
    selfieUrl,
    latitude,
    longitude,
    status: "incomplete",
    validationStatus: "pending",
    overtimeRequested: false,
  }).returning();

  res.status(201).json(serializeRecord(record, user));
});

// POST /attendance/punch-out
router.post("/attendance/punch-out", async (req, res): Promise<void> => {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const parsed = PunchOutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Find today's open punch-in
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [existing] = await db.select()
    .from(attendanceTable)
    .where(
      and(
        eq(attendanceTable.userId, user.id),
        gte(attendanceTable.punchInTime, today),
        lte(attendanceTable.punchInTime, tomorrow),
      )
    );

  if (!existing) {
    res.status(404).json({ error: "No open punch-in found for today" });
    return;
  }

  const punchOut = new Date();
  const diffMs = punchOut.getTime() - existing.punchInTime.getTime();
  const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
  const status = workingHours >= 8 ? "completed" : "incomplete";

  const [updated] = await db.update(attendanceTable)
    .set({
      punchOutTime: punchOut,
      workingHours,
      status,
    })
    .where(eq(attendanceTable.id, existing.id))
    .returning();

  res.json(serializeRecord(updated, user));
});

// GET /attendance/today
router.get("/attendance/today", async (req, res): Promise<void> => {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [record] = await db.select()
    .from(attendanceTable)
    .where(
      and(
        eq(attendanceTable.userId, user.id),
        gte(attendanceTable.punchInTime, today),
        lte(attendanceTable.punchInTime, tomorrow),
      )
    );

  res.json({ record: record ? serializeRecord(record, user) : null });
});

// GET /attendance/:id
router.get("/attendance/:id", async (req, res): Promise<void> => {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAttendanceParams.safeParse({ id: Number(raw) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [result] = await db.select({ record: attendanceTable, user: usersTable })
    .from(attendanceTable)
    .leftJoin(usersTable, eq(attendanceTable.userId, usersTable.id))
    .where(eq(attendanceTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  // Employees can only see their own records
  if (user.role === "employee" && result.record.userId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(serializeRecord(result.record, result.user ?? undefined));
});

// PATCH /attendance/:id/validate — admin/manager
router.patch("/attendance/:id/validate", async (req, res): Promise<void> => {
  const user = await getAuthUser(req, res);
  if (!user) return;

  if (user.role === "employee") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ValidateAttendanceParams.safeParse({ id: Number(raw) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ValidateAttendanceBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db.update(attendanceTable)
    .set({
      validationStatus: body.data.validationStatus,
      remarks: body.data.remarks ?? null,
    })
    .where(eq(attendanceTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  res.json(serializeRecord(updated, user));
});

export default router;
