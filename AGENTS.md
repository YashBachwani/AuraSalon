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
- **Real-time Engine:** Socket.IO (`socket.io`) for sub-second multi-device state sync (`< 5s` SLA)
- **Database Layer (Dual-Ready Repository):**
  - **Production (Hosted):** PostgreSQL via `pg` (`DATABASE_URL` — Neon or Supabase free tier)
  - **Local Development & Automated Testing:** Zero-config SQLite (`better-sqlite3` / `node:sqlite`) sharing the exact same repository contract so local multi-device testing requires zero external accounts, while production seamlessly connects to hosted PostgreSQL via `DATABASE_URL`.
- **Configuration:** `dotenv` + environment variables (never expose secrets in frontend bundles).

### Hosting & Deployment
- **Frontend:** Vercel (with SPA rewrite rule in `client/vercel.json`)
- **Backend:** Render or Railway
- **Database:** Hosted PostgreSQL (Neon or Supabase)

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
  ├── db/           # Unified SQLite / PostgreSQL repository & seed data
  ├── socket/       # Socket.IO broadcaster
  └── middleware/   # PIN auth guard & centralized error handler
  ```
- Keep responsibilities cleanly separated; never dump business logic or multiple screens into `App.jsx`.
- Use environment variables (`VITE_API_URL`, `DATABASE_URL`, `PORT`, `CLIENT_ORIGIN`, `STAFF_PIN`, `OWNER_PIN`, `SALON_TIMEZONE`). Never hardcode secrets or expose server credentials in frontend code.
- Preserve realistic Indian test/seed data (names like Ravi, Amit, Imran, Aarav Patel, Kunal Shah; 10-digit mobile numbers; INR pricing).
- Keep dependencies minimal—do not add bloated libraries when clean native or Tailwind solutions suffice.

---

## 7. Queue Logic Implementation Rules
1. **Single Source of Truth:** All queue mutations, status transitions, duplicate-phone checks, barber allocations, 30-minute online-closing checks, and waiting-time calculations live centrally in `server/src/services/queueEngine.js`. Frontend screens render server-authoritative data and never invent conflicting queue rules.
2. **State Machine Integrity:** Strictly enforce:
   - `WAITING → CALLED → IN_CHAIR → DONE`
   - `WAITING → CANCELLED`
   - `CALLED → NO_SHOW`
   - `CALLED → CANCELLED`
   - Reject all backward or terminal-exit transitions with HTTP `409`.
3. **Concurrency Safety:** Serialize critical queue mutations (`join`, `call-next`, `start`, `complete`, `no-show`, `cancel`) using an atomic server lock / DB transaction so two barbers can never be assigned the same customer and no barber can ever hold more than one active (`CALLED`/`IN_CHAIR`) customer.
4. **Barber Preference Integrity:** Never assign a customer who selected a specific barber to any other barber. `Any Barber` customers may be allocated to any eligible available on-duty barber in FCFS order.
5. **Break & Duty Protection:** Never allocate customers to `ON_BREAK` or `OFF_DUTY` barbers. Prevent going `ON_BREAK` or `OFF_DUTY` while a barber has an active `CALLED` or `IN_CHAIR` customer.
6. **Online Closing vs Walk-ins:** Automatically block online joining 30 minutes before `closeTime` (or when manually closed by owner), while keeping Reception Walk-in registration open.

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
1. **Database:** Provision a hosted PostgreSQL database (Neon or Supabase) and copy the `DATABASE_URL` connection string.
2. **Backend (Render / Railway):**
   - Deploy `server/` as a Node.js web service (`npm install`, `npm start`).
   - Set environment variables: `DATABASE_URL`, `CLIENT_ORIGIN` (Vercel production URL), `STAFF_PIN`, `OWNER_PIN`, `SALON_TIMEZONE=Asia/Kolkata`, `NODE_ENV=production`.
3. **Frontend (Vercel):**
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
