-- Remove password and add Kamiwaza ID columns
ALTER TABLE "User" 
  DROP COLUMN IF EXISTS "password",
  ADD COLUMN "kamiwaza_id" varchar(64) NOT NULL,
  ADD COLUMN "last_login" timestamp,
  ADD CONSTRAINT "unique_kamiwaza_id" UNIQUE ("kamiwaza_id");

-- Add an index on kamiwaza_id for faster lookups
CREATE INDEX IF NOT EXISTS "idx_user_kamiwaza_id" ON "User" ("kamiwaza_id");