CREATE TABLE "shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"token" text NOT NULL,
	"share_dob" boolean DEFAULT false NOT NULL,
	"share_mood" boolean DEFAULT false NOT NULL,
	"share_appetite" boolean DEFAULT false NOT NULL,
	"share_energy" boolean DEFAULT false NOT NULL,
	"share_notes" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shares_participant_recipient_uq" UNIQUE("participant_id","recipient_user_id")
);
--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "owner_user_id" uuid;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Assign pre-existing participants to the earliest user (the original owner).
UPDATE "participants" SET "owner_user_id" = (SELECT "id" FROM "users" ORDER BY "created_at" ASC LIMIT 1) WHERE "owner_user_id" IS NULL;
