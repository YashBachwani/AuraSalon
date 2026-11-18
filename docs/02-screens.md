# 02 — Screens and Features Specification

This document specifies all **seven screens** of the Salon Queue Management System in complete detail so any developer can build every interface without guessing.

---

## Global Design System & Shared Conventions
- **Colour Palette:**
  - Primary Background: `#1F2937` (Deep Charcoal)
  - Elevated Surface / Cards: `#111827` / `#283548` with subtle `1px` border (`#374151`)
  - Primary Gold Accent: `#D4A017` (Hover: `#E5B32A`, Muted Gold Surface: `rgba(212, 160, 23, 0.14)`)
  - Primary Text: `#F9FAFB` (Crisp White), Secondary Text: `#D1D5DB` (Warm Grey), Muted Text: `#9CA3AF`
  - Semantic Status Colours:
    - `Available` / `DONE`: Emerald `#10B981`
    - `Busy` / `IN_CHAIR`: Sky/Blue `#38BDF8`
    - `CALLED` / `Almost Next`: Gold `#D4A017`
    - `On Break` / `> 60 min Wait Warning`: Amber `#F59E0B`
    - `Closed` / `CANCELLED` / `NO_SHOW` / `Error`: Rose/Red `#EF4444`
- **Typography:** Clean commercial sans-serif (`Plus Jakarta Sans` / `Inter` with `Noto Sans Gujarati` fallback for crisp Gujarati script rendering) and tabular numerals (`tabular-nums`) for all timers, prices, and tokens.
- **Touch Targets:** Minimum `44px × 44px` interactive tap targets on all mobile and tablet controls.
- **Language Toggle:** Available on every screen header as a compact `EN | ગુજરાતી` pill button. Switching updates all UI copy, labels, validation messages, statuses, and bilingual database fields immediately without resetting form inputs or active state.
- **Connection Indicator:** Subtle live-sync status dot (Green = Live, Amber = Reconnecting, Red = Offline) shown on live screens (`/`, `/status/:id`, `/reception`, `/barber/:name`, `/display`, `/admin`).
- **Staff PIN Gate:** Staff routes (`/reception`, `/barber/:name`, `/admin`) require a lightweight numeric PIN entry modal/gate validated by the backend (`/api/auth/verify-pin`). Validated sessions are stored in `sessionStorage` so staff do not re-enter the PIN during their shift. Public routes (`/`, `/join`, `/status/:id`, `/display`) require **no authentication**.

---

## SCREEN 1: HOME

- **Screen Name:** Home (Customer Landing Page)
- **URL / Route:** `/`
- **Intended User:** Customer (also provides subtle footer links for staff/TV access)
- **Purpose:** Give customers an immediate, trustworthy view of the salon's live opening status, current queue length, estimated waiting time, and active barbers, with a clear primary call-to-action to join the queue remotely.

### UI Elements (Top to Bottom)
1. **Top Header Bar:**
   - Salon emblem icon (scissors/crown mark in `#D4A017`) + Salon Name (`Aura Salon` / `ઓરા સલૂન`).
   - Live connection dot + `EN | ગુજરાતી` language toggle pill.
2. **Hero & Salon Status Card:**
   - Opening Status Badge:
     - `Open` (emerald dot) — normal operating hours, online joining open.
     - `Online Joining Closed` (amber dot) — within 30 mins of closing OR manually paused by owner (walk-ins still open).
     - `Closed` (red dot) — outside operating hours.
   - Operating Hours line: e.g., `Open today: 9:00 AM – 9:00 PM` (with prominent `Closes at 9:00 PM`).
   - Short welcoming tagline (e.g., *"Skip the waiting room. Join the live queue from your phone."*).
3. **Live Queue Summary Strip (2 Metric Cards):**
   - Card 1 — **People Waiting:** Large numeral + label, e.g., `6 people waiting` (`6 લોકો રાહ જોઈ રહ્યા છે`).
   - Card 2 — **Estimated Wait:** Large numeral + label, e.g., `Approximately 50 minutes` (`અંદાજે 50 મિનિટ`). Shows `No wait — Walk right in!` when 0 waiting and at least one barber is available.
4. **Primary Call-to-Action Area:**
   - Full-width gold primary button: **Join Queue** (`કતારમાં જોડાઓ`).
   - Contextual closure notice banner (rendered directly beneath/above disabled button whenever online joining is closed):
     - Auto-close case: *"Online joining closes 30 minutes before closing time (at 8:30 PM). Walk-ins are still welcome at reception."*
     - Manual-close case: *"Online queue joining is currently paused by the salon. Please visit reception for walk-in service."*
     - Outside hours case: *"The salon is currently closed. Operating hours: 9:00 AM – 9:00 PM."*
   - Secondary subtle link (only visible if `localStorage` remembers an active token ID from this browser): *"Already in queue? View Token S-14 →"*.
5. **Our Barbers Today Section:**
   - Section title: `Barbers on Duty` + count badge.
   - List/grid of on-duty barber cards, each showing:
     - Circular avatar/initials badge.
     - Barber Name (e.g., `Ravi`, `Amit`, `Imran`).
     - Specialty subtitle (e.g., `Haircut & Styling`).
     - Current Status Pill: `Available` (emerald), `Busy` (sky blue), or `On Break` (amber).
     - Individual estimated wait snippet (e.g., `Ready now` or `~25 min wait`).
6. **Footer:**
   - Subtle single-line staff portal links (`Reception`, `Barber View`, `TV Display`, `Owner`) for easy switching during operation and demonstration.

