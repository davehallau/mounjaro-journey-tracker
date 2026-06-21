# Weight Tracker

A small, mobile-responsive web app to track a Mounjaro (tirzepatide) weight-loss
journey — weight, waist, mood/energy/appetite, dose, and BMI over time, with
overlaid graphs and a date-range picker.

- **Functional requirements:** [`docs/functional-requirements.md`](docs/functional-requirements.md)
- **Technical design:** [`docs/technical-design.md`](docs/technical-design.md)

## Stack

Next.js 16 (App Router) + TypeScript · Tailwind v4 · Auth.js (password) ·
Postgres + Drizzle ORM (the `pg` driver runs against local Docker **and** Neon) ·
Recharts · deploys to Vercel. All on free tiers.

---

## Run locally (offline, with Docker)

The fastest way to try it. Requires **Node 20+** and **Docker**.

```bash
npm install
cp .env.example .env.local      # defaults already point at the local Docker DB
                                 # (set AUTH_SECRET: openssl rand -base64 32)

npm run db:up                    # start local Postgres (docker-compose, port 5433)
npm run db:migrate               # create the tables
npm run seed:user                # create your login from SEED_* in .env.local
npm run seed:demo                # OPTIONAL: load ~4 months of sample data

npm run dev                      # http://localhost:3000
```

Log in with the `SEED_USERNAME` / `SEED_PASSWORD` from your `.env.local`.
If you ran `seed:demo`, the **"Alex (demo)"** participant will already have data
to explore on the dashboard.

> A generated `.env.local` is already present from setup; `.env.example` documents
> every variable. Stop the DB with `npm run db:down` (data persists in a volume).

### Prefer no Docker?

Point `DATABASE_URL` in `.env.local` at any Postgres — including a free **Neon**
database (https://neon.tech) — and run the same `db:migrate` / `seed:*` / `dev`
steps. No code changes needed.

---

## Deploy to Vercel (no Git required)

1. Sign up for **Neon** (https://neon.tech) and **Vercel** (https://vercel.com),
   then install the CLI: `npm i -g vercel`.
2. In Neon, create a project and copy the **pooled** connection string.
3. Log in and deploy from this folder:
   ```bash
   vercel login
   vercel            # first run links/creates the project
   vercel --prod     # promote to production
   ```
4. Set production env vars (Vercel dashboard → Project → Settings → Environment
   Variables): `DATABASE_URL` (Neon), `AUTH_SECRET` (`openssl rand -base64 32`),
   and `AUTH_URL` (your `*.vercel.app` URL). Redeploy after setting them.
5. Create the tables and your login against the production DB (point a local
   `DATABASE_URL` at Neon for these one-off commands):
   ```bash
   npm run db:migrate
   npm run seed:user
   ```

> Tip: Neon's free tier auto-resumes on access, so there's nothing to "unpause"
> when you return to the app after a few days.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:up` / `db:down` | Start / stop the local Postgres container |
| `npm run db:generate` | Generate a Drizzle migration from the schema |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:studio` | Open Drizzle Studio (browse the DB) |
| `npm run seed:user` | Create/update the login from `SEED_*` env vars |
| `npm run seed:demo` | Load ~4 months of sample data for one participant |

---

## Roadmap

See the "nice-to-have / later" section in the functional requirements: passkey
login, CSV export, and a goal-weight line.
