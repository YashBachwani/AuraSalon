# Development Prompt Log (`prompts.md`)

This file records every prompt used during the design, development, debugging, testing, and deployment of the **Salon Queue Management System** in chronological order (including any unsuccessful or refined prompts).

---

## Stage 0 — Requirements & Documentation

### Prompt 1 — Master Project Instruction & Stage 0 Initiation
- **Date:** 2026-11-18
- **Stage:** Stage 0 — Requirements & Documentation
- **Prompt Summary:**
  > Master Project Instruction for the Salon Queue Management System (MSc IT Vibe Coding Lab). Instructed the agent to act as Senior Product Designer, Software Architect, UI/UX Designer, Full-Stack Engineer, QA Engineer, and Technical Documentation Specialist. Required creating mandatory documentation first (`docs/01-brief.md`, `docs/02-screens.md`, `docs/03-flows-rules.md`, `AGENTS.md`, plus initial `README.md` and `prompts.md`), covering all 7 screens (`/`, `/join`, `/status/:id`, `/reception`, `/barber/:name`, `/display`, `/admin`), centralized queue engine rules, multi-device real-time synchronization (<5s), English & Gujarati localization, dark charcoal (`#1F2937`) & gold (`#D4A017`) visual direction, QA checklist (≥8 cases), and staged development workflow — stopping after Stage 0 for user approval before writing application code.
- **Outcome:** Succeeded — Created all Stage 0 documentation files (`docs/01-brief.md`, `docs/02-screens.md`, `docs/03-flows-rules.md`, `AGENTS.md`, `README.md`, `prompts.md`), verified internal consistency across all 7 screens and business rules, proposed the initial architecture, surfaced design clarifications, and awaited user approval before Stage 1.

---

## Stage 0 Final Review & Stage 1 — Project Setup

### Prompt 2 — Stage 0 Documentation Corrections & Stage 1 Project Setup
- **Date:** 2026-11-18
- **Stage:** Stage 0 Review + Stage 1 — Project Setup
- **Prompt Summary:**
  > Reviewed Stage 0 documentation and requested targeted corrections without regenerating from scratch:
  > 1. Separate Barber Availability (`AVAILABLE`, `BUSY`, `ON_BREAK`, `OFF_DUTY`) from Queue-Entry Status (`WAITING`, `CALLED`, `IN_CHAIR`, `DONE`, `NO_SHOW`, `CANCELLED`), keeping `ON_BREAK` barbers visible in customer selection but unable to accept new bookings while preserving existing specific-barber assignments.
  > 2. Make the 10-minute No-show grace period consistent everywhere (timer starts on `CALLED`, `No-show` becomes available after 10 minutes, confirming frees the barber, returning customers get a new token).
  > 3. Simplify the database architecture to one reliable persistence engine suitable for local dev, automated testing, multi-device sync, and free production deployment without paid services.
  > 4. Replace absolute `< 5s` guarantee with target updates within 5 seconds under normal network conditions, automatic reconnection, authoritative state refresh after reconnection, connection indicators, and safe failure/duplicate handling.
  > 5. Clarify waiting times are approximate, keep Any Barber vs Specific Barber calculations separate, and never violate barber preferences.
  > 6. Keep Staff PIN simple (backend-validated, env-configured, no complex auth/IAM).
  > 7. Commit documentation updates cleanly before starting Stage 1.
  > Then implement Stage 1 only: React + Vite + Tailwind + React Router + Lucide + Express + Socket.IO + single database setup (`@libsql/client`), Aura Salon charcoal/gold design system, all 7 route screens, reusable components, loading/empty/error states, English & Gujarati translations + state-preserving toggle, `.env.example`, health-check endpoint, responsive verification (375px, 1024px, 1440px, 1920×1080), and production frontend build.
