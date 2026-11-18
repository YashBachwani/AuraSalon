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
*(Available after Stage 1 setup)*
```bash
git clone <repository-url>
cd salon-queue
npm install
npm --prefix client install
npm --prefix server install
```

## Environment Configuration
*(Exact `.env.example` files will be created in Stage 1)*
- **Server (`server/.env`):** `PORT`, `CLIENT_ORIGIN`, `DATABASE_URL` (optional locally; required in production), `STAFF_PIN`, `OWNER_PIN`, `SALON_TIMEZONE`
- **Client (`client/.env`):** `VITE_API_URL`

## How to Run Locally
```bash
npm run dev
```
- Frontend runs at `http://localhost:5173`
- Backend runs at `http://localhost:4000`

## Testing Instructions
Run the automated backend queue engine tests (`npm --prefix server test`) and execute all 12 manual/end-to-end test cases documented in [`docs/03-flows-rules.md`](docs/03-flows-rules.md).

## Deployment Details
Full step-by-step deployment instructions for Vercel, Render/Railway, and SQLite / Turso libSQL (free tier) are documented in [`AGENTS.md`](AGENTS.md) and will be verified in Stage 10.

