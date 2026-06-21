CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"dob" date NOT NULL,
	"gender" text NOT NULL,
	"height_cm" numeric(5, 1) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"recorded_on" date NOT NULL,
	"weight_kg" numeric(5, 1) NOT NULL,
	"waist_cm" numeric(5, 1),
	"mood" smallint,
	"energy" smallint,
	"appetite" smallint,
	"mounjaro_dose_mg" numeric(4, 1),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recordings_participant_date_uq" UNIQUE("participant_id","recorded_on"),
	CONSTRAINT "mood_range" CHECK ("recordings"."mood" is null or "recordings"."mood" between 1 and 5),
	CONSTRAINT "energy_range" CHECK ("recordings"."energy" is null or "recordings"."energy" between 1 and 5),
	CONSTRAINT "appetite_range" CHECK ("recordings"."appetite" is null or "recordings"."appetite" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;