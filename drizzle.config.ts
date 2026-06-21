import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load local env for CLI tooling (Next.js loads .env.local itself at runtime).
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
