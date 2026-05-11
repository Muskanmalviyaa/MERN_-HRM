import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  GetUserParams,
  SyncMeBody,
  UpdateUserRoleParams,
  UpdateUserRoleBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Helper: require auth, returns DB user
async function requireAuthUser(req: any, res: any): Promise<{ clerkId: string; dbUser: typeof usersTable.$inferSelect } | null> {
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
  return { clerkId, dbUser };
}

// GET /users/me
router.get("/users/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

// POST /users/me/sync — upsert user from Clerk identity
router.post("/users/me/sync", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = SyncMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, name, avatarUrl } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (existing) {
    const [updated] = await db
      .update(usersTable)
      .set({ email, name, ...(avatarUrl !== undefined ? { avatarUrl } : {}) })
      .where(eq(usersTable.clerkId, clerkId))
      .returning();
    res.json(updated);
    return;
  }

  const [created] = await db
    .insert(usersTable)
    .values({ clerkId, email, name, avatarUrl: avatarUrl ?? null, role: "employee" })
    .returning();
  res.json(created);
});

// GET /users — admin only
router.get("/users", async (req, res): Promise<void> => {
  const result = await requireAuthUser(req, res);
  if (!result) return;
  const { dbUser } = result;
  if (dbUser.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users);
});

// GET /users/:userId — admin/manager
router.get("/users/:userId", async (req, res): Promise<void> => {
  const result = await requireAuthUser(req, res);
  if (!result) return;
  const { dbUser } = result;
  if (dbUser.role === "employee") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const params = GetUserParams.safeParse({ userId: Number(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

// PATCH /users/:userId/role — admin only
router.patch("/users/:userId/role", async (req, res): Promise<void> => {
  const result = await requireAuthUser(req, res);
  if (!result) return;
  const { dbUser } = result;
  if (dbUser.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const params = UpdateUserRoleParams.safeParse({ userId: Number(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateUserRoleBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set({ role: body.data.role })
    .where(eq(usersTable.id, params.data.userId))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(updated);
});

export default router;