- **Outcome (Part A & B):** Succeeded — Applied all 7 targeted documentation corrections across `AGENTS.md`, `docs/01-brief.md`, `docs/02-screens.md`, `docs/03-flows-rules.md`, and `README.md`; finalized single-engine SQLite/libSQL (`@libsql/client`) persistence decision; committed documentation updates cleanly (`8e5f541`) before writing application code.
- **Outcome (Stage 1 Project Setup):** Succeeded:
  - Initialized React 18 + Vite + Tailwind CSS + React Router v6 + Lucide React in `client/`.
  - Configured custom salon dark charcoal (`#1F2937`), elevated card (`#111827`/`#263345`), and gold (`#D4A017`) design tokens in `tailwind.config.js` and `src/styles/index.css`.
  - Created reusable UI primitives: `Button` (primary/secondary/outline/danger/ghost, 44px–56px tap targets), `Card` (elevated & gold-accented), `Input` (prefix, helper, error states), `Badge` (semantic tones, dot indicators), and `LoadingState`, `EmptyState`, and `ErrorState`.
  - Built the three shared layout shells: `CustomerLayout` (mobile-first, back button, staff quick-links), `StaffLayout` (live clock, navigation tabs for Reception/Barber/Display/Admin), and `DisplayLayout` (16:9 full-screen, 5m readability, full-screen toggle).
  - Scaffolded all 7 route screens (`/`, `/join`, `/status/:id`, `/reception`, `/barber/:name`, `/display`, `/admin`, plus `*` 404 handler) with professional Aura Salon branding.
  - Implemented centralized bilingual localization in `client/src/locales/en.json` and `client/src/locales/gu.json` with 138 keys each and verified 100% 1:1 key parity.
  - Implemented `LanguageContext` with `LanguageToggle` pill (`EN | ગુજરાતી`) that switches the entire interface instantaneously without resetting form inputs or active route state.
  - Set up Node.js + Express + Socket.IO backend with single SQLite / libSQL database engine (`@libsql/client`), auto-migrating schema (`salon_settings`, `services`, `barbers`, `queue_entries`), and idempotent Indian seed data (Ravi, Amit, Imran; 6 services with INR pricing).
  - Implemented `/api/health` endpoint reporting database status, realtime clients, and salon metadata; `/api/bootstrap` endpoint; and `/api/auth/verify-pin` validating staff/owner PINs.
  - Implemented live connection status indicator with automatic reconnection and authoritative REST state re-fetching on reconnect and mobile tab wake (`visibilitychange`).
  - Added `.env.example` templates for both server and client; updated `README.md` with complete local commands.
  - Verified backend test suite passes with `node --test` (`health.test.js` and `stage1_e2e.test.js` testing Express, SQLite schema/seed, PIN auth, and Socket.IO handshake/ping).
  - Verified client production build passes cleanly (`vite build` in 2.22s, 0 errors).
  - Verified client route and i18n parity via `node client/test_routes.js`.

---

## Stage 2 — Premium Frontend Design & Development

### Prompt 3 — Stage 2 Premium Frontend Design & Development (Home Page + Join Queue Page)
- **Date:** 2026-11-20
- **Stage:** Stage 2 — Frontend UI Development
- **Prompt Summary:**
  > Instructed to build high-end luxury frontend design for Aura Salon's Home Page (`/`) and Join Queue Page (`/join`). Required visual identity featuring Deep Charcoal (`#171717`), Champagne Gold (`#D4AF70`), Warm Ivory (`#F7F3EC`), Soft Beige (`#E9DFD0`), Muted Grey (`#A5A19A`), White (`#FFFFFF`), Cormorant Garamond serif headings, and generous whitespace. Required scroll-triggered reveals, subtle parallax, frosted sticky navbar, and responsive layouts. Home Page required 9 sections (Navbar, Hero, Experience, Curated Services, Barbers, How It Works, Queue Preview, Final CTA, Footer). Join Queue Page required a 4-step wizard (Details, Services, Barber, Review), 10-digit phone validation, max 3 services selection, live duration/price totals, Any Barber vs Specific Barber choice with `ON_BREAK` disablement, 30-min closing cutoff warning, zero state loss on language switch or back navigation, and exact 1:1 English/Gujarati parity. Prohibited implementing full queue backend or starting Stage 3 early. Required production build verification, tests, Git commit (`feat: build premium home and join queue frontend`), and 375px/1024px/1440px screenshots.
