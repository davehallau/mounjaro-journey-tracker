import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

// Load local env (this runs outside Next.js).
config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const username = process.env.SEED_USERNAME;
  const password = process.env.SEED_PASSWORD;

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

  await pool.query(
    `insert into users (username, password_hash)
     values ($1, $2)
     on conflict (username)
     do update set password_hash = excluded.password_hash`,
    [username, hash],
  );

  console.log(`✓ Login ready for user "${username}".`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
