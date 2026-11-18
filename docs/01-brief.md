# 01 — Project Brief and Scope

## Project Name
**Salon Queue Management System** *(Default Salon Brand: **Aura Salon** / **ઓરા સલૂન**)*

---

## Problem Statement
Walk-in salon customers frequently face unpredictable wait times, crowded waiting areas, and unclear barber availability, while receptionists juggle paper registers and phone inquiries manually. This creates friction for customers who abandon long queues and operational chaos for barbers and salon owners trying to balance service workloads. A real-time, multi-device digital queue platform solves this by unifying remote joining, walk-in registration, barber chair management, live TV display, and owner controls in one synchronized system.

---

## Project Objectives
1. Enable customers to check live wait times, join the queue remotely from their mobile phone, choose services and preferred barbers, and receive real-time turn alerts without waiting physically at the salon.
2. Provide salon receptionists with a tablet-optimized command center to manage both online and walk-in customers in a single first-come, first-served queue, call the next eligible customer per barber, and handle no-shows or cancellations.
3. Give barbers a distraction-free mobile interface to start and complete services, track elapsed time, toggle breaks, and preview their next customer.
4. Provide a high-contrast, 5-metre-readable public waiting-area TV display showing active chairs and the next five upcoming tokens in real time.
5. Empower the salon owner to configure services (with English and Gujarati names, durations, and INR pricing), manage barbers, control operating hours and online queue availability, and review daily operational statistics.
6. Support reliable multi-device synchronization (targeting updates within 5 seconds under normal network conditions, with automatic reconnection and authoritative state refresh) and strict queue integrity across all interfaces.

---

## Target Users & Responsibilities

| User Role | Primary Device | Core Responsibilities |
| :--- | :--- | :--- |
| **Customer** | Mobile smartphone (portrait, one-handed) | Views live salon status and wait times; joins queue remotely with name, 10-digit phone, up to 3 services, and preferred barber; tracks live token status and position; responds to "Almost Next" and "It's Your Turn!" alerts; cancels token if unable to attend. |
| **Receptionist** | 10-inch tablet (landscape) | Monitors all barbers and the unified waiting queue; registers walk-in customers; calls the next eligible customer for each available barber; marks no-shows (after 10-minute grace period) and cancellations; inspects customer details and flags customers waiting over 60 minutes. |
| **Barber** | Mobile smartphone (portrait) | Views currently called/assigned customer and selected services; taps **START** when customer is seated and **DONE** upon completion; toggles **On Break / Available** status; previews the next eligible customer in their queue. |
| **Salon Owner / Administrator** | Desktop / laptop / tablet | Adds, edits, and enables/disables services (EN/GU names, durations, INR prices); manages barber roster, duty status, and availability; configures opening/closing times and manual online queue open/close overrides; reviews daily statistics (served, waiting, avg wait, no-shows, cancellations, completed services). |
| **Waiting-Area Public (Passive Viewer)** | Large 16:9 TV Display | Views which token is currently called or being served at each barber chair and the next five upcoming tokens with approximate wait times. |

---

## Must-Have Features (In Scope)
1. **Remote Queue Joining:** Customers join the queue from their mobile device with 10-digit phone validation, duplicate-phone protection, and instant token generation (e.g., `S-14`).
2. **Service & Barber Selection:** Customers select 1 to 3 active services with live total duration and INR price calculation, and choose either **Any Barber (Fastest Available)** or a specific on-duty barber.
3. **Live Queue Status & Notifications:** Customers track live queue position, estimated waiting time, a prominent **"You're almost next! Start coming to the salon."** alert when 2nd in line (or next up), a full-screen gold **"It's Your Turn!"** notification with subtle pulse/vibration when called, and self-cancellation with confirmation.
4. **Unified Reception Management:** Landscape tablet dashboard managing both online and walk-in customers in one FCFS queue with per-barber **Call Next** allocation, **No-show**, **Cancel**, search, amber highlighting for waits over 60 minutes, and walk-in registration.
5. **Dedicated Barber Interface:** Mobile-first barber view with large **START** and **DONE** buttons, live elapsed service timer, **On Break / Available** toggle, and next-customer preview.
6. **Public Waiting-Area TV Display:** High-contrast, auto-updating full-screen display readable from ~5 metres showing active barber cards, gold highlight + animation + optional audio chime for newly called tokens, and the next 5 upcoming tokens.
7. **Owner Management Dashboard:** Full CRUD for services (bilingual EN/GU), barber roster & duty controls, opening/closing hours with automatic online-joining cutoff 30 minutes before closing, and Today's Statistics.
8. **Full English & Gujarati Language Support:** Instant language toggle across the entire application using centralized translation files (`en.json`, `gu.json`) without losing form or screen state.

---

## Explicitly Excluded Features (Out of Scope)
To keep the system focused, maintainable, and aligned with the assignment scope, the following will **NOT** be built:
- Online payment gateways, UPI checkout, or invoicing/billing reconciliation.
- Future-date appointment scheduling or calendar bookings (same-day live queue only).
- External SMS, WhatsApp, or email notification integrations.
- Customer loyalty points, memberships, coupons, or reward systems.
- Multi-branch / multi-salon franchise management.
- Enterprise analytics, staff payroll, inventory management, or complex user registration, password recovery, or enterprise IAM/RBAC systems (staff routes use a simple backend-validated PIN gate configured via environment variables).

---

## Visual Design Direction
**Warm charcoal (`#1F2937`) and refined salon gold (`#D4A017`) commercial aesthetic with crisp typography, generous spacing, high-contrast status indicators, minimum 44px mobile touch targets, and device-tailored layouts (one-handed mobile, landscape tablet, and 5-metre-readable TV display) free of generic template clutter.**