- **Outcome:** Succeeded:
  - Loaded Cormorant Garamond, Plus Jakarta Sans, and Noto Sans Gujarati fonts in `client/index.html`; extended Tailwind theme with luxury color tokens, glow shadows, and shimmer keyframes while maintaining backwards compatibility with Stage 1 tokens.
  - Implemented `useScrollPosition` and `useIntersectionObserver` hooks with immediate `getBoundingClientRect` visibility fallback and reduced-motion support.
  - Created reusable UI components: `ScrollReveal`, `ImageReveal`, `SectionHeading`, `ServiceCard`, `BarberCard`, `QueuePreviewCard`, `PremiumNavbar` (frosted glass transition, mobile drawer), and `PremiumFooter`.
  - Built 9-section luxury Home Page (`client/src/pages/HomePage.jsx`) with curated Unsplash photography for salon interior, services, and resident barbers.
  - Built 4-step progressive Join Queue Page (`client/src/pages/JoinQueuePage.jsx`) with live duration and INR totals, 10-digit phone validation, 3-service maximum constraint, Any Barber selection, `ON_BREAK` disabled booking state, and 30-minute online closing warning banner.
  - Enhanced backend `/api/bootstrap` endpoint to serve the database services catalog array for authentic dynamic rendering.
  - Added 89 new localized strings to both `en.json` and `gu.json` (227 keys each), verifying 100% 1:1 parity and instant language toggle with zero form state loss.
  - Automated headless Chrome script `scripts/capture_screenshots.js` capturing 5 responsive screenshots at 1440px, 1024px, and 375px, saved to `screenshots/` and embedded into artifact `stage2_visual_review.md`.
  - Verified `node client/test_routes.js` (pass), `npm --prefix client run build` (pass in 2.57s), and `npm --prefix server test` (pass, 2/2 tests).
  - Committed changes cleanly with message `feat: build premium home and join queue frontend`.

---

## Critical Fix — End-to-End Live Queue Integration

### Prompt 4 — Connect Customer Registration to Live Queue System
- **Date:** 2026-11-20
- **Stage:** End-to-End Queue Integration & Real-Time Sync
- **Prompt Summary:**
  > Resolved critical problem where joining the queue did not persist or appear across the Reception Dashboard and other live screens. Required investigating existing implementation, implementing real customer join queue API (`POST /api/queue/join` and `POST /api/queue/walkin`), persisting queue entries to the SQLite database via `@libsql/client` with atomic mutex sequence generation, connecting `/status/:id` to real token and status data, updating `/reception` with real-time queue synchronization, connecting `/barber/:name` and `/display` with real live queue entries, broadcasting Socket.IO events (`queue:created`, `queue:updated`, `customer:called`, `queue:started`, `queue:completed`, `queue:no-show`, `queue:cancelled`), executing mandatory tests (TC-01 through TC-14), capturing end-to-end browser verification, and committing with message `feat: connect customer registration to live queue system`.