### Buttons & Exact Functionality
| Button / Control | Behaviour |
| :--- | :--- |
| `EN \| ગુજરાતી` Toggle | Switches application language globally via i18n context without reloading or losing state. |
| **Join Queue** (Primary CTA) | Navigates to `/join`. Disabled (`aria-disabled="true"`) with explanatory banner when `isOnlineJoinOpen === false`. |
| **View Token S-XX →** (Conditional) | Navigates directly to `/status/:id` for the browser's remembered active token if still active. |
| Footer Staff Links | Navigate to `/reception`, `/barber`, `/display`, and `/admin`. |

### Data Displayed
- `settings`: `salonNameEn`, `salonNameGu`, `openTime`, `closeTime`, `isOnlineJoinOpen`, `onlineCloseReason`, `isSalonOpen`.
- `summary`: `waitingCount`, `estimatedWaitMinutes`.
- `barbers`: active on-duty barbers with `id`, `name`, `avatarUrl`/initials, `specialty`, `status` (`AVAILABLE`, `BUSY`, `ON_BREAK`), `estimatedWaitMinutes`.

### Interaction Behaviour
- Subscribes to Socket.IO real-time updates (`queue:updated`, `barbers:updated`, `settings:updated`); numbers, statuses, and button enabled/disabled state update live within 5 seconds without refresh.

### States
- **Loading State:** Skeleton shimmer placeholders for the status badge, two summary metric cards, and three barber cards; `Join Queue` button shows disabled skeleton state.
- **Empty State:**
  - 0 waiting customers: displays `0 people waiting` and `Ready now (0 min wait)` cleanly.
  - 0 barbers on duty: displays an informative muted card *"No barbers are currently on duty. Please check back during operating hours."* and disables `Join Queue`.
- **Error State:** If initial API fetch fails, renders a clean dark card with warning icon, clear message (*"Unable to load live salon status"*), and a **Retry** button (`min-h-[44px]`).

### Responsive Layouts
- **Mobile (`< 640px`, primary target):** Single-column stacked layout, comfortable `16px` horizontal padding, 2-column compact metric strip, sticky-feel prominent `52px`-tall `Join Queue` button reachable with one thumb, vertical barber list.
- **Tablet (`640px – 1024px`):** Centered container (`max-w-2xl`), 2-column barber card grid.
- **Desktop / TV (`> 1024px`):** Centered container (`max-w-4xl`), 2-column hero/summary split and 3-column barber card grid.

---

## SCREEN 2: JOIN QUEUE

- **Screen Name:** Join Queue (Customer Registration Flow)
- **URL / Route:** `/join`
- **Intended User:** Customer
- **Purpose:** Allow a remote customer to enter their name and 10-digit mobile number, pick 1–3 active services, select a preferred barber (or Any Barber), review live duration/price/wait estimates, and confirm their queue entry.

### UI Elements (Top to Bottom)
1. **Top Navigation Bar:**
   - Back button (`← Back`) returning to `/`.
   - Screen title: `Join the Queue`.
   - `EN | ગુજરાતી` language toggle.
2. **Online Queue Closed Guard Banner (Conditional):**
   - If online joining closes while the customer is on `/join`, displays a prominent amber/red alert at top explaining why online joining is unavailable and disables submission.
3. **Duplicate Phone Notice Modal/Banner (Conditional):**
   - If the entered phone number already has an active queue entry (`WAITING`, `CALLED`, or `IN_CHAIR`), shows a gold-bordered alert card: *"You already have an active token: **S-14** (Status: Waiting)"* with a primary button **View My Status →** that opens `/status/:id`.
4. **Step 1 — Your Details Card:**
   - **Customer Name** text input (required, placeholder e.g. *"e.g. Aarav Patel"*, 2–60 chars, inline validation message).
   - **Mobile Number** tel/numeric input with `+91` prefix indicator (required, strictly 10 digits, strips non-digits or blocks invalid chars, live character counter `0/10`, inline validation message).
5. **Step 2 — Select Services Card (Max 3):**
   - Section header: `Select Services` + live counter badge `0 / 3 selected`.
   - Interactive selectable service cards (only `isActive === true` services rendered):
     - Localized service name (`Haircut` / `હેરકટ`).
     - Duration pill (`30 min`) + Price (`₹150`).
     - Checkmark icon & gold border when selected.
     - Once 3 services are selected, all unselected service cards become visually dimmed/disabled with helper note: *"Maximum 3 services can be selected."*
6. **Step 3 — Preferred Barber Card:**
   - Section header: `Choose Your Barber`.
   - Selection chips/cards:
     - First card (default selected): **Any Barber** with subtitle *"Fastest Available"* and combined shortest wait estimate.
     - One card per on-duty barber (`Ravi`, `Amit`, `Imran`, etc.) showing avatar, name, live status pill (`Available` / `Busy` / `On Break`), and barber-specific wait estimate.
     - If an `On Break` barber is selected, displays an inline amber advisory: *"Ravi is currently on break. You will stay assigned to Ravi and won't be moved to another barber."*
7. **Live Summary Card (Sticky Bottom Bar on Mobile / Side Summary on Desktop):**
   - Selected services list (or *"No services selected yet"*).
   - **Total Duration:** e.g., `45 mins`.
   - **Total Price:** e.g., `₹230`.
   - **Selected Barber:** e.g., `Any Barber` or `Ravi`.
   - **Estimated Wait:** e.g., `~35 mins` (recalculates immediately on every service or barber click).
   - Primary Gold Button: **Confirm & Join Queue**.

