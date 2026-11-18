# AGENTS.md — Project-Wide Engineering & Agent Instructions

This file governs all design, development, testing, and deployment work on the **Salon Queue Management System**. Every agent and developer **must** read `AGENTS.md` and the relevant specification documents in `docs/` before starting any task.

---

## 1. Project Summary
The **Salon Queue Management System** (*Aura Salon* / *ઓરા સલૂન*) is a full-stack, real-time, multi-device digital queue management platform supporting four user roles (**Customer**, **Receptionist**, **Barber**, and **Salon Owner**) plus a passive **Waiting-Area TV Display** across **seven screens**, with complete **English & Gujarati** localization.

---

## 2. Technology Stack

### Frontend (`client/`)
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS (custom salon charcoal & gold design tokens)
- **Routing:** React Router (`react-router-dom`)
- **Icons:** Lucide React (`lucide-react`)
- **Real-time Client:** `socket.io-client`
- **Localization:** Lightweight centralized i18n React Context reading `client/src/locales/en.json` and `client/src/locales/gu.json`

### Backend (`server/`)
- **Runtime & Server:** Node.js + Express.js
- **Real-time Engine:** Socket.IO (`socket.io`) targeting live multi-device updates within 5 seconds under normal network conditions, with automatic reconnection, authoritative REST state refresh after reconnect, clear connection indicators, and safe handling of failed requests and duplicate actions.
- **Database Architecture (Final Single-Engine Decision — SQLite / libSQL via `@libsql/client`):**
  - **One Engine, One Schema, Zero Dual-Database Abstraction:** We intentionally avoid maintaining two separate database engines (SQLite + PostgreSQL) and a complex repository abstraction layer. Instead, the backend uses **one SQLite/libSQL database engine** accessed through a single lightweight `@libsql/client` driver and one SQL schema:
    - **Local Development:** `DATABASE_URL=file:./data/salon.db` — zero external signup, Docker, or local DB server required; persists cleanly on disk.
    - **Automated Testing:** `DATABASE_URL=:memory:` — fast, isolated in-memory SQLite per test run.
    - **Multi-Device Synchronization:** All devices connect to the single Express + Socket.IO server, which coordinates atomic write transactions and broadcasts live updates.
    - **Free Production Deployment:** Works with **zero paid services** on Render/Railway free tier—either connected to a free Turso libSQL database (`DATABASE_URL=libsql://...` + `DATABASE_AUTH_TOKEN`, free starter plan, no credit card required) for permanent cross-deploy persistence, or using a local SQLite file (`file:./data/salon.db`) for zero-account ephemeral demos.
- **Simple Staff PIN Auth:** Backend-validated numeric PINs configured via environment variables (`STAFF_PIN`, `OWNER_PIN`) with no user registration, password recovery, or complex role-management infrastructure.
- **Configuration:** `dotenv` + environment variables (never expose secrets in frontend bundles).

### Hosting & Deployment
- **Frontend:** Vercel (with SPA rewrite rule in `client/vercel.json`)
- **Backend:** Render or Railway (free tier)
- **Database:** Turso libSQL free tier (`libsql://...`) or SQLite file (same single SQLite engine, zero paid services)

---

## 3. Development and Run Commands

*(Commands will be active once Stage 1 project setup is completed.)*

```bash
# Install dependencies (from repository root)
npm install
npm --prefix client install
npm --prefix server install

# Run backend & frontend concurrently in development
npm run dev

# Or run individually:
npm --prefix server run dev      # Express + Socket.IO server (default http://localhost:4000)
npm --prefix client run dev      # Vite React app (default http://localhost:5173)

# Production build verification (frontend)
npm --prefix client run build

# Run backend queue engine & API tests
npm --prefix server test
```

---

## 4. Documentation References
Always consult these authoritative documents before changing code:
- [`docs/01-brief.md`](docs/01-brief.md) — Project brief, target users, in-scope & out-of-scope rules.
- [`docs/02-screens.md`](docs/02-screens.md) — Detailed specification of all 7 screens, UI hierarchy, states, and responsive layouts.
- [`docs/03-flows-rules.md`](docs/03-flows-rules.md) — User journeys, queue state machine, barber allocation, wait-time formula, edge cases, and QA test checklist.
- [`README.md`](README.md) — Public repository documentation, setup, and live deployment info.
- [`prompts.md`](prompts.md) — Chronological record of all prompts used during development.

---

## 5. UI & UX Guidelines
1. **Brand Tokens:**
   - Primary Background: `#1F2937`
   - Elevated Card Surface: `#111827` / `#283548` with `#374151` borders
   - Primary Gold Accent: `#D4A017` (Hover `#E5B32A`)
   - Supporting Palette: crisp white `#F9FAFB`, warm grey `#D1D5DB`, muted gold tints, and semantic status pills.
