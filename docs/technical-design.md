# Technical Design — Weight Tracker

Companion to `functional-requirements.md`. Describes the chosen stack, data model,
and how the pieces fit. Status: draft for build (2026-06-20).

---

## 1. Stack decision

Chosen: **Option A — Next.js on Vercel + Neon Postgres + Auth.js.**

Rationale (from hosting research, June 2026):

- **$0 to run.** Vercel free tier (100 GB bandwidth) + Neon free tier
  (0.5 GB storage, 100 compute-hours/mo). Data volume here is tiny.
- **No manual unpausing.** Neon's free DB auto-resumes on access. Supabase's free
  tier auto-pauses after 7 days idle and needs manual restore — bad for an app
  opened every few days. This was the deciding factor over Option B.
- **One framework, one language.** Next.js App Router runs UI + API together; great
  DX and trivial Vercel deploys.
- Cloudflare + D1 (Option C) is cheaper-at-scale and never pauses, but would mean
  hand-building auth. Not worth it at this size.

### Components

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | **Next.js 16 (App Router) + TypeScript** | UI + server actions in one app |
| Styling | **Tailwind CSS v4** + hand-rolled component classes | Fast, responsive, no extra design-system deps |
| Auth | **Auth.js (NextAuth v5)**, Credentials provider | Password login now; WebAuthn provider later |
| Password hashing | **bcryptjs** | Pure-JS, no native build step (works anywhere) |
| Database | **Postgres** — local Docker for dev, **Neon** in prod | Free, auto-resume, real SQL |
| DB driver | **node-postgres (`pg`)** | Same driver for local Docker **and** Neon — dev/prod parity |
| ORM / migrations | **Drizzle ORM** + drizzle-kit | Typed schema, simple migrations |
| Validation | **Zod** + server actions (`useActionState`) | Server-side validation with inline field errors |
| Charts | **Recharts** | Composable, responsive, supports overlays + reference areas |
| Dates | **date-fns** | Lightweight date handling |
| Hosting | **Vercel** | First-party Next.js + Neon integration |

> Routing note: the auth guard lives in **`proxy.ts`** (Next 16's replacement for
> `middleware.ts`), wired to Auth.js's edge-safe `auth.config.ts`.

---

## 2. Data model

Three tables. (`users` = logins; `participants` = people measured.)

```
users
  id             uuid pk
  username       text unique not null
  password_hash  text not null
  created_at     timestamptz default now()

participants
  id          uuid pk
  name        text not null
  dob         date not null
  gender      text not null          -- male | female | other | undisclosed
  height_cm   numeric(5,1) not null
  created_at  timestamptz default now()

recordings
  id               uuid pk
  participant_id   uuid fk -> participants(id) on delete cascade
  recorded_on      date not null
  weight_kg        numeric(5,1) not null
  waist_cm         numeric(5,1)
  mood             smallint        -- 1..5
  energy           smallint        -- 1..5
  appetite         smallint        -- 1..5
  mounjaro_dose_mg numeric(4,1)    -- null = none; one of 2.5/5/7.5/10/12.5/15
  notes            text
  created_at       timestamptz default now()
  unique (participant_id, recorded_on)   -- one entry per day per participant
```

Notes:
- **BMI is derived, not stored** — computed from `participants.height_cm` and
  `recordings.weight_kg` at read time. Avoids stale data if height is corrected.
- Check constraints keep the 1–5 scales in range.
- `users` is separate from `participants` by design: one owner login can manage
  several participant profiles.

---

## 3. Application structure

```
auth.config.ts             edge-safe Auth.js config (used by proxy.ts)
auth.ts                    Auth.js + Credentials provider (DB-aware)
proxy.ts                   route guard (Next 16's middleware replacement)
app/
  login/                   login page + form + signIn action
  (app)/                   authenticated layout (nav + participant switcher)
    actions.ts             select participant, sign out
    dashboard/             summary cards + charts
    participants/          list, new, [id] (edit), actions
    recordings/            list + add form, [id] (edit), actions
  api/auth/[...nextauth]/  Auth.js route handler
lib/
  db/            drizzle client + schema
  bmi.ts         BMI calc + WHO category mapping (single source of truth)
  data.ts        queries + active-participant cookie + BMI-enriched reads
  validation.ts  zod schemas, form-state + field-error helpers
components/
  app-nav.tsx, participant-form.tsx, recording-form.tsx, delete-form.tsx
  charts/trends-chart.tsx   overlay chart + banded BMI chart + range picker
scripts/
  seed-user.ts   create/update a login
  seed-demo.ts   load ~4 months of sample data for one participant
drizzle/         generated migrations
docker-compose.yml  local Postgres for offline dev
```

