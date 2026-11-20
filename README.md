# Salon Queue Management System

**Live demo:** *Pending deployment (will be added after Stage 10 live deployment)*

**Hosted on:** Vercel (Frontend) + Render / Railway (Backend) + SQLite / Turso libSQL (Free Tier)

### Demo Test Accounts & Quick Login Credentials (`/login`)

The application features a role-based authentication portal at `/login` with 1-click demo autofill buttons:

| Role | Account / Identifier | Demo Credential | Target Route | Isolation & Access Rules |
|---|---|---|---|---|
| **Customer** | Mobile: `9876543210` | Code: `123456` | `/customer` | Customer portal showing active ticket, live wait tracker link, and visit history. Cannot access Reception/Admin; cannot view other customers' tickets. |
| **Barber (Ravi)** | Select: `Ravi` (ID: 1) | PIN: `1234` | `/barber/ravi` | Chair workspace with start/complete controls. Cannot access Amit/Imran's workspace or Admin dashboard. |
| **Barber (Amit)** | Select: `Amit` (ID: 2) | PIN: `1234` | `/barber/amit` | Chair workspace for Amit. Cannot access other barbers' chairs. |
| **Barber (Imran)** | Select: `Imran` (ID: 3) | PIN: `1234` | `/barber/imran` | Chair workspace for Imran. Cannot access other barbers' chairs. |
| **Reception** | Staff Profile | PIN: `1234` | `/reception` | Full queue table, Call Next, walk-in registration, 10-min no-show management. |
| **Salon Owner** | Administrator | PIN: `5678` | `/admin` | Owner settings, service catalog, barber roster, salon operating hours, daily stats. |

---

## Project Introduction
The **Salon Queue Management System** (*Aura Salon* / *ઓરા સલૂન*) is a real-time, multi-device web platform built for modern salons to digitize customer queues across four user roles (**Customer**, **Receptionist**, **Barber**, and **Salon Owner**) plus a public **Waiting-Area TV Display**, with complete **English** and **Gujarati** language support.

## Problem Statement
Walk-in salon customers frequently face unpredictable wait times, crowded waiting areas, and unclear barber availability, while receptionists manually juggle paper registers and phone inquiries. This platform replaces manual guesswork with synchronized digital queue joining, live wait estimates, barber chair management, and waiting-area TV visibility.

## Main Features
- **Remote Queue Joining:** Mobile-first customer flow with 10-digit phone validation, duplicate-phone protection, multi-service selection (up to 3 services), live INR pricing & duration totals, and preferred barber selection.
- **Live Customer Status Tracker:** Real-time queue position, estimated wait countdown, *"You're almost next! Start coming to the salon."* alert, full-screen gold *"It's Your Turn!"* notification with pulse/vibration, and self-cancellation.
- **Reception Dashboard (10-inch Tablet Landscape):** Unified online + walk-in FCFS queue, live barber chair cards, atomic `Call Next` respecting barber preferences, `No-show` (10-min rule), `Cancel`, search, and amber highlighting for waits over 60 minutes.
- **Barber Mobile View:** Focused interface with large `START` and `DONE` buttons, live service timer, `On Break / Available` toggle, and next-customer preview.
- **Waiting Area TV Display:** High-contrast 5-metre-readable display showing active barber tokens, gold call-out animation with optional chime, and the next 5 upcoming tokens.
- **Owner Management Dashboard:** Manage services (EN/GU names, durations, INR prices, active toggles), barbers (duty & availability), opening/closing hours with automatic 30-minute online-join cutoff, and Today's Statistics.
- **Bilingual Support:** Instant English & Gujarati toggle across all 7 screens without losing state.

## Technology Stack
- **Frontend:** React, Vite, Tailwind CSS, React Router, Lucide React, Socket.IO Client
- **Backend:** Node.js, Express.js, Socket.IO
- **Database:** Single SQLite / libSQL engine via `@libsql/client` (`file:./data/salon.db` locally, `:memory:` in automated tests, Turso free tier `libsql://...` or local SQLite in production)
- **Hosting:** Vercel (Frontend), Render / Railway (Backend)

## Screenshots
- **Stage 3 Role-Based Demo Login Screenshots:**
  - Role-Based Demo Login Desktop (1280px): `screenshots/login_desktop_1280.png`
  - Role-Based Demo Login Mobile (375px): `screenshots/login_mobile_375.png`
- **Stage 2 Verified Screenshots:**
  - Home Page Desktop (1440px): `screenshots/home_desktop_1440.png`
  - Join Queue Page Desktop (1440px): `screenshots/join_desktop_1440.png`
  - Home Page Tablet (1024px): `screenshots/home_tablet_1024.png`
  - Home Page Mobile (375px): `screenshots/home_mobile_375.png`
  - Home Page Navbar & Services Desktop (1280px): `screenshots/home_navbar_services_1280.png`
  - Home Page Navbar Mobile (375px): `screenshots/home_navbar_mobile_375.png`
  - Join Queue Page Mobile (375px): `screenshots/join_mobile_375.png`
- **End-to-End Live Queue Verified Screenshots:**
  - Reception Dashboard Live Sync: `screenshots/e2e_reception_verified.png`
  - Customer Live Status Tracker (`/status/:id`): `screenshots/e2e_customer_status_verified.png`
  - Barber Chair Management (`/barber/:name`): `screenshots/e2e_barber_ravi_verified.png`
  - Waiting Area TV Display (`/display`): `screenshots/e2e_tv_display_verified.png`

