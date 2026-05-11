import { pgTable, serial, integer, timestamp, text, real, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const attendanceStatusEnum = pgEnum("attendance_status", ["incomplete", "completed"]);
export const validationStatusEnum = pgEnum("validation_status", ["pending", "valid", "invalid"]);

export const attendanceTable = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  punchInTime: timestamp("punch_in_time", { withTimezone: true }).notNull().defaultNow(),
  punchOutTime: timestamp("punch_out_time", { withTimezone: true }),
  selfieUrl: text("selfie_url"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  workingHours: real("working_hours"),
  status: attendanceStatusEnum("status").notNull().default("incomplete"),
  validationStatus: validationStatusEnum("validation_status").notNull().default("pending"),
  remarks: text("remarks"),
  overtimeRequested: boolean("overtime_requested").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAttendanceSchema = createInsertSchema(attendanceTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendanceTable.$inferSelect;
