ALTER TABLE "recordings" ADD COLUMN "medication" text;--> statement-breakpoint
-- Existing dosed records pre-date medication types; the app was Mounjaro-only.
UPDATE "recordings" SET "medication" = 'mounjaro' WHERE "mounjaro_dose_mg" IS NOT NULL AND "medication" IS NULL;
