import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

// Load local env (this runs outside Next.js).
config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const username = process.env.SEED_USERNAME;
  const password = process.env.SEED_PASSWORD;
  // Optional: set the login's email so it can also use Google/Microsoft sign-in.
  const email = process.env.SEED_EMAIL?.trim().toLowerCase() || null;

  if (!username || !password) {
    console.error(
      "Set SEED_USERNAME and SEED_PASSWORD in .env.local before running.",
    );
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const hash = await bcrypt.hash(password, 10);

  // Seeded logins are active immediately.
  await pool.query(
    `insert into users (username, email, password_hash, active)
     values ($1, $2, $3, true)
     on conflict (username)
     do update set password_hash = excluded.password_hash,
                   email = excluded.email,
                   active = true`,
    [username, email, hash],
  );

  console.log(
    `✓ Login ready for user "${username}"${email ? ` (${email})` : ""}.`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
