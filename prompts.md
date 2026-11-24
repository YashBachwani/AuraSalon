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
  - Wrote 14-test suite `server/src/admin_analytics.test.js` validating all analytics calculations and filters (52/52 server tests passing).
  - Verified with `scripts/verify_owner_analytics_and_navbar.js` and committed as `cf12c0a`.


### Prompt 7 — Redesign Homepage Hero Section & Complete Ravi to Isha Replacement
- **Date:** 2026-11-20
- **Stage:** Hero Section Redesign & Brand Realignment (Hero + Isha)
- **Prompt Summary:**
  > Act as a senior UI/UX designer, creative frontend developer, Three.js specialist, and full-stack engineer:
  > 1. Task 1 — Completely redesign the homepage hero section with a premium, cinematic, luxury brand feel using the Aura Salon palette (`#191817`, `#292622`, `#C89B45`, `#E8C982`, `#F5EFE4`, `#D9D0C2`, `#9B7650`). Balanced full-screen desktop 2-column hero: left side with premium eyebrow ("THE ART OF GROOMING"), large headline ("Your Style. Your Moment."), supporting description, primary CTA ("Join the Queue" -> `/join`), secondary CTA ("Explore Our Experience" -> `#experience`), and live trust strip (operating hours, barbers on duty, live sync status); right side with a high-visual-standard procedural Three.js 3D salon composition (master barber chair, floating precision styling shears, fine-toothed stylist comb, glowing gold circular pedestal, 3-point lighting, starlight particles, damped mouse parallax, scroll elevation). Full mobile responsiveness, WebGL capability check, reduced-motion, and CSS fallback.
  > 2. Task 2 — Complete global replacement of barber identity "Ravi" to "Isha" (Gujarati: "ઈશા") across all components, routes (`/barber/isha`), login demo credentials, DB seed/migration, tests, scripts, translations, and documentation. Case-insensitive search must show zero active references to Ravi. Existing database records and relationships must be safely migrated.
  > 3. Task 3 — Preserve all existing functionality (queue joining, token generation, live status, reception dashboard, barber chair, owner dashboard, TV display, Socket.IO, DB persistence).
  > 4. Task 4 — Verify end-to-end multi-device workflow, run all backend tests, client build, capture screenshots (`home_hero_desktop_1280.png`, `home_hero_mobile_375.png`), update `README.md` and `prompts.md`, and commit with message `fix: redesign aura salon hero and replace ravi with isha`.
