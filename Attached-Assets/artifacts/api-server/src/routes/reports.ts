import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { db, usersTable, attendanceTable, overtimeTable } from "@workspace/db";
import { GetDailyReportQueryParams } from "@workspace/api-zod";

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

function serializeRecord(record: typeof attendanceTable.$inferSelect, user?: typeof usersTable.$inferSelect) {
  return {
    ...record,
    punchInTime: record.punchInTime?.toISOString(),
    punchOutTime: record.punchOutTime?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    user: user ? { ...user, createdAt: user.createdAt.toISOString() } : undefined,
  };
}

// GET /dashboard/stats
router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const conditions: any[] = [];
  if (user.role === "employee") {
    conditions.push(eq(attendanceTable.userId, user.id));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [stats] = await db.select({
    totalDays: sql<number>`count(*)::int`,
    completedDays: sql<number>`sum(case when ${attendanceTable.status} = 'completed' then 1 else 0 end)::int`,
    incompleteDays: sql<number>`sum(case when ${attendanceTable.status} = 'incomplete' then 1 else 0 end)::int`,
    avgWorkingHours: sql<number>`coalesce(avg(${attendanceTable.workingHours}), 0)::float`,
  }).from(attendanceTable).where(where);

  const overtimeConditions: any[] = [];
  if (user.role === "employee") {
    overtimeConditions.push(eq(overtimeTable.userId, user.id));
  }
  overtimeConditions.push(eq(overtimeTable.status, "pending"));
  const [otStats] = await db.select({
    pendingOvertimeCount: sql<number>`count(*)::int`,
  }).from(overtimeTable).where(and(...overtimeConditions));

  const validationConditions: any[] = [eq(attendanceTable.validationStatus, "pending")];
  if (user.role === "employee") {
    validationConditions.push(eq(attendanceTable.userId, user.id));
  }
  const [valStats] = await db.select({
    pendingValidationCount: sql<number>`count(*)::int`,
  }).from(attendanceTable).where(and(...validationConditions));

  res.json({
    totalDays: stats?.totalDays ?? 0,
    completedDays: stats?.completedDays ?? 0,
    incompleteDays: stats?.incompleteDays ?? 0,
    avgWorkingHours: parseFloat((stats?.avgWorkingHours ?? 0).toFixed(2)),
    pendingOvertimeCount: otStats?.pendingOvertimeCount ?? 0,
    pendingValidationCount: valStats?.pendingValidationCount ?? 0,
  });
});

// GET /reports/daily
router.get("/reports/daily", async (req, res): Promise<void> => {
  const user = await getAuthUser(req, res);
  if (!user) return;

  const query = GetDailyReportQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { date, userId, page = 1, limit = 20 } = query.data;

  const targetDate = date ? new Date(date) : new Date();
  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);

  const conditions: any[] = [
    gte(attendanceTable.punchInTime, start),
    lte(attendanceTable.punchInTime, end),
  ];

  if (user.role === "employee") {
    conditions.push(eq(attendanceTable.userId, user.id));
  } else if (userId) {
    conditions.push(eq(attendanceTable.userId, Number(userId)));
  }

  const where = and(...conditions);
  const offset = (Number(page) - 1) * Number(limit);

  const [records, countResult] = await Promise.all([
    db.select({ record: attendanceTable, user: usersTable })
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
    date: start.toISOString().split("T")[0],
    records: records.map(r => serializeRecord(r.record, r.user ?? undefined)),
    total,
  });
});

export default router;
