# Functional Requirements — Weight Tracker

A small, mobile-responsive web app for tracking a Mounjaro (tirzepatide) weight-loss
journey: weight, waist, wellbeing, dose, and BMI over time, with overlaid graphs.

Status: draft for build. Decisions captured from initial scoping (2026-06-20).

---

## 1. Scope & principles

- **Personal, low-traffic app.** One owner logs in; the app holds one or more
  *participant* profiles (e.g. you + partner).
- A **participant** is the person being measured — not a login. There is a single
  app login (no public sign-up).
- Mobile-first and responsive — primary use is entering a reading on a phone.
- Keep it simple and cheap to run (free hosting tier).

---

## 2. Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-1 | Log in with **username + password**. | v1 |
| AUTH-2 | No public registration flow. Owner account(s) are seeded by an admin script. | v1 |
| AUTH-3 | Session persists across visits ("remember me"); explicit log-out available. | v1 |
| AUTH-4 | All app pages and data APIs require an authenticated session. | v1 |
| AUTH-5 | **Passkey** (Face ID / Touch ID / security key) login as an additional method. | Later |

Passwords are hashed (argon2/bcrypt); never stored or logged in plaintext.

---

## 3. Participants

| ID | Requirement |
|----|-------------|
| PART-1 | Create/edit a participant: **name, date of birth, gender, height (cm)**. |
| PART-2 | Support **multiple participants**; a switcher selects the active one. |
| PART-3 | Gender captured as a selectable value (male / female / other / prefer not to say). |
| PART-4 | Height is used to derive BMI; editable if mis-entered. |
| PART-5 | Deleting a participant removes their recordings (with a confirmation step). |

---

## 4. Recordings

A recording is one measurement event for a participant.

| ID | Field | Notes |
|----|-------|-------|
| REC-1 | **Date** | Auto-populated to today; user can override. One recording per participant per date (editing an existing date updates it). |
| REC-2 | **Weight (kg)** | Required. Decimal (e.g. 92.4). |
| REC-3 | **Waist (cm)** | Optional. Decimal. |
| REC-4 | **Mood (1–5)** | Optional scale. |
| REC-5 | **Energy (1–5)** | Optional scale, independent of mood. |
| REC-6 | **Appetite (1–5)** | Optional scale (1 = very suppressed … 5 = very hungry). Key Mounjaro signal. |
| REC-7 | **Mounjaro dose (mg)** | Optional. Dropdown: none / 2.5 / 5 / 7.5 / 10 / 12.5 / 15. |
| REC-8 | **Notes** | Optional free text (side effects, context). |
| REC-9 | Add, edit, and delete recordings. List view sorted by date (newest first). |

The 1–5 scales show short labels on hover/entry so values are meaningful later.

---

## 5. BMI

| ID | Requirement |
|----|-------------|
| BMI-1 | BMI computed per recording: `weight_kg / (height_m)²` using the participant's height. |
| BMI-2 | BMI plotted as its own series on the graph. |
| BMI-3 | BMI is **colour-coded by WHO category** (see table) on the chart. |
| BMI-4 | Hovering a BMI point shows the value, its category, and a one-line explanation. |

WHO categories used for colour bands:

| BMI range | Category | Colour intent |
|-----------|----------|---------------|
| < 18.5 | Underweight | blue |
| 18.5 – 24.9 | Healthy weight | green |
| 25.0 – 29.9 | Overweight | amber |
| 30.0 – 34.9 | Obese (class I) | orange |
| 35.0 – 39.9 | Obese (class II) | red |
| ≥ 40.0 | Obese (class III) | dark red |

---

## 6. Graphs & visualisation

| ID | Requirement |
|----|-------------|
| VIS-1 | A single chart **overlays** the series: weight, waist, BMI, and the 1–5 scales. |
| VIS-2 | Weight/waist/BMI on a primary axis; 1–5 scales on a secondary axis (different scale). |
| VIS-3 | **Date-range picker** to zoom the chart (presets: 1m / 3m / 6m / all + custom range). |
| VIS-4 | BMI series rendered against the colour-coded WHO bands (BMI-3). |
| VIS-5 | Series can be toggled on/off via the legend to reduce clutter. |
| VIS-6 | Dose changes are marked on the timeline (e.g. a marker when dose changes). |
| VIS-7 | Tooltips show all values for the hovered date. |
| VIS-8 | Chart and all forms are fully usable on a phone screen. |

---

## 7. Nice-to-have / later

- Passkey login (AUTH-5).
- CSV export / import of recordings.
- Trend summary cards (e.g. total lost, weekly average, weeks on current dose).
- Goal weight line and projected date.

---

## 8. Out of scope (for now)

- Public sign-up, password reset emails, multi-tenant accounts.
- Native mobile apps.
- Integration with scales / wearables / health platforms.
