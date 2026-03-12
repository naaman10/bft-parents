-- Add new columns to existing students table (all nullable for safe deployment).
-- Safe to run on production: existing rows are unchanged.
-- Run manually: psql "$DATABASE_URL" -f drizzle/0002_add_students_new_columns.sql

ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "dob" date;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "current_school" text;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "current_year_group" text;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "sen_needs" text;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "exam_board" text;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "medical_conditions" text;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "medication" text;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "collector_name" text;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "leave_independantly" boolean;