- **Server actions** handle create/edit/delete; data reads happen in server
  components. Minimal client JS (the chart, forms, and nav switcher).
- **Auth guard**: `proxy.ts` runs Auth.js's `authorized` callback on every page
  route, redirecting to `/login` when there's no session.
- **Active participant** is held in a cookie; the nav switcher sets it and the
  dashboard/recordings pages read it (falling back to the first participant).

---

## 4. BMI logic (`lib/bmi.ts`)

```
bmi = weight_kg / (height_cm/100)^2
```

A single function maps a BMI value → `{ category, color, explanation }` using the
WHO bands in the requirements doc. Used by both the chart (colour + tooltip) and
any summary cards, so the categorisation lives in one place.

A dedicated BMI chart draws horizontal **reference bands** (Recharts
`ReferenceArea`) for each WHO range behind the BMI line, and colours each point by
its category; the tooltip pulls the category + explanation from the same function.

---

## 5. Charting approach

Two coordinated charts share one range picker + series toggles (in
`components/charts/trends-chart.tsx`):

1. **Trends** (`ComposedChart`): left axis = weight (kg), waist (cm), BMI; right
   axis (0–5, dashed lines) = mood / energy / appetite. Each series toggles via
   pill buttons.
2. **BMI & WHO categories** (`ComposedChart`): BMI on its own axis so the WHO
   `ReferenceArea` colour bands are meaningful; each point is coloured by its
   category and the tooltip explains it.

- Range picker presets (1M/3M/6M/1Y/All) + custom from/to date inputs filter both
  charts client-side.
- BMI is computed at read time in `lib/data.ts`, so the charts receive it inline.

---

## 6. Auth detail

- **Credentials provider** validates username + bcrypt hash; issues a JWT session.
  The provider lives in `auth.ts` (Node runtime); `proxy.ts` uses the edge-safe
  `auth.config.ts` (no DB import) so the guard runs without bundling `pg`.
- No sign-up route. Logins are created by `scripts/seed-user.ts` (reads
  `SEED_USERNAME` / `SEED_PASSWORD`), hashes, upserts into `users`.
- **Passkeys (later):** Auth.js has a WebAuthn provider; add an authenticators
  table and an "add passkey" flow once password login is solid.

---

## 7. Environment & config

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Postgres connection string (local Docker, or Neon pooled in prod). |
| `AUTH_SECRET` | Auth.js session signing secret (`openssl rand -base64 32`). |
| `AUTH_URL` | App URL (Vercel sets in prod; `http://localhost:3000` local). |
| `SEED_USERNAME` / `SEED_PASSWORD` | Used by the seed script to create the login. |

Local values in `.env.local` (git-ignored); `.env.example` documents them.
Production secrets are set in the Vercel project dashboard.

---

## 8. Local development

- `npm run db:up` starts a local Postgres via `docker-compose.yml` (host port
  5433). `npm run db:migrate` applies the schema; `npm run seed:user` creates the
  login; `npm run seed:demo` loads ~4 months of sample data for one participant.
- `npm run dev` serves at `http://localhost:3000`. Because the app uses the `pg`
  driver, the exact same code runs against local Docker and Neon.

## 9. Deployment

- Deploy via **Vercel CLI** (`vercel`) directly from the local folder — no Git
  required for now (version control deferred per request).
- Neon provides the production `DATABASE_URL`; run `npm run db:migrate` against it,
  then `npm run seed:user` to create the login.
- See `README.md` for exact steps.

---

## 10. Resolved during build

- Waist captured in **cm** (consistent with height).
- 1–5 scales ship with labels (e.g. appetite 1 = suppressed … 5 = very hungry),
  defined in `lib/validation.ts`.
- Goal-weight line deferred to "later" (see functional requirements roadmap).
