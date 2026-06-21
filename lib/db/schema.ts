import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// App logins (separate from the people being measured).
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  passwordHash: text("password_hash").notNull(),
  // New accounts start inactive until the emailed code is entered. Defaults to
  // true so existing/seeded logins keep working.
  active: boolean("active").notNull().default(true),
  activationCode: text("activation_code"),
  activationExpires: timestamp("activation_expires", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// A person being measured. Owned by the user who created them.
export const participants = pgTable("participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerUserId: uuid("owner_user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  dob: date("dob").notNull(),
  gender: text("gender").notNull(), // male | female | other | undisclosed
  heightCm: numeric("height_cm", { precision: 5, scale: 1 }).notNull(),
  targetBmi: numeric("target_bmi", { precision: 4, scale: 1 }), // optional goal
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Read-only access grants from a participant's owner to another user. The
// share_* flags gate which optional fields the recipient may see.
export const shares = pgTable(
  "shares",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // pending | accepted
    token: text("token").notNull(),
    shareDob: boolean("share_dob").notNull().default(false),
    shareMood: boolean("share_mood").notNull().default(false),
    shareAppetite: boolean("share_appetite").notNull().default(false),
    shareEnergy: boolean("share_energy").notNull().default(false),
    shareNotes: boolean("share_notes").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("shares_participant_recipient_uq").on(
      t.participantId,
      t.recipientUserId,
    ),
  ],
);

// One measurement event for a participant.
export const recordings = pgTable(
  "recordings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    recordedOn: date("recorded_on").notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 1 }).notNull(),
    waistCm: numeric("waist_cm", { precision: 5, scale: 1 }),
    mood: smallint("mood"), // 1..5
    energy: smallint("energy"), // 1..5
    appetite: smallint("appetite"), // 1..5
    medication: text("medication"), // null = none; e.g. mounjaro | wegovy | ...
    mounjaroDoseMg: numeric("mounjaro_dose_mg", { precision: 4, scale: 1 }), // dose in mg
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("recordings_participant_date_uq").on(t.participantId, t.recordedOn),
    check("mood_range", sql`${t.mood} is null or ${t.mood} between 1 and 7`),
    check("energy_range", sql`${t.energy} is null or ${t.energy} between 1 and 5`),
    check(
      "appetite_range",
      sql`${t.appetite} is null or ${t.appetite} between 1 and 5`,
    ),
  ],
);

export type Participant = typeof participants.$inferSelect;
export type Recording = typeof recordings.$inferSelect;