- **Outcome:** Succeeded:
  - Investigated and diagnosed that `JoinQueuePage.jsx` was previously stopping at a client-side boundary without invoking backend endpoints, and backend queue routes/engine were unmounted.
  - Built `server/src/services/waitTimeCalculator.js` implementing Any Barber and Specific Barber formulas, queue positions, and almost-next flags according to `docs/03-flows-rules.md`.
  - Built `server/src/services/queueEngine.js` with atomic `AsyncMutex` serialization, sequential `S-01` token generation per business date, server-side validation (1-3 services, 10-digit phone, 30-min online join cutoff, barber break state, duplicate active phone rejection), FCFS `callNext` with preference preservation, `startService`, `completeService`, 10-min `markNoShow`, `cancelQueueEntry`, and Socket.IO broadcasts.
  - Built `server/src/routes/queue.js` mounting `/api/queue` and `/api/barbers` in `app.js`.
  - Updated `client/src/services/api.js` with all queue endpoints.
  - Connected `JoinQueuePage.jsx` to `api.joinQueue`, loading state, duplicate phone ticket recovery link, and automatic redirection to `/status/:id`.
  - Connected `MyStatusPage.jsx` to live queue entry, Socket.IO updates, "Almost Next" alert, full-screen gold "It's Your Turn!" banner with haptic vibration, and self-cancellation.
  - Connected `ReceptionPage.jsx` to live queue table, live search, 10-min No-show countdown, Call Next button, cancel action, and "+ Add Walk-in" modal.
  - Connected `BarberPage.jsx` with real assigned customer chair, large 56px START and DONE controls, live service timer, break toggle, and upcoming customer preview.
  - Connected `DisplayPage.jsx` with high-contrast active chair cards, "NOW CALLING" flash highlights, and next 5 upcoming tokens.
  - Maintained 100% bilingual parity across `en.json` and `gu.json` (299 keys each).
  - Executed automated integration test suite in `server/src/queue_integration.test.js` covering TC-01 through TC-14 (all 14 passed).
  - Executed full 18-step end-to-end workflow verification in `scripts/e2e_full_workflow.js` with real multi-screen Socket.IO sessions and captured 4 real headless Chrome screenshots.
  - Verified `npm --prefix client run build` passed cleanly in 2.36s.
  - Committed changes cleanly with message `feat: connect customer registration to live queue system`.

---

## Bug Fixes & Refinements — Owner Analytics & Homepage Navbar

### Prompt 6 — Repair Owner Analytics Data Flow & Improve Homepage Sticky Navigation
- **Date:** 2026-11-20
- **Stage:** Feature Fix & UI Refinement (Owner Dashboard Statistics & Homepage Navbar Experience)
- **Prompt Summary:**
  > Fix two critical remaining issues:
  > 1. Owner Dashboard Statistics: Connect statistics displayed in `/admin` to authoritative SQLite database records instead of static placeholders. Provide real-time Socket.IO synchronization, date range filtering (`today`, `7d`, `30d`, `all`), KPI cards, 7-day trend chart, service popularity ranking, barber performance matrix, and recent queue activity log. Protect with Owner-only role authentication.
  > 2. Homepage Navbar UI: Improve scrolling behavior, sticky navbar backdrop transitions (transparent airy top vs dark luxury scrolled), smooth offset scrolling to sections (`#experience`, `#services`, `#barbers`, `#how-it-works`), cross-page hash navigation, role-tailored CTA buttons (Guest: Join Queue / Sign In; Customer: Join Queue / My Ticket; Barber: My Chair; Reception: Reception Desk; Owner: Owner Dashboard; staff/owner never see "Join Queue"), and an accessible mobile drawer with backdrop overlay, Escape key listener, body scroll lock, minimum 44px touch targets, and zero horizontal overflow.
