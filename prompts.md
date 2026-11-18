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
- **Outcome (Part A & B):** Succeeded — Applied all 7 targeted documentation corrections across `AGENTS.md`, `docs/01-brief.md`, `docs/02-screens.md`, `docs/03-flows-rules.md`, and `README.md`; finalized single-engine SQLite/libSQL (`@libsql/client`) persistence decision; committed documentation updates cleanly before writing application code. *(Stage 1 implementation outcome appended below upon verification.)*

