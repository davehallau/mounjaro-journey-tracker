import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

config({ path: ".env.local" });

// Shared fixtures for the e2e suite. All use the @e2e.test domain / "E2E "
// name prefix so cleanup never touches real dev data.
export const PASSWORD = "password123";
export const USER_A = "ownera@e2e.test";
export const USER_B = "viewerb@e2e.test";
export const PARTICIPANT_SHARED = "E2E Alpha";
export const PARTICIPANT_PRIVATE = "E2E Secret";
export const SECRET_NOTE = "private-note-do-not-leak";

function pool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

/** Remove all e2e fixtures (cascades to participants/recordings/shares). */
export async function cleanup() {
  const db = pool();
  try {
    await db.query(`delete from users where email like '%@e2e.test'`);
  } finally {
    await db.end();
  }
}

export async function participantIdByName(name: string): Promise<string> {
  const db = pool();
  try {
    const { rows } = await db.query(
      `select id from participants where name = $1 limit 1`,
      [name],
    );
    return rows[0].id as string;
  } finally {
    await db.end();
  }
}

export async function seedFixtures() {
  await cleanup();
  const db = pool();
  try {
    const hash = await bcrypt.hash(PASSWORD, 10);
    const mkUser = async (email: string) => {
      const { rows } = await db.query(
        `insert into users (username, email, password_hash, active)
         values ($1,$1,$2,true) returning id`,
        [email, hash],
      );
      return rows[0].id as string;
    };
    const userA = await mkUser(USER_A);
    const userB = await mkUser(USER_B);

    const mkParticipant = async (owner: string, name: string) => {
      const { rows } = await db.query(
        `insert into participants (owner_user_id, name, dob, gender, height_cm)
         values ($1,$2,'1985-05-15','male',180) returning id`,
        [owner, name],
      );
      return rows[0].id as string;
    };
    const alpha = await mkParticipant(userA, PARTICIPANT_SHARED);
    await mkParticipant(userA, PARTICIPANT_PRIVATE);

    await db.query(
      `insert into recordings
        (participant_id, recorded_on, weight_kg, waist_cm, mood, energy, appetite, notes)
       values ($1,'2026-06-01',90,100,4,3,2,$2)`,
      [alpha, SECRET_NOTE],
    );
    await db.query(
      `insert into doses (participant_id, recorded_on, medication, dose_mg)
       values ($1,'2026-06-01','mounjaro',5)`,
      [alpha],
    );

    // Share Alpha with B: mood/energy/appetite on, notes + DOB OFF.
    await db.query(
      `insert into shares
        (participant_id, recipient_user_id, status, token,
         share_dob, share_mood, share_appetite, share_energy, share_notes)
       values ($1,$2,'accepted','e2e-token',false,true,true,true,false)`,
      [alpha, userB],
    );
  } finally {
    await db.end();
  }
}