2. **Commercial Craftsmanship:** Look like a refined commercial salon platform—never a generic SaaS template. Avoid loud gradients, unnecessary glassmorphism, and excessive animations.
3. **Interactive States:** Every interactive element must provide clear hover, focus-visible, active, disabled, and loading states.
4. **Mobile Touch Targets:** Minimum `44px × 44px` tap targets on mobile and tablet controls; primary Barber actions (`START`, `DONE`) must be `56px` tall.
5. **Device Optimization:**
   - Customer (`/`, `/join`, `/status/:id`) & Barber (`/barber/:name`): Mobile-first, one-handed usability.
   - Reception (`/reception`): 10-inch tablet landscape split layout (barber cards left, waiting queue table right).
   - TV Display (`/display`): High-contrast 16:9 layout readable from ~5 metres (`72px+` token numbers).
   - Owner (`/admin`): Responsive management dashboard.
6. **Zero Fake Controls:** Never render decorative or non-functional buttons. Every visible button must execute its specified action.
7. **Complete Screen States:** Every screen must explicitly implement Loading, Empty, and Error states as defined in `docs/02-screens.md`.

---

## 6. Coding Guidelines
- **Repository & Source Layout:**
  ```text
  client/src/
  ├── components/   # Reusable UI primitives & shared widgets
  ├── pages/        # The 7 screen route components
  ├── layouts/      # Shared shells (Customer, Staff, TV)
  ├── services/     # API client & Socket.IO singleton
  ├── hooks/        # Custom React hooks (live queue sync, timers, audio/vibrate)
  ├── context/      # LanguageContext, AuthContext, QueueSyncContext
  ├── locales/      # en.json, gu.json
  ├── utils/        # Pure formatters (time, INR currency, phone masking)
  ├── assets/       # Brand SVG logo / static assets
  └── styles/       # Global Tailwind setup & custom keyframes
  server/src/
  ├── routes/       # Express REST endpoints
  ├── services/     # Centralized queueEngine.js & waitTimeCalculator.js
  ├── db/           # Single SQLite/libSQL client (@libsql/client), schema & seed
  ├── socket/       # Socket.IO broadcaster
  └── middleware/   # Simple PIN auth guard & centralized error handler
  ```