- **Outcome:** Succeeded:
  - **Owner Analytics Service (`server/src/services/analyticsService.js`):** Built comprehensive database analytics calculator computing `todayOverview` (total registered, waiting, called, in-chair, completed, no-show, cancelled, all-time customers and entries), `revenueOverview` (today, 7d, 30d, all-time completed revenue with estimation flag), `queueAnalytics` (real avg wait and service duration from timestamps), `barberPerformance` (completed, serving, waiting, and revenue per barber), `serviceAnalytics` (service selection count, revenue, most popular service), `dailyTrend` (7-day daily volume and revenue series), and `recentActivity` (10 latest entries with token, customer, status, services, and stylist).
  - **Owner Admin Route (`server/src/routes/admin.js`):** Mounted `/api/admin/analytics` secured by `authenticateUser` and `requireAuth(['owner'])` returning HTTP 401 for unauthenticated and HTTP 403 for Customer, Barber, or Reception roles.
  - **Rebuilt Owner Dashboard (`client/src/pages/AdminPage.jsx`):** Integrated range filter pills, real-time time-based greeting, manual refresh with spinning indicator, 6 primary KPI cards, secondary status strip, 7-day volume and revenue trend chart with interactive tooltips, service popularity distribution with progress bars, barber performance matrix with real availability status badges, recent activity table, and full Socket.IO event subscriptions with automatic reconnect data refresh.
  - **Redesigned Sticky Premium Navbar (`client/src/components/shared/PremiumNavbar.jsx`):**
    - Smooth scroll detection using `useScrollPosition(30)` with seamless backdrop blur transitions (`glass-nav-top` vs `glass-nav-scrolled`).
    - Smooth scrolling with 84px header offset so sticky navbar never obscures section headings.
    - Added `scroll-mt-24` and cross-page hash watcher on `client/src/pages/HomePage.jsx` to smoothly handle hash navigation from other routes.
    - Role-tailored action CTAs on desktop and mobile:
      - Unauthenticated: "Sign In" link and "Join Queue" primary button.
      - Customer: "Join Queue" button, "My Ticket: #{token_number}" button when active ticket exists, and profile pill.
      - Barber: Dedicated "My Chair" button (`/barber/:slug`), barber name badge, and logout. No "Join Queue".
      - Reception: Dedicated "Reception Desk" button (`/reception`), reception badge, and logout. No "Join Queue".
      - Owner: Dedicated "Owner Dashboard" button (`/admin`), owner crown badge, and logout. No "Join Queue".
    - Polished mobile drawer: slide-in panel, dark backdrop overlay with tap-outside dismiss, Escape key dismiss, body scroll lock (`document.body.style.overflow = 'hidden'`), auto-close on link click, minimum 44px tap targets, and zero horizontal viewport overflow.
  - **Automated Test Suite (`server/src/admin_analytics.test.js`):** Built and executed 15 automated test cases covering owner access, role restrictions, unauthenticated requests, and real-time metric updates across customer registration, call-next, start-service, complete-service, and cancellation.
  - **Verification:**
    - All 52 automated tests in 5 suites passed 100% (`node --test server/src/*.test.js`).
    - 100% 1:1 translation parity maintained across `client/src/locales/en.json` and `client/src/locales/gu.json` (369 keys each verified via `node client/test_routes.js`).
    - Full end-to-end multi-device workflow verified with `scripts/verify_owner_analytics_and_navbar.js` and `scripts/e2e_full_workflow.js`.
    - Production build verified with `npm --prefix client run build` (built cleanly in 2.48s).
  - Committed changes cleanly with message `fix: repair owner analytics and improve homepage navigation`.


### Prompt 5 — Implement Role-Based Demo Authentication, Dashboards & Visual Theme
- **Date:** 2026-11-20
- **Stage:** Stage 3 (Role-Based Demo Login, User Experience & Visual Refinement)
- **Prompt Summary:**
  > Transform Aura Salon into a complete role-based salon application with two primary objectives:
  > 1. Implement a dedicated role-based demo login system (`/login`) for four roles (Customer, Barber, Reception, Owner) with signed JWT-like HMAC tokens, route guards (`ProtectedRoute`), and strict role-based data and workspace isolation (Customer can only see their own ticket/dashboard; Barber can only access/manage their own chair; Reception and Owner retain staff privileges).
  > 2. Create the Customer Dashboard (`/customer`), refine visual styling with a warmer, more attractive salon identity (`#191817`, `#292622`, `#C89B45`, `#E8C982`, `#F5EFE4`, `#D9D0C2`, `#9B7650`, `#A8A096`), provide 1-click quick-fill demo credentials, write an automated test suite covering 20 test cases, maintain 100% English & Gujarati parity, and commit with message `feat: add role-based demo authentication and dashboards`.
