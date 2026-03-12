-- Add new columns to existing parents table (all nullable for safe deployment).
-- Safe to run on production: existing rows are unchanged.
-- Run manually: psql $DATABASE_URL -f drizzle/0001_add_parent_new_columns.sql

ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "relationship" text;
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "secondary_contact_number" text;
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "address_line_1" text;
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "address_line_2" text;
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "town" text;
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "post_code" text;
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "emergency_first_name" text;
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "emergency_last_name" text;
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "emergency_relation" text;
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "emergency_contact" text;
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "terms" timestamp with time zone;
ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "acknowledgement" timestamp with time zone;
