import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, overtimeTable, attendanceTable } from "@workspace/db";
import {
  ListOvertimeQueryParams,
  CreateOvertimeBody,
  ReviewOvertimeParams,
  ReviewOvertimeBody,
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
    res.status(404).json({ error: "User not found" });
    return null;
  }
  return dbUser;
}

function serializeOT(ot: typeof overtimeTable.$inferSelect, user?: typeof usersTable.$inferSelect) {
  return {
    ...ot,
    createdAt: ot.createdAt.toISOString(),
    user: user ? { ...user, createdAt: user.createdAt.toISOString() } : undefined,
  };
}

// GET /overtime
router.get("/overtime", async (req, res): Promise<void> => {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const query = ListOvertimeQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { status, userId } = query.data;
  const conditions: any[] = [];

  if (user.role === "employee") {
    conditions.push(eq(overtimeTable.userId, user.id));
  } else if (userId) {
    conditions.push(eq(overtimeTable.userId, Number(userId)));
  }

  if (status) {
    conditions.push(eq(overtimeTable.status, status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db.select({ ot: overtimeTable, user: usersTable })
    .from(overtimeTable)
    .leftJoin(usersTable, eq(overtimeTable.userId, usersTable.id))
    .where(where)
    .orderBy(overtimeTable.createdAt);

  res.json(results.map(r => serializeOT(r.ot, r.user ?? undefined)));
});

// POST /overtime
router.post("/overtime", async (req, res): Promise<void> => {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const parsed = CreateOvertimeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { attendanceId, hoursRequested, reason } = parsed.data;

  // Verify attendance belongs to the user
  const [att] = await db.select().from(attendanceTable).where(
    and(eq(attendanceTable.id, attendanceId), eq(attendanceTable.userId, user.id))
  );
  if (!att) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  const [created] = await db.insert(overtimeTable).values({
    userId: user.id,
    attendanceId,
    hoursRequested,
    reason: reason ?? null,
    status: "pending",
  }).returning();

  // Mark attendance as overtimeRequested
  await db.update(attendanceTable)
    .set({ overtimeRequested: true })
    .where(eq(attendanceTable.id, attendanceId));

  res.status(201).json(serializeOT(created, user));
});

// PATCH /overtime/:id/review — admin/manager
router.patch("/overtime/:id/review", async (req, res): Promise<void> => {
  const user = await getAuthUser(req, res);
  if (!user) return;

  if (user.role === "employee") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ReviewOvertimeParams.safeParse({ id: Number(raw) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ReviewOvertimeBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db.update(overtimeTable)
    .set({
      status: body.data.status,
      reviewedBy: user.id,
      reviewNote: body.data.reviewNote ?? null,
    })
    .where(eq(overtimeTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Overtime request not found" });
    return;
  }

  const [otUser] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  res.json(serializeOT(updated, otUser));
});

export default router;