## API Endpoints
### Authentication & Role Authorization (`/api/auth`)
- `POST /api/auth/login` — Authenticate Customer (phone + demo code), Barber (barberId + PIN), Reception (staff PIN), or Owner (owner PIN). Returns HMAC-SHA256 signed session token.
- `GET /api/auth/me` — Verify and restore authenticated user session and active ticket.
- `POST /api/auth/logout` — Revoke and invalidate session token.
- `GET /api/auth/demo-credentials` — Public demo credentials catalog for fast evaluator testing.
- `GET /api/auth/customer/dashboard` — Authenticated Customer portal data (active queue ticket + past visit history).

### Queue Management & Operations (`/api/queue`)
- `POST /api/queue/walkin` — Reception walk-in registration (open during salon operating hours).
- `GET /api/queue` — Full active queue with dynamic wait-time & queue position calculations.
- `GET /api/queue/:id` — Single customer status tracking by ID or token number.
- `GET /api/queue/barber/:name` — Dedicated barber queue with active customer and upcoming roster.
- `GET /api/queue/display` — 16:9 Waiting TV display payload with active chairs & upcoming tokens.
- `POST /api/queue/call-next` — Call next customer for a barber respecting preferences and FCFS order.
- `POST /api/queue/:id/start` — Barber starts customer service (`CALLED` -> `IN_CHAIR`).
- `POST /api/queue/:id/complete` — Barber completes customer service (`IN_CHAIR` -> `DONE`).
- `POST /api/queue/:id/no-show` — Reception marks customer No-Show (enforces 10-minute grace timer).
- `POST /api/queue/:id/cancel` — Customer or reception cancels spot (`WAITING` or `CALLED`).
- `PATCH /api/barbers/:id/availability` — Barber toggles break/available state.

### Owner Analytics & Administration (`/api/admin`)
- `GET /api/admin/analytics?range=today|7d|30d|all` — Authenticated Owner-only analytics endpoint returning authoritative KPIs (`todayOverview`), revenue breakdown (`revenueOverview`), wait & service timings (`queueAnalytics`), per-barber metrics (`barberPerformance`), service popularity distribution (`serviceAnalytics`), 7-day daily trend (`dailyTrend`), and recent live queue activity (`recentActivity`).

## Project Structure
```text
salon-queue/
├── AGENTS.md                 # Project-wide engineering & agent rules
├── README.md                 # Project overview, setup, and deployment docs
├── prompts.md                # Chronological development prompt log
├── docs/
│   ├── 01-brief.md           # Project brief, users, scope & exclusions
│   ├── 02-screens.md         # Detailed specification of all 7 screens
│   └── 03-flows-rules.md     # Workflows, queue rules, sync & QA checklist
├── client/                   # React + Vite + Tailwind frontend (Stage 1+)
└── server/                   # Node.js + Express + Socket.IO backend (Stage 1+)
```

## Installation Instructions
```bash
git clone <repository-url>
cd salon-queue
npm run install:all
```
*(Or install packages in root, client, and server folders:)*
```bash
npm install
npm --prefix server install
npm --prefix client install
```

## Environment Configuration
Copy the provided `.env.example` templates to `.env`:
```bash
# Server (.env)
cp server/.env.example server/.env

# Client (.env)
cp client/.env.example client/.env
```
Key environment variables:
- **Server (`server/.env`):**
  - `PORT`: Server port (default `4000`)
  - `CLIENT_ORIGIN`: Allowed client URL (default `http://localhost:5173`)
  - `DATABASE_URL`: `file:./data/salon.db` for zero-config local SQLite; `:memory:` for automated testing; `libsql://...` for free Turso libSQL in production
  - `DATABASE_AUTH_TOKEN`: Auth token when using Turso (leave blank for local SQLite)
  - `STAFF_PIN`: Numeric staff PIN for Reception & Barber portals (default `1234`)
  - `OWNER_PIN`: Numeric owner PIN for Admin dashboard (default `5678`)
  - `NO_SHOW_GRACE_MINUTES`: Grace duration before No-show activates (default `10`)
  - `SALON_TIMEZONE`: Salon timezone (default `Asia/Kolkata`)
- **Client (`client/.env`):**
  - `VITE_API_URL`: Backend server origin (default `http://localhost:4000`)

## How to Run Locally
Run both server and client concurrently:
```bash
npm run dev
```
Or run individually:
```bash
npm --prefix server run dev   # Express + Socket.IO server on http://localhost:4000
npm --prefix client run dev   # Vite React app on http://localhost:5173
```
- Customer Mobile Web: `http://localhost:5173`
- Join Queue: `http://localhost:5173/join`
- My Status Tracker: `http://localhost:5173/status/:id`
- Reception Dashboard (Tablet Landscape): `http://localhost:5173/reception`
- Barber View (Mobile Chair): `http://localhost:5173/barber/:name`
- Waiting Area TV Display (16:9 Fullscreen): `http://localhost:5173/display`
- Owner Settings & Analytics: `http://localhost:5173/admin`

## Testing Instructions
Run the automated test suite:
```bash
# Backend unit & integration tests
npm --prefix server test

# Frontend production build verification
npm --prefix client run build

# Client route and translation key validation
node client/test_routes.js
```

## Deployment Details
Full step-by-step deployment instructions for Vercel, Render/Railway, and SQLite / Turso libSQL (free tier) are documented in [`AGENTS.md`](AGENTS.md) and will be verified in Stage 10.

