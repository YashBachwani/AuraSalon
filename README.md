# Salon Queue Management System

**Live demo:** *Pending deployment (will be added after Stage 10 live deployment)*

**Hosted on:** Vercel (Frontend) + Render / Railway (Backend) + SQLite / Turso libSQL (Free Tier)

**Staff test login/PIN:** *Pending configuration (will be populated with actual configured demo PINs once Stage 1–10 deployment is finalized)*

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
*Screenshots of all seven screens (Mobile Customer, Tablet Reception, Mobile Barber, TV Display, and Owner Dashboard) will be added after implementation and UI polish in Stage 8.*

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