- **Outcome:** Succeeded:
  - Built zero-dependency HMAC-SHA256 token signing and verification service (`server/src/services/authService.js`) with unique `jti` nonces, token revocation on logout, role authenticators (`authenticateCustomer`, `authenticateBarber`, `authenticateReception`, `authenticateOwner`), and dynamic demo credentials catalog generation from SQLite.
  - Implemented authentication and authorization middleware (`server/src/middleware/authMiddleware.js`) supporting Bearer tokens and legacy PIN header fallback, with role guards rejecting cross-role and unauthorized workspace access.
  - Created authentication REST API (`server/src/routes/auth.js`) mounting `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/demo-credentials`, and `/api/auth/customer/dashboard`.
  - Added strict role guards across `server/src/routes/queue.js`: customer ticket isolation (customer can only view their own ticket, 403 on others), barber workspace isolation (barber can only manage their own chair, 403 on others), and staff action enforcement.
  - Built frontend `AuthContext` (`client/src/context/AuthContext.jsx`) and `ProtectedRoute` enforcing role access and barber slug isolation with automated redirect on login and logout.
  - Created luxury Role-Based Demo Login page (`client/src/pages/LoginPage.jsx`) at `/login` with 4 role cards, demo mode banners, 1-click autofill buttons, and auto-redirect.
  - Created Customer Dashboard (`client/src/pages/CustomerDashboardPage.jsx`) at `/customer` displaying active booking card with live tracker link, empty state with Join Queue CTA, and past visit history.
  - Updated `PremiumNavbar.jsx` and `StaffLayout.jsx` with user profile pills, role icons, and logout controls for both desktop and mobile viewports.
  - Added Stage 3 warm luxury palette tokens to `client/tailwind.config.js` (`warmBg`, `warmCard`, `antiqueGold`, `champagneGold`, `warmIvory`, `softBeige`, `bronze`, `warmMuted`).
  - Added 38 new translation keys to both `client/src/locales/en.json` and `client/src/locales/gu.json` maintaining 100% 1:1 key parity (337 keys each).
  - Wrote automated test suite `server/src/auth_rbac.test.js` validating all 20 required test cases:
    - TC-01: Customer login succeeds with valid demo credentials (phone: 9876543210, code: 123456)
    - TC-02: Customer login fails with invalid verification code
    - TC-03: Barber login succeeds for Ravi with valid PIN (1234)
    - TC-04: Barber login succeeds for Amit with valid PIN (1234)
    - TC-05: Barber login succeeds for Imran with valid PIN (1234)
    - TC-06: Barber login fails with invalid PIN
    - TC-07: Reception login succeeds with valid staff PIN (1234)
    - TC-08: Reception login fails with invalid PIN
    - TC-09: Owner login succeeds with valid owner PIN (5678)
    - TC-10: Owner login fails with invalid PIN
    - TC-11: Customer token cannot access Reception dashboard (returns 403 Forbidden)
    - TC-12: Customer token cannot execute staff call-next action (returns 403 Forbidden)
    - TC-13: Customer token cannot access another customer's ticket details (returns 403)
    - TC-14: Barber token cannot access full reception queue table (returns 403 Forbidden)
    - TC-15: Barber token for Ravi cannot access workspace for Amit (returns 403 Forbidden)
    - TC-16: Unauthenticated requests to protected endpoints return 401 Unauthorized
    - TC-17: Logging out revokes session / token verification
    - TC-18: Customer dashboard returns active ticket correctly
    - TC-19: Demo credentials catalog endpoint returns valid list of barbers and credentials
    - TC-20: Queue operations work seamlessly with authenticated roles (Reception -> Barber -> Complete)
  - Executed all server test suites (`auth_rbac.test.js`, `health.test.js`, `queue_integration.test.js`, `stage1_e2e.test.js`) with 100% pass rate (38/38 tests passing).
  - Captured verified screenshots `screenshots/login_desktop_1280.png` and `screenshots/login_mobile_375.png`.
  - Verified clean production build with `npm --prefix client run build` (0 errors).
  - Updated `README.md` with demo test accounts table and API documentation.
  - Committed changes cleanly with message `feat: add role-based demo authentication and dashboards`.


### Prompt 6 — Repair Owner Analytics Data Flow & Refine Homepage Navbar
- **Date:** 2026-11-20
- **Stage:** Bug Fix & UI Refinement (Owner Analytics + Navbar)
- **Prompt Summary:**
  > Fix two critical issues without breaking existing queue functionality:
  > 1. Owner Dashboard statistics are not updating with actual customer and queue activity. Implement an authoritative backend analytics pipeline connecting live SQLite data to `/api/admin/analytics` across today overview, revenue overview, queue analytics, barber performance, service popularity, daily trend, and recent activity.
  > 2. Home page navbar scrolling behaviour, navigation interactions, and mobile responsive drawer need improvement.
  > Add 32 new translation keys in 1:1 parity (369 keys total), write 14-test suite in `server/src/admin_analytics.test.js`, run E2E verification script, and commit with message `fix: repair owner analytics and improve homepage navigation`.