### Buttons & Exact Functionality
| Button / Control | Behaviour |
| :--- | :--- |
| `← Back` | Navigates to `/`. |
| Service Card Toggle | Adds service to selection (if `< 3` selected) or removes it if already selected. Updates duration, price, and estimated wait instantly. |
| Barber Card Selection | Sets `preferredBarberId` (`null` for Any Barber, or specific `barber.id`). Recalculates estimated wait immediately. |
| **Confirm & Join Queue** | Validates name (≥2 chars), phone (exact 10 digits), services (1–3 selected), and online queue open status. Sends `POST /api/queue`. Shows loading spinner while submitting (prevents double-submit). On `201 Created`, saves active token ID to `localStorage` and navigates to `/status/:id`. On `409 Conflict` (duplicate active phone), displays the existing token banner with a button to open `/status/:existingId`. |
| **View My Status →** | Navigates to `/status/:existingId` when duplicate active entry is found. |

### Data Displayed
- Active services list (`id`, `nameEn`, `nameGu`, `durationMinutes`, `priceInr`).
- On-duty barbers list (`id`, `name`, `status`, `estimatedWaitMinutes`).
- Live computed summary (`selectedServices`, `totalDuration`, `totalPrice`, `estimatedWaitMinutes`).
- Salon `isOnlineJoinOpen` flag.

### Interaction Behaviour
- All form fields validate on blur and on submit; invalid fields get red border + localized error text underneath.
- Live summary updates synchronously in `< 50ms` whenever services or preferred barber change, and updates automatically if live queue data changes over Socket.IO.
- Language toggle preserves typed name, phone, selected services, and selected barber.

### States
- **Loading State:** Service & barber grids show skeleton cards while fetching `/api/services`, `/api/barbers`, and `/api/queue/summary`. Submit button shows spinner + `"Joining..."` during `POST`.
- **Empty State:** If owner has disabled all services or no barbers are on duty, shows clear empty-state notice (*"No services are currently available for booking"*) and disables submit.
- **Error State:** Field-level errors for invalid input; dismissible red error banner at top of summary for network/server errors (e.g., `"Queue just closed for online joining"` or `"Connection error. Please try again."`).

### Responsive Layouts
- **Mobile (`< 640px`):** Single-column flow, 1-column service cards (`min-h-[56px]`), 2-column barber chip grid, sticky bottom summary drawer/bar with total price/time and full-width `48px` **Confirm & Join Queue** button.
- **Tablet (`640px – 1024px`):** 2-column service grid, 2-column barber grid, sticky bottom or full-width summary card.
- **Desktop (`> 1024px`):** Two-column layout (`65%` form steps on left, `35%` sticky Live Summary card on right).

---

## SCREEN 3: MY STATUS

- **Screen Name:** My Status (Live Customer Queue Tracker)
- **URL / Route:** `/status/:id`
- **Intended User:** Customer
- **Purpose:** Allow a customer to monitor their unique token, live queue position, estimated waiting time, assigned barber, receive urgent visual/vibration turn alerts, and cancel their spot if needed.

### UI Elements (Top to Bottom)
1. **Top Header Bar:**
   - Salon name + link to Home (`/`).
   - Live connection indicator (`Live` / `Reconnecting...`).
   - `EN | ગુજરાતી` language toggle.
2. **Urgent Full-Screen / Prominent Gold Call Overlay (ONLY when `status === 'CALLED'`):**
   - Full-viewport high-impact premium gold (`#D4A017` on `#111827`) notification panel with subtle pulse ring animation:
     - Badge: `NOW CALLING`
     - Large Token: `S-14`
     - Headline: **"It's Your Turn!"**
     - Sub-headline: **"Please proceed to [Assigned Barber Name]."**
     - Advisory note: *"Please reach the chair within 10 minutes to avoid being marked as No-show."*
     - Button: **Dismiss Alert / View Details** (collapses overlay to a persistent top gold banner so user can still view service details or cancel if needed).
3. **Second-in-Line Prominent Alert Banner (ONLY when `status === 'WAITING'` and `queuePosition <= 2`):**
   - High-visibility gold/amber card with bell icon:
     - **"You're almost next! Start coming to the salon."**
