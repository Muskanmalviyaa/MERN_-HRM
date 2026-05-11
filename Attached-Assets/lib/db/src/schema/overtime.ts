import { pgTable, serial, integer, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { attendanceTable } from "./attendance";

export const overtimeStatusEnum = pgEnum("overtime_status", ["pending", "approved", "rejected"]);

export const overtimeTable = pgTable("overtime_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  attendanceId: integer("attendance_id").notNull().references(() => attendanceTable.id),
  hoursRequested: real("hours_requested").notNull(),
  reason: text("reason"),
  status: overtimeStatusEnum("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOvertimeSchema = createInsertSchema(overtimeTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOvertime = z.infer<typeof insertOvertimeSchema>;
export type OvertimeRequest = typeof overtimeTable.$inferSelect;
