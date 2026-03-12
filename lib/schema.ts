import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/** Matches existing production table + new columns (new columns nullable for safe migration). */
export const parents = pgTable("parents", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique("parents_email_key"),
  contactNumber: varchar("contact_number", { length: 30 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  sessionRate: numeric("session_rate", { precision: 8, scale: 2 }),

  // New columns (all nullable so existing rows are unchanged)
  relationship: text("relationship"),
  secondaryContactNumber: text("secondary_contact_number"),
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  town: text("town"),
  postCode: text("post_code"),
  emergencyFirstName: text("emergency_first_name"),
  emergencyLastName: text("emergency_last_name"),
  emergencyRelation: text("emergency_relation"),
  emergencyContact: text("emergency_contact"),
  terms: timestamp("terms", { withTimezone: true }),
  acknowledgement: timestamp("acknowledgement", { withTimezone: true }),
});

/** Matches existing production table "students" + new columns (new columns nullable for safe migration). */
export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    age: integer("age"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    welcome: boolean("welcome").notNull().default(false),
    startDate: date("start_date"),
    startTime: time("start_time"),
    welcomeSentAt: timestamp("welcome_sent_at", { withTimezone: true }),
    aiSummary: text("ai_summary"),
    aiSummaryUpdated: timestamp("ai_summary_updated"),

    // New columns (all nullable so existing rows are unchanged)
    dob: date("dob", { mode: "string" }),
    currentSchool: text("current_school"),
    currentYearGroup: text("current_year_group"),
    senNeeds: text("sen_needs"),
    examBoard: text("exam_board"),
    medicalConditions: text("medical_conditions"),
    medication: text("medication"),
    collectorName: text("collector_name"),
    leaveIndependantly: boolean("leave_independantly"),
  },
  (self) => [check("students_age_check", sql`${self.age} >= 0`)]
);

export const emergencyContacts = pgTable("emergency_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id")
    .notNull()
    .references(() => parents.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  relationshipToChild: text("relationship_to_child").notNull(),
  emergencyContactNumber: text("emergency_contact_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Parent = typeof parents.$inferSelect;
export type NewParent = typeof parents.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type NewEmergencyContact = typeof emergencyContacts.$inferInsert;