4. **Barber On-Break Advisory Banner (Conditional — `status === 'WAITING'`, specific barber selected, and that barber's status is `ON_BREAK`):**
   - Amber alert: *"[Barber Name] is currently on break. You remain in their queue and will be called when they return."*
5. **Hero Token & Waiting Indicator Card:**
   - Status Pill (`Waiting`, `Called`, `In Chair`, `Completed`, `No-show`, `Cancelled`).
   - Extra-large centered Token Number (e.g., `S-14` in `#D4A017`, `56px–72px`, `tabular-nums`).
   - **Visual Progress / Waiting Indicator:**
     - 4-step horizontal progress bar: `Waiting` → `Called` → `In Chair` → `Done`.
     - When `WAITING`: circular/ring countdown indicator showing **Queue Position** (e.g., `#3 in line`) and **Estimated Wait** (e.g., `~25 mins`).
     - When `IN_CHAIR`: active service card with live ticking **Elapsed Service Time** (`12:34`) and assigned barber name (*"Currently being served by Ravi"*).
     - When `DONE`: emerald check-circle completion banner (*"Service Complete! Thank you for visiting Aura Salon."*).
     - When `NO_SHOW`: rose alert card (*"You were marked as a No-show after missing your call. Please join the queue again if you are still waiting."*) + **Rejoin Queue** button.
     - When `CANCELLED`: muted card (*"Your queue entry has been cancelled."*) + **Join Queue Again** button.
6. **Booking Summary Card:**
   - Customer Name.
   - Selected Services list (localized names + durations + prices) & Total Price / Total Duration.
   - Preferred Barber (e.g., `Any Barber` or `Ravi`).
   - Assigned Barber (displayed once `CALLED`, `IN_CHAIR`, or `DONE`).
   - Joined At timestamp.
7. **Action Footer:**
   - **Cancel My Spot** danger-outline button (visible ONLY when `status === 'WAITING'` or `status === 'CALLED'`).
   - Opens a Confirmation Modal: *"Are you sure you want to cancel Token S-14? You will lose your place in the queue."* with **Keep My Spot** and **Yes, Cancel Token** buttons.

### Buttons & Exact Functionality
| Button / Control | Behaviour |
| :--- | :--- |
| **Cancel My Spot** | Opens confirmation dialog. |
| **Yes, Cancel Token** (in modal) | Calls `PATCH /api/queue/:id/cancel`. Updates status to `CANCELLED`, clears saved active token from `localStorage`, broadcasts update to all devices. |
| **Keep My Spot** (in modal) | Closes confirmation dialog without action. |
| **Dismiss Alert / View Details** | Collapses full-screen `CALLED` overlay to a persistent gold banner on the status page. |
| **Rejoin Queue** / **Back to Home** | Navigates to `/join` or `/` (shown in terminal states `DONE`, `NO_SHOW`, `CANCELLED`). |

### Data Displayed
- Queue entry: `id`, `tokenNumber`, `customerName`, `services[]`, `totalDuration`, `totalPrice`, `preferredBarberName` (or `Any Barber`), `assignedBarberName`, `status`, `queuePosition`, `estimatedWaitMinutes`, `createdAt`, `calledAt`, `serviceStartedAt`, `completedAt`.
- Barber break state if preferred barber is `ON_BREAK`.

### Interaction Behaviour
- Subscribes to Socket.IO room/events for live updates without page refresh.
- On transition into `CALLED` status:
  - Triggers full-screen gold notification UI.
  - Invokes `navigator.vibrate([250, 120, 250, 120, 400])` if supported by browser.
  - Plays gentle chime if browser audio context is unlocked.
- Automatically refreshes elapsed timer every second while `IN_CHAIR`.

### States
- **Loading State:** Centered skeleton token card + skeleton summary rows.
- **Empty / Not Found State:** If `:id` does not exist (`404`), displays a clear card *"Queue ticket not found. It may have expired or the link is invalid."* with a **Go to Home** button.
- **Error State:** Reconnecting banner at top if WebSocket disconnects; error toast/banner if cancellation request fails, with retry option.

### Responsive Layouts
- **Mobile (`< 640px`, primary target):** Full-width centered single column, large readable token (`64px`), prominent top alert cards, thumb-friendly `48px` cancel button at bottom.
- **Tablet & Desktop (`≥ 640px`):** Centered card stack (`max-w-xl`), generous padding and crisp typography.

---

## SCREEN 4: RECEPTION DASHBOARD

- **Screen Name:** Reception Dashboard
- **URL / Route:** `/reception`
- **Intended User:** Salon Receptionist
- **Purpose:** Provide a fast, single-view operational console optimized for a 10-inch landscape tablet to manage active barbers, call the next eligible customer, register walk-ins, handle no-shows and cancellations, and monitor wait-time escalations.

### UI Elements (Top to Bottom / Left to Right)
1. **Staff PIN Gate (if unauthenticated in session):**
   - Centered dark card asking for Staff PIN with numeric input and **Unlock Dashboard** button.
2. **Top Navigation Bar (Fixed Height `64px`):**
   - Left: Salon logo + name (`Aura Salon — Reception`) + Live Clock & Date (`Wed, 18 Nov • 10:15 AM`).
   - Center: Queue Status Pill (`Online Open` / `Online Closed — Walk-ins Open` / `Salon Closed`) + **Total Waiting** counter badge (e.g., `Waiting: 6`).
   - Right: Search input (searches live by Token, Customer Name, or Phone Number), `EN | ગુજરાતી` toggle, and prominent Gold **`+ Add Walk-in`** button.
3. **Main Workspace (2-Column Landscape Split):**
   - **LEFT PANEL (`40%` width on tablet/desktop): Active Barber Cards**
     - Section Header: `Barbers` + quick summary (`2 Busy · 1 Available`).
     - Vertical scrollable stack of Barber Cards (one per on-duty barber; off-duty barbers shown muted at bottom):
       - Header: Circular avatar + Barber Name + Availability Status Pill (`Available`, `Busy`, `On Break`, `Off Duty`).
       - Active Assignment Area:
         - If `CALLED`: Gold-highlighted strip showing **Token (`S-14`)**, Customer Name, Services, status `CALLED`, and ticking wait-to-arrive timer (`Called 04:12 ago` — turns red/amber at `≥ 10:00`). Quick **`No-show`** button inline.
         - If `IN_CHAIR`: Sky-blue strip showing **Token (`S-12`)**, Customer Name, Services, live elapsed time (`18m elapsed`) + estimated remaining time (`~12m left`).
         - If `Available` (no active customer): Muted text *"Chair Ready — No active customer"* + next eligible customer preview (e.g., *"Next eligible: S-15 (Kunal)"*).
         - If `On Break`: Amber strip *"Currently On Break — Unavailable for calls"*.
       - Card Footer Primary Action: Full-width Gold **`Call Next`** button:
         - Enabled ONLY when barber is `ON_DUTY`, status is `AVAILABLE`, has no `CALLED`/`IN_CHAIR` entry, and at least one eligible `WAITING` customer exists.
         - Disabled with clear label otherwise (`In Service`, `Waiting for Customer`, `On Break`, or `No Eligible Customers`).
   - **RIGHT PANEL (`60%` width on tablet/desktop): Waiting Queue Table**
     - Filter Tabs: `Active Queue` (WAITING + CALLED + IN_CHAIR) | `Waiting Only` | `Completed / Log` (DONE, NO_SHOW, CANCELLED today).
     - Responsive Table with Columns:
       1. **Token** (Bold gold `S-14` + tiny `Walk-in` / `Online` tag)
       2. **Customer Name**
       3. **Phone** (10-digit number)
       4. **Services** (comma-separated localized names + total duration)
       5. **Preferred Barber** (`Any Barber` or specific barber name)
       6. **Waiting Duration** (live updating e.g., `24m`, `65m` — **entire row highlighted with amber background tint & amber badge when waiting > 60 minutes**)
       7. **Status** (color-coded pill)
       8. **Actions** (compact icon+label buttons with `≥ 44px` hit areas):
          - **`Call Next`** / **`Call`** (if row is `WAITING` and an eligible barber is available — calls directly for that barber or opens barber picker if multiple `Any Barber` barbers are free; note: FCFS order is highlighted and primary `Call Next` lives on each Barber Card so strict FCFS is preserved)
          - **`No-show`** (enabled when row status is `CALLED`; prompts quick confirmation, displays elapsed called minutes)
          - **`Cancel`** (enabled when `WAITING` or `CALLED`; prompts quick confirmation)
          - **`View Details`** (eye/info button opening Customer Detail Slide-over/Modal)
4. **Add Walk-in Modal / Slide-over:**
   - Fields:
     - Customer Name (required).
     - Mobile Number (required, 10 digits, validated).
     - Services (1–3 active services selectable with live duration & INR price).
     - Preferred Barber (`Any Barber` or specific on-duty barber).
   - Live summary strip (duration, price, estimated wait).
   - Duplicate phone check (if phone already active, shows existing token instead of duplicating).
   - Footer: **Cancel** + Gold **Add to Queue** button.
5. **Customer Details Modal:**
   - Full timeline (`Joined`, `Called`, `Started`, `Completed`), source (`Online` / `Walk-in`), phone, itemized services with INR prices, preferred & assigned barber, and contextual actions (`No-show`, `Cancel`).

### Buttons & Exact Functionality
| Button / Control | Behaviour |
| :--- | :--- |
| **`+ Add Walk-in`** | Opens Add Walk-in modal (works even when online joining is closed). |
| **Barber Card `Call Next`** | Sends `POST /api/queue/call-next` with `{ barberId }`. Server atomically selects the earliest FCFS `WAITING` customer matching `preferredBarberId === barberId OR preferredBarberId === null`, assigns them to `barberId`, sets status to `CALLED`, and broadcasts to all screens. |
| **Row `Call` (FCFS-safe)** | If row is the earliest eligible `WAITING` customer for an available barber, calls them via `/api/queue/call-next`; disables or warns if not eligible/barber busy. |
| **`No-show`** | Opens confirmation dialog showing how long the customer has been `CALLED` (highlights 10-min rule). On confirm, calls `PATCH /api/queue/:id/no-show`, marks entry `NO_SHOW`, frees the barber to `AVAILABLE`, and broadcasts updates. |
| **`Cancel`** | Opens confirmation dialog. On confirm, calls `PATCH /api/queue/:id/cancel`, removes from active queue, frees barber if `CALLED`, and broadcasts updates. |
| **`View Details`** | Opens Customer Details modal. |
| **Search Input** | Filters table rows client-side in real time by token, customer name, or phone number. |

### Data Displayed
- Live clock, salon open/online-join status, total waiting count.
- All barbers with current active ticket, timers, and next eligible preview.
- Full queue list for today (filterable by Active / Waiting / Completed Log).

### Interaction Behaviour
- Real-time Socket.IO updates: newly joined online customers slide into the queue automatically with a brief subtle highlight; barber actions (`START`, `DONE`, `On Break`) immediately update barber cards and table statuses.
- Waiting duration column recalculates every 30 seconds; entries waiting `> 60` minutes automatically get amber row highlight + `>60m` warning badge.
- Duplicate clicks on `Call Next` are blocked via button loading state AND backend mutex/transaction lock.

### States
- **Loading State:** Skeleton barber cards on left and skeleton table rows on right.
- **Empty State:**
  - Empty waiting queue: Clean centered state in table area — *"No customers waiting right now"* with quick **`+ Add Walk-in`** button.
  - Empty search result: *"No queue entries match '[query]'"* with **Clear Search** button.
- **Error State:** Toast notifications for failed actions (e.g., `"Barber already has an active customer"` or `"No eligible waiting customers for Ravi"`), plus top banner if real-time connection drops.

### Responsive Layouts
- **Tablet Landscape (`1024px – 1280px`, primary target — 10-inch tablet):** Full 2-column split (`40%` left barber cards, `60%` right queue table), compact horizontal top bar, no horizontal overflow, minimum `44px` buttons.
- **Desktop (`> 1280px`):** Same 2-column split with extra breathing room (`35%` left / `65%` right) and spacious table columns.
- **Mobile / Portrait Tablet (`< 1024px`):** Stacks Barber Cards horizontally/vertically above the Queue Table (with segmented view toggle `Barbers` | `Queue` on narrow phones) so reception remains usable on smaller screens.

---

## SCREEN 5: BARBER VIEW

- **Screen Name:** Barber View
- **URL / Route:** `/barber/:name` *(with `/barber` redirecting or showing a quick Barber Picker card if no name parameter is provided)*
- **Intended User:** Individual Barber (e.g., `/barber/ravi`, `/barber/amit`, `/barber/imran`)
- **Purpose:** Give each barber a focused, distraction-free, one-handed mobile interface to start and finish their assigned customer's service, track service duration, manage break status, and see who is up next.

### UI Elements (Top to Bottom)
1. **Staff PIN Gate (if unauthenticated in session):** Shared staff PIN session with Reception.
2. **Top Header Bar:**
   - Barber Avatar + **Barber Name** (e.g., `Ravi`) + dropdown/switch link to change barber if needed.
   - Availability Status Pill (`Available`, `Busy`, `On Break`, `Off Duty`).
   - `EN | ગુજરાતી` language toggle + live sync dot.
3. **Availability / Break Control Bar:**
   - Prominent toggle card: **`Available`** ↔ **`On Break`** switch (`min-h-[48px]`).
   - Disabled with explanatory note while a customer is actively `IN_CHAIR` or `CALLED` (*"Complete current customer before taking a break"*).
4. **Active Customer Card (Centerpiece):**
   - **When Customer is `CALLED`:**
     - Gold-accented card: Status badge `CALLED — Waiting for Customer`.
     - Large Token (`S-14`) + Customer Name (`Rohan Mehta`).
     - Selected Services list with individual durations + **Total Service Duration** (e.g., `45 mins`).
     - Called timestamp (`Called at 10:20 AM`).
     - Extra-large (`56px` height) full-width Gold Button: **`START SERVICE`**.
   - **When Customer is `IN_CHAIR`:**
     - Sky-blue/Emerald-accented card: Status badge `IN CHAIR — Service in Progress`.
     - Large Token (`S-14`) + Customer Name.
     - Selected Services list + **Total Service Duration** (`45 mins`).
     - **Service Start Time** (e.g., `Started at 10:22 AM`).
     - Large live ticking **Elapsed Service Timer** (`14:28` in `tabular-nums`; shifts to subtle amber if elapsed time exceeds planned total duration).
     - Extra-large (`56px` height) full-width Emerald Button: **`DONE — COMPLETE SERVICE`**.
   - **When No Active Customer (`AVAILABLE`):**
     - Calm idle card: *"You're Available — Waiting for reception to call your next customer."*
   - **When `ON_BREAK`:**
     - Amber card: *"You are On Break. Reception will not assign new customers until you switch back to Available."* + **`End Break (Go Available)`** button.
   - **When `OFF_DUTY`:**
     - Muted card: *"You are currently marked Off Duty by the salon owner."*
5. **Next Customer Preview Card (Bottom Section):**
   - Clean card showing the earliest `WAITING` customer eligible for this barber (either explicitly selected this barber or `Any Barber`):
     - Format: **`Next for you: S-15 — Kunal — Haircut`** (plus service duration & preference badge: `Requested You` vs `Any Barber`).
   - Also displays total count of customers currently waiting specifically for this barber + general pool.

### Buttons & Exact Functionality
| Button / Control | Behaviour |
| :--- | :--- |
| **`START SERVICE`** | Calls `PATCH /api/queue/:id/start`. Transitions customer `CALLED → IN_CHAIR`, sets `serviceStartedAt = now`, updates barber status to `BUSY`, broadcasts immediately to Reception, TV Display, and Customer Status. |
| **`DONE — COMPLETE SERVICE`** | Calls `PATCH /api/queue/:id/complete`. Transitions customer `IN_CHAIR → DONE`, sets `completedAt = now`, sets barber status back to `AVAILABLE`, updates Today's Statistics, and broadcasts immediately to all screens. |
| **`On Break` / `Available` Toggle** | Calls `PATCH /api/barbers/:id/status` with `{ status: 'ON_BREAK' | 'AVAILABLE' }`. Blocked if barber currently has a `CALLED` or `IN_CHAIR` customer. Updates Home, Join Queue, Reception, TV, and waiting customers who chose this barber. |
| **Barber Switcher** | Allows selecting another barber route `/barber/:name`. |

### Data Displayed
- Barber profile (`id`, `name`, `status`, `isOnDuty`).
- Active queue entry (`tokenNumber`, `customerName`, `services[]`, `totalDuration`, `status`, `calledAt`, `serviceStartedAt`).
- Live elapsed timer (`now - serviceStartedAt`).
- Next eligible customer preview (`tokenNumber`, `customerName`, `services[]`, `preferredBarberId`).

### Interaction Behaviour
- Real-time Socket.IO listener updates immediately when Reception clicks `Call Next` for this barber (plays gentle subtle visual pulse on the new `CALLED` card) or when owner changes duty status.
- Elapsed timer updates every 1 second smoothly using server `serviceStartedAt` timestamp (stays accurate across page reloads).

### States
- **Loading State:** Skeleton active customer card and next-preview bar.
- **Empty State:**
  - No active customer: *"Ready for next customer"* calm state.
  - No next eligible customer: *"Next for you: No customers waiting in queue."*
  - Invalid barber `:name` in URL (`404`): Shows *"Barber not found"* with quick buttons for all active barbers.
- **Error State:** Clear inline error toast if `START` / `DONE` / `Break` fails (e.g., if receptionist just marked the called customer `NO_SHOW` a moment earlier), followed by instant state resync.

### Responsive Layouts
- **Mobile (`< 640px`, primary target):** Single-column full-bleed cards, oversized `56px` `START` and `DONE` buttons with high contrast, minimal chrome, effortless one-handed use.
- **Tablet & Desktop (`≥ 640px`):** Centered mobile-style focus column (`max-w-lg`) so buttons remain clear and uncluttered.

---

## SCREEN 6: WAITING AREA TV DISPLAY

- **Screen Name:** Waiting Area TV Display
- **URL / Route:** `/display`
- **Intended User:** Public waiting-area audience (passive viewing on a large TV)
- **Purpose:** Display every active barber's current token/service and the next five upcoming queue tokens with high contrast, gold call-out highlights, optional audio chime, and automatic real-time updates readable from ~5 metres away.

### UI Elements (Top to Bottom)
1. **TV Header Bar:**
   - Left: Large Salon Logo + Salon Name (`Aura Salon` / `ઓરા સલૂન`).
   - Center: Opening Status Pill (`OPEN` / `ONLINE CLOSED` / `CLOSED`).
   - Right: Large Current Time (`10:25 AM`) & Date (`Wed, 18 Nov`), live sync dot, compact `EN | ગુજરાતી` toggle, and compact **Sound On/Off** button (allows staff to click once on TV browser to unlock Web Audio API chime).
2. **Main Content — Active Barber Cards Grid:**
   - One large high-contrast card per active on-duty barber (equal-width grid: 2–4 columns depending on barber count).
   - Each Barber Card displays:
     - Barber Avatar + Large Barber Name (`28px–36px`).
     - Status Badge (`NOW CALLING` in gold, `IN CHAIR` in sky-blue, `AVAILABLE` in emerald, `ON BREAK` in amber).
     - **Giant Current Token Number (`64px–88px`, bold, `tabular-nums`):**
       - When `CALLED`: High-contrast Gold (`#D4A017`) card border + subtle glow/pulse animation + `"PLEASE PROCEED"` label.
       - When `IN_CHAIR`: Crisp white token + service(s) in progress (`Haircut + Beard Trim`).
       - When `AVAILABLE`: Clean `"READY"` indicator.
       - When `ON_BREAK`: Amber `"ON BREAK"` indicator.
3. **Bottom Section — Upcoming Queue Strip (Next 5 Eligible Tokens):**
   - Clear Header: **`UPCOMING TOKENS`** + total waiting count.
   - 5 structured cards/rows showing the next 5 `WAITING` customers in FCFS order:
     - Large Token Number (`S-15`, `28px–36px`, gold).
     - Masked Customer Name (first name + last initial, e.g., `Kunal P.` for waiting-room privacy).
     - Preferred / Target Barber (`Any Barber` or `Ravi`).
     - Approximate Estimated Wait Time (`~15 min`).
4. **Newly Called Highlight Banner (Transient 8-second subtle spotlight on top/card):**
   - Whenever any token transitions to `CALLED`, that barber's card pulses gently in gold and triggers the gentle chime (if Sound is enabled).

### Buttons & Exact Functionality
| Button / Control | Behaviour |
| :--- | :--- |
| **Sound On / Muted** (corner icon) | Unlocks/mutes Web Audio API notification chime on `customer:called` events. |
| `EN \| ગુજરાતી` Toggle (corner) | Switches display copy between English and Gujarati. |
| **Fullscreen** (optional subtle corner icon) | Invokes browser `requestFullscreen()` for clean TV kiosk mode. |

### Data Displayed
- Salon branding, live clock, opening status.
- Active on-duty barbers with current `CALLED` / `IN_CHAIR` token and service names.
- Next 5 `WAITING` queue entries with token, masked name, preferred barber, and estimated wait time.

### Interaction Behaviour
- 100% passive auto-updating via Socket.IO (`queue:updated`, `customer:called`, `barbers:updated`, `settings:updated`).
- Never requires manual refresh; automatically resynchronizes full state on reconnection.
- Plays a pleasant 2-tone bell chime on `customer:called` when audio is enabled.

### States
- **Loading State:** Full-screen dark charcoal layout with clean branded loading pulse (`Aura Salon — Connecting to live queue...`).
- **Empty State:**
  - No upcoming waiting customers: Upcoming strip cleanly displays *"Walk-ins welcome — No queue right now."*
  - Salon closed / no barbers on duty: Full-screen branded welcome screen displaying salon name, operating hours, and *"We are currently closed. See you soon!"*.
- **Error State:** Non-intrusive top-right amber badge *"Reconnecting..."* while preserving last known state until connection restores; automatically recovers without user interaction.

### Responsive Layouts
- **Desktop / TV (`≥ 1280px` / `1920×1080`, primary target):** `100vh` locked no-scroll layout (`h-screen overflow-hidden`), 3-column (or auto-fit) large barber cards occupying ~62% height, 5-column upcoming tokens strip occupying ~26% height, header ~12% height. Minimum body text `20px`, token text `72px+` for crisp 5-metre readability.
- **Tablet (`640px – 1279px`):** Scrollable 2-column barber cards + 2-column upcoming grid.
- **Mobile (`< 640px`):** Stacked barber cards + vertical upcoming token list (graceful fallback if opened on phone).

---

## SCREEN 7: OWNER SETTINGS

- **Screen Name:** Owner Settings & Management Dashboard
- **URL / Route:** `/admin`
- **Intended User:** Salon Owner / Administrator
- **Purpose:** Enable the salon owner to manage services (EN/GU names, duration, INR price, active state), manage barbers (add/edit, duty & availability), configure operating hours and online queue open/close rules, and inspect Today's Statistics.

### UI Elements (Top to Bottom)
1. **Owner PIN Gate (if unauthenticated as owner in session):**
   - Centered dark card requesting Owner PIN (`POST /api/auth/verify-pin` with `role: 'owner'`).
2. **Top Header Bar:**
   - Salon Logo + `Owner Dashboard`.
   - Quick navigation links (`Home`, `Reception`, `TV Display`) + `EN | ગુજરાતી` toggle + `Lock` (logout session) button.
3. **Section Navigation Tabs (Sticky Sub-nav):**
   - `Today's Statistics` | `Services` | `Barbers` | `Queue Settings` (on desktop, users can switch cleanly or view Overview + dedicated tabs; all 4 required sections are first-class and immediately accessible).
4. **SECTION D — TODAY'S STATISTICS:**
   - 6 clear KPI Stat Cards:
     1. **Total Customers Served** (`DONE` count today)
     2. **Total Waiting** (current `WAITING` count)
     3. **Average Waiting Time** (minutes, across today's called/served customers)
     4. **No-Shows** (`NO_SHOW` count today)
     5. **Cancelled** (`CANCELLED` count today)
     6. **Total Services Completed** (total individual services completed across `DONE` entries today)
   - Simple, lightweight visual breakdowns (clean horizontal bar charts):
     - **Customers Served by Barber** (bar per barber).
     - **Top Services Today** (count per service).
5. **SECTION A — SERVICE MANAGEMENT:**
   - Header + Gold **`+ Add Service`** button.
   - List/table of all services (active and inactive) showing:
     - English Name & Gujarati Name.
     - Duration (`min`) & Price (`₹`).
     - Status Toggle (`Active` / `Inactive`).
     - Actions: **`Edit`**, **`Deactivate / Activate`** (and **`Delete`** if never referenced or soft-delete/deactivate with confirmation).
   - **Add / Edit Service Modal:**
     - English Name (required), Gujarati Name (required), Duration in minutes (`5–240`, required), Price in ₹ (`0–50000`, required), Active toggle, **Save Service** button.
6. **SECTION B — BARBER MANAGEMENT:**
   - Header + Gold **`+ Add Barber`** button.
   - Grid/table of all barbers showing:
     - Avatar / Initials, Name, Specialty.
     - **On Duty / Off Duty** toggle switch.
     - **Availability Status** selector (`Available`, `On Break`, `Busy` read-only while serving).
     - Actions: **`Edit`**, **`Remove`** (soft-deactivate/delete if no active customer).
   - **Add / Edit Barber Modal:**
     - Name (required, unique slug for `/barber/:name`), Specialty/Title (optional), Avatar Color / URL, On Duty toggle, **Save Barber** button.
7. **SECTION C — QUEUE SETTINGS:**
   - Configuration Card:
     - **Salon Name (English)** & **Salon Name (Gujarati)**.
     - **Opening Time** (`HH:MM` time picker, e.g., `09:00`).
     - **Closing Time** (`HH:MM` time picker, e.g., `21:00`).
     - **Online Queue Joining Control:** Toggle **`Online Queue Open`** / **`Close Online Queue`**.
     - Live Computed Status Readout Box:
       - Displays exact auto-cutoff time (e.g., *"Online joining automatically closes at **8:30 PM** (30 mins before closing). Walk-ins remain available at Reception."*).
       - Shows current effective state (`Online Open` / `Online Closed`).
     - Gold **`Save Settings`** button.

### Buttons & Exact Functionality
| Button / Control | Behaviour |
| :--- | :--- |
| **`+ Add Service`** / **`Edit`** / **`Save Service`** | Creates (`POST /api/services`) or updates (`PATCH /api/services/:id`) a service. Broadcasts `services:updated` so `/join` and Reception walk-in form update immediately. |
| **Service Active Toggle** | Calls `PATCH /api/services/:id` toggling `isActive`. Deactivated services disappear immediately from `/join` and Reception walk-in selection without affecting historical entries. |
| **Service Delete** | Confirms and deletes (`DELETE /api/services/:id`) or soft-archives if referenced by historical entries. |
| **`+ Add Barber`** / **`Edit`** / **`Save Barber`** | Creates (`POST /api/barbers`) or updates (`PATCH /api/barbers/:id`) a barber. Broadcasts `barbers:updated` to Home, Join, Reception, Barber View, and TV Display. |
| **Barber On/Off Duty & Availability Toggle** | Updates duty/availability via `PATCH /api/barbers/:id`. Blocked if barber currently has an active `CALLED` or `IN_CHAIR` customer (shows clear error toast). |
| **Online Queue Toggle & `Save Settings`** | Calls `PATCH /api/settings`. Immediately updates open/closing hours and manual online-join state across all connected screens. |
| **`Lock` (Logout)** | Clears owner PIN from `sessionStorage` and returns to PIN gate. |

### Data Displayed
- Daily KPI metrics & simple barber/service distribution bars.
- Complete services catalog (including inactive).
- Complete barbers list (including off-duty).
- Salon operating hours, manual online override, and computed effective online status.

### Interaction Behaviour
- Today's Statistics update automatically in real time as customers join, start, complete, no-show, or cancel across other devices.
- Saving any service, barber, or setting shows an instant confirmation toast and pushes live updates to every open screen within `< 5` seconds.

### States
- **Loading State:** Skeleton KPI cards and skeleton table rows per section.
- **Empty State:**
  - Stats with zero activity today: displays `0` cleanly and *"No completed services yet today"* in breakdown charts.
  - No services / no barbers: clear prompt with **`+ Add Service`** / **`+ Add Barber`** CTA.
- **Error State:** Inline form validation errors (e.g., closing time must be after opening time; negative price/duration rejected) and dismissible error toasts on failed API requests.

### Responsive Layouts
- **Desktop (`≥ 1024px`, primary target):** Clean max-width (`max-w-6xl`) workspace with 3×2 KPI stat grid, 2-column chart breakdown, and structured data tables.
- **Tablet (`640px – 1023px`):** 2×3 KPI stat grid, horizontal scrollable tab bar, clean card/table layout.
- **Mobile (`< 640px`):** Single-column stacked KPI cards, service/barber tables adapt cleanly into stacked cards, `44px` minimum buttons and toggles.