- **Outcome:** Succeeded:
  - **Procedural Three.js 3D Component:** Created `client/src/components/three/HeroSalon3D.jsx` featuring:
    - Master Barber Chair: heavy beveled hydraulic base, fluted column, collar, cradle carriage, tufted deep charcoal leather cushions, gold crown bar, headrest, curved armrests, and footrest.
    - Floating Precision Styling Shears: champagne gold finger rings, tang, pivot screw, and polished steel blades posed open in an active styling posture.
    - Sculptural Stylist Comb: amber spine with fine teeth.
    - Illuminated Pedestal: circular dark slate podium with warm champagne gold torus ring.
    - Atmospheric Starlight Particles: floating gold dust particles drifting in key spotlight.
    - Three-Point Lighting: warm champagne key spotlight (`#FFF2D6`), golden amber fill (`#E8C982`), cool steel rim light (`#64748B`), and pedestal underglow (`#C89B45`).
    - Parallax & Scroll Reactivity: damped pointer movement and scroll-linked elevation/rotation.
    - Performance & Fallback: WebGL detection, DPR clamping (`Math.min(devicePixelRatio, 2)`), `prefers-reduced-motion` handling, full GPU resource cleanup on unmount, and code-split lazy loading (Three.js isolated into 536 kB chunk).
  - **Full-Screen Luxury Hero:** Redesigned `client/src/pages/HomePage.jsx` with full 2-column luxury layout:
    - Eyebrow badge: "THE ART OF GROOMING" + live hours badge ("Open Today: 09:00 AM – 09:00 PM").
    - Headline: "Your Style. Your Moment." with champagne-gold gradient styling.
    - Supporting description: "Experience precision cuts, master barbering, and modern queue-free convenience in a refined atmosphere crafted for your style."
    - Action CTAs: Primary "Join the Queue" (`/join`) and Secondary "Explore Our Experience" (`#experience` smooth scroll).
    - Live Trust Strip: Services count, on-duty master barbers, and real-time live sync indicator.
    - Floating 3D Badge: "Master Styling Station • Isha & Artisans".
    - Scroll indicator: animated bounce chevron ("Scroll to Explore").
  - **Complete Global Rename (Ravi -> Isha):**
    - Updated `server/src/db/seed.js`: default barber is Isha (`slug: 'isha'`, avatar `#D4A017`), plus automatic database migration query (`UPDATE barbers SET name = 'Isha', slug = 'isha' WHERE id = 1 OR slug = 'ravi' OR name = 'Ravi'`).
    - Updated `client/src/utils/salonImages.js`: `barbers.isha`.
    - Updated navigation and routes: `PremiumNavbar.jsx`, `PremiumFooter.jsx`, `AuthContext.jsx`, `CustomerLayout.jsx`, `StaffLayout.jsx`, `BarberPage.jsx`, `LoginPage.jsx` (Isha is primary barber demo account at `/barber/isha`).
    - Updated all test suites: `admin_analytics.test.js`, `auth_rbac.test.js`, `health.test.js`, `queue_integration.test.js`, `stage1_e2e.test.js`.
    - Updated documentation and verification scripts: `AGENTS.md`, `README.md`, `docs/02-screens.md`, `scripts/e2e_full_workflow.js`, `scripts/verify_owner_analytics_and_navbar.js`.
    - Case-insensitive search confirmed 0 active occurrences of Ravi in code or configuration.
  - **Localization Parity:** Maintained 100% 1:1 translation key parity across `en.json` and `gu.json` (370 keys each).
  - **Verification & Test Results:**
    - `npm --prefix client run build`: Built cleanly with 0 errors in 3.35s.
    - `node --test server/src/*.test.js`: All 52/52 backend tests passed (100% pass rate).
    - `node scripts/e2e_full_workflow.js`: All 18 multi-device end-to-end queue synchronization checks passed.
    - Verified screenshots captured: `screenshots/home_hero_desktop_1280.png`, `screenshots/home_hero_mobile_375.png`, `screenshots/e2e_barber_isha_verified.png`, `screenshots/e2e_customer_status_verified.png`, `screenshots/e2e_reception_verified.png`, `screenshots/e2e_tv_display_verified.png`.


### Prompt 8 — Complete Final Quality Assurance, Bug Fixing & Production Readiness
- **Date:** 2026-11-23
- **Stage:** Final Quality Audit & Production Stabilisation
- **Prompt Summary:**
  > Act as a Senior Full-Stack Engineer, QA Engineer, UI/UX Specialist, Security Reviewer, and Performance Engineer:
  > Perform a complete final quality audit of the ENTIRE project across 13 phases. Identify, fix, test, and verify all remaining bugs, minor issues, inconsistencies, broken interactions, and performance problems without breaking existing architecture or visual identity.
  > Audit checklist:
  > 1. Complete project audit: verify frontend and backend architecture, routes, APIs, DB, auth/RBAC, Socket.IO, tests, docs.
  > 2. Frontend bug fixing across all 9 screens: dead links, broken buttons, missing loading/error/empty states, translation keys, state persistence.
  > 3. Queue management logic: FCFS, max 3 services, Isha vs Any Barber, 10-minute NO_SHOW rule boundary, 30-min online closing cutoff, walk-in availability, concurrency locks.
  > 4. Role-based authentication: Customer, Barber (Isha), Reception, Owner; session persistence on refresh, RBAC, route guards, URL manipulation prevention.
  > 5. Isha barber identity audit: name Isha everywhere, 0 active occurrences of Ravi.
  > 6. Real-time & Socket.IO audit: multi-device sync, listener cleanup on unmount, reconnect handling.
  > 7. Owner dashboard & analytics: dynamic database metrics, defensive Math.max handling, filters.
  > 8. Three.js homepage & UI polish: WebGL fallback, reduced-motion, memory cleanup, clean console.
  > 9. Mobile & responsive testing: test viewports 360x800, 390x844, 430x932, 768x1024, 1024x768, 1366x768, 1920x1080; zero horizontal overflow.
  > 10. Backend, database & security: API validation, error handling, DB transactions, foreign keys, secure environment variables.
  > 11. Performance and code quality: zero dead console.logs, clean bundle splitting.
  > 12. Complete testing: run full suite, add 8-test boundary test suite (`final_qa_stabilisation.test.js`), verify 60/60 tests pass.
  > 13. Final cleanup and deployment readiness: commit with message `chore: complete aura salon final qa and bug fixes`.
