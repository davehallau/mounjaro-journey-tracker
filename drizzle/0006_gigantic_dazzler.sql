CREATE TABLE "doses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"recorded_on" date NOT NULL,
	"medication" text NOT NULL,
	"dose_mg" numeric(4, 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doses_participant_date_uq" UNIQUE("participant_id","recorded_on")
);
--> statement-breakpoint
ALTER TABLE "doses" ADD CONSTRAINT "doses_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Migrate existing per-recording doses into the new doses table.
INSERT INTO "doses" ("participant_id","recorded_on","medication","dose_mg")
SELECT "participant_id","recorded_on","medication","mounjaro_dose_mg"
FROM "recordings" WHERE "medication" IS NOT NULL
ON CONFLICT ("participant_id","recorded_on") DO NOTHING;