- Keep responsibilities cleanly separated; never dump business logic or multiple screens into `App.jsx`.
- Use environment variables (`VITE_API_URL`, `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `PORT`, `CLIENT_ORIGIN`, `STAFF_PIN`, `OWNER_PIN`, `NO_SHOW_GRACE_MINUTES`, `SALON_TIMEZONE`). Never hardcode secrets or expose server credentials in frontend code.
- Preserve realistic Indian test/seed data (names like Ravi, Amit, Imran, Aarav Patel, Kunal Shah; 10-digit mobile numbers; INR pricing).
- Keep dependencies minimal—do not add bloated libraries when clean native or Tailwind solutions suffice.

---

## 7. Queue Logic Implementation Rules
1. **Single Source of Truth:** All queue mutations, status transitions, duplicate-phone checks, barber allocations, 30-minute online-closing checks, 10-minute no-show grace checks, and approximate waiting-time calculations live centrally in `server/src/services/queueEngine.js`. Frontend screens render server-authoritative data and never invent conflicting queue rules.
2. **Separate Status Models:**
   - **Barber Availability:** `AVAILABLE`, `BUSY`, `ON_BREAK`, `OFF_DUTY`.
   - **Queue-Entry Status:** `WAITING`, `CALLED`, `IN_CHAIR`, `DONE`, `NO_SHOW`, `CANCELLED`.
3. **Queue State Machine Integrity:** Strictly enforce:
   - `WAITING → CALLED → IN_CHAIR → DONE`
   - `WAITING → CANCELLED`
   - `CALLED → NO_SHOW` (strictly after 10-minute grace period from `calledAt`)
   - `CALLED → CANCELLED`
   - Reject all backward or terminal-exit transitions with HTTP `409`.
4. **Concurrency Safety:** Serialize critical queue mutations (`join`, `call-next`, `start`, `complete`, `no-show`, `cancel`) using an atomic server lock and SQLite write transaction so two barbers can never be assigned the same customer and no barber can ever hold more than one active (`CALLED`/`IN_CHAIR`) customer.
5. **Barber Availability & Preference Integrity:**
   - A barber cannot receive another customer while `BUSY`, `ON_BREAK`, or `OFF_DUTY`.
   - A barber cannot go `ON_BREAK` (or `OFF_DUTY`) while handling an active `CALLED` or `IN_CHAIR` customer.
   - A barber who is `ON_BREAK` remains **visible** in customer barber selection (`/join` & Walk-in), but **does not accept new bookings** until available again.
   - Existing customers who already selected a specific barber remain assigned to that barber and are **never** reassigned to another barber.
   - `Any Barber` customers may be allocated to any eligible `AVAILABLE` on-duty barber in FCFS order.
6. **Consistent 10-Minute No-Show Rule:** Timer begins when a customer becomes `CALLED`; Reception shows a live countdown/elapsed timer; `No-show` becomes available after 10 minutes; confirming marks entry `NO_SHOW` and returns the barber to `AVAILABLE`; returning customers must join again to receive a new token at the end of the queue.
7. **Approximate Waiting-Time Estimation:** Clearly label waiting times as approximate. Maintain separate calculations for **Any Barber** vs **Specific Barber**, and never violate barber preferences to fabricate a shorter estimate.
8. **Online Closing vs Walk-ins:** Automatically block online joining 30 minutes before `closeTime` (or when manually closed by owner), while keeping Reception Walk-in registration open until salon closing.

---

## 8. Language Handling Rules (English & Gujarati)
1. **Zero Hardcoded UI Copy:** Every label, button, heading, validation message, status pill, empty state, error toast, and modal text must come from `client/src/locales/en.json` and `client/src/locales/gu.json`.
2. **Dynamic Bilingual Data:** Services (`nameEn`, `nameGu`) and Salon Name (`salonNameEn`, `salonNameGu`) store both English and Gujarati strings in the database and render dynamically based on the active language.
3. **State Preservation:** Switching between English and Gujarati must update the entire interface instantaneously without resetting form fields, selected services, modals, or route parameters.
4. **Key Parity:** Every translation key added to `en.json` must immediately have an accurate, natural Gujarati counterpart in `gu.json`.

---

## 9. Testing Requirements
1. Never claim a feature or screen works simply because its JSX compiles or renders.
2. Execute real end-to-end interactions against the running backend and database for every stage.
3. Verify multi-device real-time sync using simultaneous browser windows/sessions (Customer + Reception + Barber + TV + Owner).
4. In Stage 9, run every single test case (`TC-01` through `TC-12`) from `docs/03-flows-rules.md`, report exact PASS/FAIL results with verification evidence, fix any failures, and re-verify.
5. Test responsive layouts at Mobile (`375px`), Tablet Landscape (`1024px–1280px`), and TV (`1920×1080`) viewports.

---

## 10. Deployment Instructions
1. **Database (Free Tier, Zero Paid Services):** Create a free Turso libSQL database (`libsql://...`) and auth token (`DATABASE_AUTH_TOKEN`) for permanent persistence across deploys—or leave `DATABASE_URL=file:./data/salon.db` for an ephemeral zero-account demo instance.
2. **Backend (Render / Railway Free Tier):**
   - Deploy `server/` as a Node.js web service (`npm install`, `npm start`).
   - Set environment variables: `DATABASE_URL`, `DATABASE_AUTH_TOKEN` (when using Turso), `CLIENT_ORIGIN` (Vercel production URL), `STAFF_PIN`, `OWNER_PIN`, `NO_SHOW_GRACE_MINUTES=10`, `SALON_TIMEZONE=Asia/Kolkata`, `NODE_ENV=production`.
3. **Frontend (Vercel Free Tier):**
   - Deploy `client/` with root directory `client`, build command `npm run build`, output directory `dist`.
   - Include `client/vercel.json` SPA rewrite so refreshing `/status/:id`, `/reception`, `/barber/:name`, `/display`, or `/admin` never returns 404.
   - Set environment variable: `VITE_API_URL` (Render/Railway production backend URL).
4. **Production Verification:** Confirm zero `localhost` URLs in production bundles, clean client-side route reloads, functioning real-time Socket.IO sync over HTTPS/WSS, and no exposed private keys.
5. **Never invent live URLs:** Only update `README.md` with the live URL and credentials after real deployment succeeds.

---

## 11. Rules for Modifying Existing Screens
1. Read `AGENTS.md` and the relevant section of `docs/02-screens.md` and `docs/03-flows-rules.md` before editing any file.
2. Work incrementally—one screen or feature per stage/task.
3. Do not touch unrelated screens or remove existing working features when implementing a new task.
4. Never invent out-of-scope features (payments, future appointments, SMS/WhatsApp, loyalty, multi-branch).
5. When diagnosing a bug, explain the root cause clearly before applying a targeted fix.
6. If approved requirements change, update the corresponding `docs/*.md` files first to keep documentation and code synchronized.
7. After every task, report all created/modified files and verify the application runs cleanly before committing to Git.