- **Outcome:** Succeeded:
  - **Audit & Bug Fixing:**
    - Resolved missing translation keys: added `common.errorTitle` and `common.errorDescription` to `client/src/locales/en.json` and `client/src/locales/gu.json` maintaining 100% 1:1 key parity (372 keys each).
    - Fixed Barber Route Isolation in `client/src/context/AuthContext.jsx`: ProtectedRoute now correctly redirects barbers accessing `/barber` without a name parameter to their own chair (`/barber/${mySlug || 'isha'}`).
    - Enhanced `client/src/pages/BarberPage.jsx`: imported `useAuth` to resolve fallback active barber parameter safely from logged-in user context.
    - Protected `client/src/pages/AdminPage.jsx`: guarded `Math.max` calls against empty/undefined arrays with fallback defaults.
    - Guarded `client/src/pages/DisplayPage.jsx`: added `flashTimeoutRef` and proper unmount cleanup for the 10-second `justCalledId` banner timeout.
  - **Comprehensive Boundary & QA Test Suite:**
    - Created `server/src/final_qa_stabilisation.test.js` covering 8 critical boundary test cases:
      1. Invalid phone number rejection (HTTP 400).
      2. Max 3 services validation (HTTP 400).
      3. Barber ON_BREAK booking rejection (HTTP 409).
      4. Concurrency safety: 5 simultaneous joins with the same phone produce only 1 active ticket (1x 201, 4x 409).
      5. Strict 10-minute NO_SHOW rule boundary: fails at 0 mins (409 NO_SHOW_GRACE_ACTIVE), succeeds after 11 mins (200 OK) restoring barber to AVAILABLE.
      6. Illegal state transition rejection: completing a WAITING customer returns 409.
      7. Barber chair isolation: Barber Amit cannot complete service assigned to Barber Isha (returns 403 FORBIDDEN_BARBER_ACCESS).
      8. Customer ticket privacy: Customer A cannot view Customer B's ticket (returns 403 UNAUTHORIZED_TICKET_ACCESS).
  - **Responsive Testing Across All 7 Viewports:**
    - Verified all target viewports: 360x800, 390x844, 430x932, 768x1024, 1024x768, 1366x768, and 1920x1080.
    - Captured 14 responsive proof screenshots in `screenshots/responsive/`. Zero horizontal overflow (`overflow-x: hidden`).
  - **Zero Active References to Ravi:**
    - Confirmed 0 active occurrences across the entire codebase.
  - **Test Suite Results:**
    - Full backend test suite: 60 / 60 tests passed (100% pass rate).
    - Client build: built cleanly in 3.21s with zero errors.
    - Client route & dictionary check: passed (372 keys each).
    - End-to-end multi-device workflow verification: 18 / 18 checks passed.