- **Outcome:** Succeeded:
  - Created centralized `server/src/services/analyticsService.js` calculating dynamic metrics from SQLite and connected it to `server/src/routes/admin.js` with authentication guards.
  - Refined `client/src/components/shared/PremiumNavbar.jsx` with smooth backdrop transitions, quick action pills, active route indicators, and mobile drawer.
  - Added 32 translation keys to `en.json` and `gu.json` with 100% key parity (369 keys each).
  - Wrote 14-test suite `server/src/admin_analytics.test.js` validating all analytics calculations and filters.
  - Verified with `scripts/verify_owner_analytics_and_navbar.js` and committed as `cf12c0a`.


### Prompt 7 — Immersive Three.js Homepage Redesign + Global Barber Rename to Isha
- **Date:** 2026-11-20
- **Stage:** 3D Creative Engineering & Brand Realignment
- **Prompt Summary:**
  > Transform the Aura Salon homepage into an immersive, scroll-driven Three.js 3D experience and globally rename barber "Ravi" to "Isha" (Gujarati: "ઈશા") across all routes, UI, mock data, seed files, tests, and documentation.
  > 1. Creative 3D Scene: Study reference (or craft a luxury salon scene if video is inaccessible). Build procedural 3D assets (Golden Shears with articulated snip pivot, Straight Razor, Styling Comb, Beveled Mirror Ring, floating Gold Embers particles, studio 3-point lighting), 5 narrative scroll sections, WebGL capability detection, CSS fallback, `prefers-reduced-motion` support, DPR clamping, and zero-scroll-hijacking.
  > 2. Barber Rename: Rename barber "Ravi" to "Isha" everywhere. Check case-insensitively and justify any remaining occurrence.
  > 3. Verify zero breakage to queue engine, run tests, build frontend, capture screenshots (`home_3d_desktop_1280.png`, `home_3d_mobile_375.png`), and commit with message `feat: add immersive threejs salon homepage and rename barber to isha`.
- **Outcome:** Succeeded:
  - Reference Video Status: Handled reference `https://www.youtube.com/shorts/VwFlsB1dqRw` as inaccessible per instructions; engineered custom high-end procedural salon 3D direction matching Aura Salon luxury palette.
  - Global Rename (Ravi -> Isha): Completely replaced all active UI, routes, database seed/migration, demo login credentials, tests, fixtures, and documentation from Ravi to Isha (`/barber/isha`, Gujarati: "ઈશા"). Only 3 strictly justified backward-compatible lines remain (legacy route redirect in `BarberPage.jsx`, automated DB migration query in `seed.js`, historical prompt log in `prompts.md`).
  - Procedural 3D Scene Component: Built `client/src/components/three/Salon3DScene.jsx` using Three.js primitives (`CylinderGeometry`, `TorusGeometry`, `BoxGeometry`, `Points`), golden metallic materials, articulated scissor snipping animations linked to scroll, gold particle field, and camera choreography across 5 sections.
  - Homepage Integration: Integrated `Salon3DScene` in `client/src/pages/HomePage.jsx` via `React.lazy` and `Suspense`, rendering glassmorphic sections that allow the 3D world to shine through seamlessly, with a dedicated spotlight card for Lead Master Barber Isha.
  - Performance & Fallbacks: Added WebGL capability check with graceful CSS fallback, `prefers-reduced-motion` detection, DPR clamping (`Math.min(window.devicePixelRatio, 2)`), full GPU/Three.js resource disposal on unmount, and isolated Three.js into a code-split lazy chunk (535 kB).
  - Localization Parity: Added 3 new keys (`leadBarberTitle`, `bookWithIsha`, `fellowArtisans`) maintaining 100% 1:1 key parity across `en.json` and `gu.json` (372 keys each).
  - Automated & Visual Verification:
    - Route tests passed (7 routes, 372 keys verified).
    - Production build passed (`npm --prefix client run build`) in 3.36s.
    - Full server test suite passed 52/52 tests (100% pass rate).
    - End-to-end multi-device workflow verification passed 18/18 checks (`scripts/e2e_full_workflow.js`).
    - Captured verified screenshots: `screenshots/home_3d_desktop_1280.png`, `screenshots/home_3d_mobile_375.png`, `screenshots/e2e_barber_isha_verified.png`, `screenshots/e2e_reception_verified.png`, `screenshots/e2e_customer_status_verified.png`, `screenshots/e2e_tv_display_verified.png`.
  - Committed changes with message `feat: add immersive threejs salon homepage and rename barber to isha`.


