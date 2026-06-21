import { config } from "dotenv";
import { Pool } from "pg";
import { format, subWeeks } from "date-fns";

// Loads sample data for one participant so the app is easy to try locally.
// Idempotent: it removes and recreates the demo participant each run, and
// leaves any other participants untouched.

config({ path: ".env.local" });
config({ path: ".env" });

const DEMO_NAME = "Alex (demo)";
const HEIGHT_CM = 178;
const WEEKS = 18; // ~4 months of weekly weigh-ins

const clamp = (n: number, lo = 1, hi = 5) => Math.max(lo, Math.min(hi, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

function dose(week: number): number | null {
  if (week < 3) return 2.5;
  if (week < 7) return 5;
  if (week < 11) return 7.5;
  if (week < 15) return 10;
  return 12.5;
}
// Weeks where the dose just stepped up — expect a short dip in energy/mood.
const stepUp = new Set([0, 3, 7, 11, 15]);

function noteFor(week: number): string | null {
  if (week === 0) return "Started Mounjaro at 2.5mg.";
  if (week === 3) return "Up to 5mg — a bit of nausea for a couple of days.";
  if (week === 7) return "Up to 7.5mg. Appetite really low now.";
  if (week === 11) return "Up to 10mg.";
  if (week === 6) return "Clothes feeling looser.";
  if (week === 14) return "Energy noticeably better, sleeping well.";
  return null;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Replace any existing demo participant (cascade clears their recordings).
  await pool.query(`delete from participants where name = $1`, [DEMO_NAME]);

  const { rows } = await pool.query(
    `insert into participants (name, dob, gender, height_cm, target_bmi)
     values ($1, $2, $3, $4, $5) returning id`,
    [DEMO_NAME, "1986-04-12", "male", HEIGHT_CM, 24.9],
  );
  const participantId = rows[0].id as string;

  for (let i = 0; i < WEEKS; i++) {
    const date = format(subWeeks(new Date(), WEEKS - 1 - i), "yyyy-MM-dd");
    const weight = round1(98 - i * 0.75 + Math.sin(i) * 0.3);
    const waist = round1(108 - i * 0.55 + Math.cos(i) * 0.25);
    const appetite = i === 0 ? 4 : clamp(i % 4 === 0 ? 3 : 2);
    const dip = stepUp.has(i) ? 1 : 0;
    const energy = clamp(2 + Math.floor(i / 5) - dip);
    // Mood rises across the journey from ~1 up to 7 ("hyper"), dipping a little
    // on dose step-up weeks. Uses the full 1–7 scale.
    const mood = clamp(2 + Math.floor(i / 3) - dip, 1, 7);

    await pool.query(
      `insert into recordings
        (participant_id, recorded_on, weight_kg, waist_cm, mood, energy, appetite, notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [participantId, date, weight, waist, mood, energy, appetite, noteFor(i)],
    );
    await pool.query(
      `insert into doses (participant_id, recorded_on, medication, dose_mg)
       values ($1,$2,'mounjaro',$3)`,
      [participantId, date, dose(i)],
    );
  }

  console.log(
    `✓ Seeded "${DEMO_NAME}" with ${WEEKS} weekly recordings (~4 months).`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