### Prompt 9 — Static Premium Homepage Hero & Owner Management for Services and Barbers
- **Date:** 2026-11-23
- **Stage:** Static Hero Redesign & Owner Services & Barbers Management
- **Prompt Summary:**
  > Implement the following changes on the existing Aura Salon project while preserving all currently working functionality:
  > 1. Redesign Homepage Hero Section: Convert current hero into a clean, static, elegant, luxury salon landing section. Remove Three.js, React Three Fiber, 3D models, WebGL scenes, and 3D-specific loading dependencies. Left: Eyebrow "THE ART OF GROOMING", headline "Your Style. Your Moment.", description, Primary CTA "Join the Queue" (`/join`), Secondary CTA "Explore Our Services" (`#services`). Right: High-quality realistic salon composition (`SALON_IMAGES.hero`), refined natural lighting, brand palette (`#191817`, `#292622`, `#C89B45`, `#E8C982`, `#F5EFE4`, `#D9D0C2`, `#9B7650`). Static layout without scroll-driven movement.
  > 2. Owner Service Management Control: Dedicated Manage Services tab in Owner Dashboard (`/admin`). View all services (name EN/GU, description, duration, price, active status, usage count). Add service modal, Edit service modal, Delete/Deactivate service (safe soft-deactivation if referenced in past queue entries).
  > 3. Owner Barber Management Control: Dedicated Manage Barbers tab in Owner Dashboard (`/admin`). View roster (name, slug, specialty, phone, avatar color, PIN, duty status, active customer, completed sessions). Add stylist modal, Edit stylist modal, Delete/Deactivate stylist (rejects deletion if customer active in chair `BARBER_HAS_ACTIVE_CUSTOMER`, soft-deactivates if past records exist, preserves Isha identity).
  > 4. Database & Backend Integration: Endpoints under `/api/admin` with strict RBAC (`requireAuth(['owner'])`):
     - `GET /api/admin/services`, `POST /api/admin/services`, `PUT /api/admin/services/:id`, `DELETE /api/admin/services/:id`
     - `GET /api/admin/barbers`, `POST /api/admin/barbers`, `PUT /api/admin/barbers/:id`, `DELETE /api/admin/barbers/:id`
  > 5. Real-Time Synchronization: Broadcast `services:updated`, `barbers:updated`, `bootstrap:updated` on mutations to update all screens without page reload.
  > 6. Automated Testing & Verification: Add comprehensive test suite (`admin_management.test.js`), verify build, update documentation, and commit with message `feat: add static premium hero and owner service-barber management`.
- **Outcome:** Succeeded:
  - **Static Hero Redesign & Three.js Removal:**
    - Replaced 3D hero with static luxury composition in `client/src/pages/HomePage.jsx`.
    - Removed `three` package from `client/package.json` and deleted `HeroSalon3D.jsx`. Client bundle size decreased from 987 kB to 478 kB with instant rendering.
    - Added high-resolution local vector artwork `salon-hero.svg` with golden architectural arches and vintage master barbering chair.
  - **Database & Schema Enhancements:**
    - Updated `server/src/db/schema.js`: added `description_en` and `description_gu` columns to `services`, and `phone` and `pin` columns to `barbers` with idempotent SQLite migrations.
    - Updated `server/src/services/authService.js` to support custom per-barber PINs and reject deactivated barbers (`BARBER_INACTIVE`).
  - **Owner Management REST APIs (`server/src/routes/admin.js`):**
    - Built complete CRUD endpoints for Services & Barbers with strict owner authorization guards, payload validation, slug uniqueness checks, usage counting, and active chair safeguards.
    - Historical queue protection: referenced services and barbers are soft-deactivated to preserve past appointments and receipts without database foreign-key conflicts.
  - **Owner Management Dashboard UI (`client/src/pages/AdminPage.jsx`):**
    - Built comprehensive **Manage Services** tab with cards, live Active/Inactive quick toggles, filters, Add Service modal, Edit Service modal, and Delete confirmation dialog with usage warnings.
    - Built comprehensive **Manage Barbers** tab with roster cards, chair IDs, live duty toggles, active customer indicators, avatar color swatches, Add Stylist modal, Edit Stylist modal, and active-customer deletion blockers.
  - **Real-Time Multi-Device Sync:**
    - Connected `ConnectionContext.jsx` to listen for `services:updated` and `barbers:updated` and trigger immediate bootstrap refresh for all connected screens.
  - **100% 1:1 Translation Key Parity:**
    - Added all management copy across `en.json` and `gu.json` (422 keys each, verified by `scripts/audit_translations.js`).
  - **Testing & Verification:**
    - Built and passed 13-test automated test suite `server/src/admin_management.test.js`.
    - All 73 / 73 server tests passed across the 7 backend test suites.
    - All 18 / 18 end-to-end workflow verification checks passed (`scripts/e2e_full_workflow.js`).
    - Captured high-resolution desktop and mobile screenshots of static hero, services management, barbers management, and add modals via Chrome DevTools Protocol.