### Prompt 8 — Redesign Homepage Hero Section with 3D Barber Chair & Editorial Luxury
- **Date:** 2026-11-20
- **Stage:** Frontend Design & 3D Environment Enhancement (Hero Section)
- **Prompt Summary:**
  > Redesign the homepage hero section from scratch to make it visually outstanding, luxury editorial grade, and cinema-quality.
  > 1. Visual Composition: Implement a realistic, high-quality 3D barber chair as a commanding central visual element in a professional salon environment with warm directional highlights, deep charcoal shadows, champagne-gold reflections, and realistic materials (tufted espresso leather, polished gold hardware, chrome hydraulic shaft, rubber treads, and terrazzo floor plinth).
  > 2. Typography & Content: Large editorial headline ("LOOK SHARP. FEEL EXCEPTIONAL."), small label ("THE ART OF GROOMING"), supporting text ("Your style, your time, your experience. Discover premium grooming with Aura Salon.").
  > 3. Action CTAs: Primary "BOOK YOUR SLOT" connecting to `/join` queue flow; secondary "EXPLORE THE EXPERIENCE" smooth scrolling to `#experience`.
  > 4. Navbar & Responsiveness: Seamless integration with transparent navbar, full cinematic composition on desktop (7-col typography / 5-col 3D staging), mobile recomposition with centered 3D focal space, refined scroll indicator, and 100% English & Gujarati parity (374 keys).
  > 5. Verification: Preserve all other homepage sections, queue system, auth, and Socket.IO real-time sync. Pass 52/52 tests, capture screenshots (`home_hero_desktop_1440.png`, `home_3d_desktop_1280.png`, `home_3d_mobile_375.png`), and commit.
- **Outcome:** Succeeded:
  - Procedural Master Barber Chair: Built detailed procedural chair assembly in `client/src/components/three/Salon3DScene.jsx` (`createBarberChair`) with circular beveled base, hydraulic lift column, pump foot pedal, cradle carriage, tufted ribbed leather seat, 14° reclining backrest, adjustable headrest, curved gold armrests, articulated footrest/calf support, and polished dark terrazzo plinth.
  - Three-Point Studio Rig: Tuned warm directional key light (`#FFF5E6`), golden spotlight (`#E8C982`), golden rim kicker (`#C89B45`), and cool slate fill (`#5A6E82`).
  - Editorial Hero Section: Rebuilt Hero section in `client/src/pages/HomePage.jsx` with editorial typography, dual prominent CTAs, live salon status capsule (hours, barbers, live sync), and floating signature suite badge.
  - Localization Parity: Added keys to `en.json` and `gu.json` maintaining 100% 1:1 key parity (374 keys each).
  - Test & Build Verification:
    - `node client/test_routes.js` passed (374 keys 1:1 parity).
    - `npm --prefix client run build` built cleanly in 2.31s.
    - `npm --prefix server test` passed 52/52 tests (100% pass rate).
    - `node scripts/e2e_full_workflow.js` passed all 18 end-to-end checks.
    - Captured verified screenshots: `screenshots/home_hero_desktop_1440.png`, `screenshots/home_3d_desktop_1280.png`, `screenshots/home_3d_mobile_375.png`.