### Prompt 10 — Fix Owner Analytics and Simplify Homepage Hero Design
- **Date:** 2026-11-23
- **Stage:** Owner Analytics Bug Fix & Single-Background Hero Simplification
- **Prompt Summary:**
  > 1. Fix Owner Analytics Not Updating:
  >    - Find the root cause why the statistics in the Owner Dashboard (`/admin`) are showing zero or failing to update with actual salon activity.
  >    - Display database-backed numbers for Total Customers (today and overall), Customers Served (status DONE), Active Queue (waiting + in chair), Estimated Revenue (strictly from completed DONE entries), Service Popularity (count and revenue), and Stylist Performance.
  >    - Date filtering: Today, Last 7 Days, Last 30 Days, All Time.
  >    - Real-time updates: Automatically refresh when queue changes occur via Socket.IO, on tab switch, on window focus/visibility change, and on socket reconnect.
  >    - Separate no-show and cancelled counts.
  > 2. Redesign Homepage Hero Section:
  >    - Replace split layout and right-side card with ONE normal, authentic salon photograph as the entire section's background (`background-size: cover; background-position: center`).
  >    - Apply a subtle dark charcoal overlay so text is crisp and legible while keeping the salon atmosphere visible.
  >    - Place text content cleanly on the left side:
  >      - Eyebrow: "THE ART OF GROOMING"
  >      - Main heading: "Your Style. Your Moment."
  >      - Supporting text: "Experience premium grooming, expert styling and a little time dedicated entirely to you."
  >      - Primary CTA: "Join the Queue" (`/join`)
  >      - Secondary CTA: "Explore Our Services" (`#services`)
  >    - Fully static, simple, clean and refined without 3D, canvas, WebGL, particle effects, parallax, split screen, or separate right-side image cards.
  > 3. Testing & Verification:
  >    - Run full test suite, build client, verify real E2E workflow, capture screenshots, and commit with message `fix: repair owner analytics and simplify salon homepage hero`.
- **Outcome:** Succeeded:
  - **Root Cause & Fix for Owner Analytics:**
    - Root cause 1: Property naming mismatch between frontend `AdminPage.jsx` (`totalRegistrationsToday`, `completedToday`, `servicesCompletedToday`, `inChairCount`, `avgActualWaitMinutes`, `revenueTodayInr`, `revenueLast7DaysInr`, `customerMetrics.totalUniqueCustomers`) and backend `analyticsService.js` (`totalCustomersToday`, `completedCount`, `servingCount`, `avgWaitMinutes`, `todayRevenue`, `weeklyRevenue`, `today.totalAllTimeCustomers`), which caused numbers to evaluate to `0` or `undefined`.
    - Root cause 2: `analyticsService.js` only filtered service selections for `7d`, `30d`, and `all` ranges, without computing range totals for registrations, completed tickets, or revenue.
    - Root cause 3: Missing tab focus/visibility listener (`visibilitychange`) and socket reconnect handler (`socket.on('reconnect')`).
    - Fix: Updated `server/src/services/analyticsService.js` with comprehensive range aggregations, computed services completed, separate no-show and cancelled counts, and complete alias parity across both naming conventions. Updated `client/src/pages/AdminPage.jsx` with safe fallback chains, tab switch re-fetch, `visibilitychange` listener, `reconnect` listener, and added a dedicated Queue Status Breakdown bar beneath KPI cards clearly distinguishing Completed, In Chair, Waiting, Called, No-Show, and Cancelled.
  - **Simplified Authentic Photograph Homepage Hero:**
    - Downloaded and verified authentic luxury barbershop interior photograph (`client/public/salon-hero-bg.jpg`).
    - Converted `#hero` in `client/src/pages/HomePage.jsx` to full-bleed background (`bg-cover bg-center`) with dark charcoal gradient and black contrast overlays (`bg-gradient-to-r from-[#191817]/95 via-[#191817]/85 to-[#191817]/50` and `bg-black/35`).
    - Styled left-aligned typography with eyebrow, master headline with gold gradient, supporting description, primary and secondary CTAs, and live trust stats strip. Removed split screen and right-side card completely.
    - Updated `en.json` and `gu.json` with 100% key parity for all hero copy.
  - **Automated Testing & Evidence:**
    - `npm --prefix client run build`: built cleanly in 10.57s (`dist/assets/index-L6kMHCWU.js` 480 kB).
    - `node --test server/src/*.test.js`: 73 / 73 tests passed in 1.89s with zero failures.
    - `node scripts/e2e_full_workflow.js`: 18 / 18 end-to-end multi-device workflow checks passed 100%.
    - Captured high-resolution Chrome DevTools Protocol screenshots:
      - `screenshots/admin_overview_stats_desktop.png` (demonstrates live non-zero database KPIs: Total Customers 1, Customers Served 1, 100% completion rate, 2 services, ₹240 revenue, and status breakdown).
      - `screenshots/home_hero_desktop_1280.png` (authentic salon photo full-background hero).
      - `screenshots/home_hero_mobile_375.png` (flawless mobile responsive presentation).


### Prompt 11 — Complete Vercel Deployment Configuration
- **Date:** 2026-11-24
- **Stage:** Vercel Production Deployment Architecture Preparation
- **Prompt Summary:**
  > Configure Aura Salon for production deployment on Vercel from a single GitHub repository.
  > 1. Audit complete repository structure, client/server configurations, package.json scripts, API routes, database, Socket.IO, auth, and environment variables.
  > 2. Design Vercel architecture using Vercel's official Multiple Services (`client` Vite SPA + `server` Express serverless function).
  > 3. Create root `vercel.json` with services and rewrites (`/api/(.*)` to `server`, `/(.*)` to `client`).
  > 4. Fix frontend and backend URL configuration: relative `/api` paths in production, no hardcoded localhost URLs.
  > 5. Database & Persistent Storage: Support Turso cloud libSQL (`libsql://...`), ensure serverless connection compatibility and ephemeral filesystem safety.
  > 6. Socket.IO & Real-Time Sync: Analyze serverless limitations, implement intelligent background polling fallback (4-5s) across all active screens when WebSockets are unavailable, preserving Socket.IO for stateful environments.
  > 7. Authentication & Security: Ensure HTTPS/same-origin cookie & token security, RBAC guards, and secret isolation.
  > 8. Environment Variables: Prepare comprehensive `.env.example` with classification into Local, Client, Server, and Secret variables.
  > 9. Frontend Routing: Ensure SPA rewrites without 404s on deep route refresh.
  > 10. Automated Testing & Verification: Verify client build (2.57s), backend tests (73/73 passing), and E2E workflow (18/18 checks passing).
  > 11. Documentation: Update `README.md`, `.env.example`, `prompts.md`.
  > 12. Present Phase 12 Final Approval with sections A through G for user confirmation.
- **Outcome:** Succeeded. Configured root `vercel.json`, updated Express server for serverless handler compatibility (`server/src/index.js` and `server/api/index.js`), added Turso cloud aliases and `/tmp` fallback, updated `api.js` and `socket.js` with relative production paths, added resilient real-time polling fallback to all screens, created `.env.example`, passed all 73 backend unit tests, built client bundle in 2.57s, and passed all 18 E2E verification checks.


### Prompt 12 — Critical Fix: Aura Salon Vercel Serverless Export Error
- **Date:** 2026-11-24
- **Stage:** Production Deployment Runtime Fix
- **Prompt Summary:**
  > Fix the runtime error reported in Vercel logs:
  > `Invalid export found in module "/var/task/server/src/app.mjs". The default export must be a function or server.`
  > 1. Inspect existing backend exports (`server/src/app.js`, `server/src/app.mjs`, `server/src/server.mjs`, `server/package.json`, `vercel.json`).
  > 2. Expose a valid default export in `server/src/app.js` and `server/src/app.mjs` that Vercel recognizes as an Express application function.
  > 3. Separate local HTTP server startup (`server/src/server.mjs` and `server/src/index.js`) from serverless exports.
  > 4. Ensure database initialization is lazy/idempotent and serverless-safe.
  > 5. Preserve local development workflow, run backend tests, and commit with message `fix: correct express serverless export for vercel`.
- **Outcome:** Succeeded. Identified that `server/src/app.js` only had named export `createApp` without any default export. Updated `server/src/app.js` to instantiate and default-export `app = createApp(db, ensureDatabaseReady)`. Created `server/src/app.mjs` as explicit `.mjs` entry re-exporting `default app`. Created `server/src/server.mjs` for dedicated local server startup with Socket.IO. Updated `server/src/index.js` to dual-mode (standalone CLI listener vs default export). Updated `server/package.json` with `"main": "src/app.js"`. Verified all exports in Node.js evaluate to `typeof app === 'function'`. Verified 73 / 73 backend tests passing, 18 / 18 E2E checks passing, and committed to Git.





