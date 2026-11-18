# 03 — Flows, Business Rules & Test Checklist

This document defines the authoritative business logic, user journeys, state transitions, waiting-time formulas, multi-device synchronization rules, edge cases, and QA test checklist for the Salon Queue Management System.

All queue business logic **must** live centrally in the backend Queue Management Engine (`server/src/services/queueEngine.js`) and never be duplicated or diverged across frontend components.

---

## 1. User Journeys & Operational Workflows

### 1.1 Remote Customer Journey
1. Customer opens **Home (`/`)** on their mobile browser (optionally switches to Gujarati `ગુજરાતી`).
2. Reviews salon opening status, waiting count (e.g., `6 people waiting`), approximate waiting time (`~50 mins`), and active barbers.
3. Taps **Join Queue** → navigates to **Join Queue (`/join`)**.
4. Enters full name and 10-digit Indian mobile number (validated live).
5. Selects 1 to 3 active services; live summary immediately displays total duration and INR price.
6. Chooses **Any Barber (Fastest Available)** or a specific on-duty barber; estimated waiting time updates immediately.
7. Taps **Confirm & Join Queue**:
   - Backend validates queue open status, active services, valid on-duty barber, and duplicate phone check.
   - If phone already has an active entry (`WAITING`, `CALLED`, or `IN_CHAIR`), system returns the existing token (`409 Conflict` with entry payload) and prompts customer to open their existing `/status/:id`.
   - Otherwise, generates next sequential daily token (e.g., `S-14`), persists entry with `source = 'ONLINE'`, broadcasts `queue:updated`, and redirects customer to **My Status (`/status/:id`)**.
8. On **My Status**, customer watches their queue position and estimated wait update live without page refresh.
9. When customer reaches position `#1` or `#2` (`WAITING`), prominent alert appears: **"You're almost next! Start coming to the salon."**
10. When Reception calls their token, customer receives full-screen gold **"It's Your Turn! Please proceed to [Barber]."** notification (with subtle pulse + browser vibration if supported).
11. Customer arrives at chair → Barber taps **START** → status transitions to `IN_CHAIR` with live elapsed timer.
12. Barber finishes and taps **DONE** → status transitions to `DONE` with completion confirmation.

### 1.2 Walk-in Customer Journey
1. Customer arrives physically at the salon without joining online.
2. Receptionist taps **`+ Add Walk-in`** on **Reception Dashboard (`/reception`)** (works even when online joining is closed within operating hours).
3. Receptionist enters customer's name, 10-digit phone number, 1–3 active services, and preferred barber (`Any Barber` or specific barber), then taps **Add to Queue**.
4. Backend applies the exact same validation, duplicate-phone check, token sequence (`S-XX`), and FCFS queue ordering, storing `source = 'WALK_IN'`.
5. Entry immediately appears in Reception's waiting table, updates Home's wait count, updates TV Display's upcoming 5 tokens, and updates Barber Views' next-customer preview.
6. Walk-in customer tracks their turn via the **Waiting Area TV Display (`/display`)** (and optionally via their `/status/:id` link if reception shares it).

### 1.3 Receptionist Workflow
1. Opens **`/reception`** on a 10-inch landscape tablet and unlocks with Staff PIN.
2. Monitors left-side Barber Cards and right-side Waiting Queue Table simultaneously.
3. Sees online joiners appear live without refresh; adds physical walk-ins via **`+ Add Walk-in`**.
4. Whenever an on-duty barber is `AVAILABLE` and has no active customer, receptionist taps **`Call Next`** on that barber's card.
5. Monitors `CALLED` customers' arrival timer on the barber card:
   - If customer arrives, barber taps **START** on their own phone and Reception updates to `IN_CHAIR` automatically.
   - If customer does not arrive within **10 minutes**, receptionist taps **`No-show`**, freeing the barber immediately.
6. Watches for customers waiting **`> 60 minutes`** (automatically highlighted in amber in the queue table) and views full details or cancels entries upon customer request.

### 1.4 Barber Workflow
1. Opens **`/barber/:name`** (e.g., `/barber/ravi`) on their smartphone and unlocks with Staff PIN.
2. Checks availability status (`Available` / `On Break`) and previews next eligible customer (*"Next for you: S-15 — Kunal — Haircut"*).
3. When Reception calls a customer for this barber, Barber View immediately shows the `CALLED` customer card with token, customer name, services, and total duration.
4. Once customer sits in the chair, barber taps large **`START SERVICE`** button → status becomes `IN_CHAIR`, elapsed timer starts, and Reception, TV Display, and Customer Status update immediately.
5. Upon finishing all selected services, barber taps large **`DONE — COMPLETE SERVICE`** button → status becomes `DONE`, barber automatically returns to `AVAILABLE`, Today's Statistics increment, and all screens update immediately.
6. When needing a break (only allowed when no customer is `CALLED` or `IN_CHAIR`), barber toggles **`On Break`**; toggles back to **`Available`** when ready.

---

## 2. Queue Status & Barber Availability State Models

### 2.1 Clear Separation of Status Models
| Model | Allowed Values | Meaning |
| :--- | :--- | :--- |
| **Barber Availability** | `AVAILABLE`, `BUSY`, `ON_BREAK`, `OFF_DUTY` | Operational readiness of a barber's chair. |
| **Queue-Entry Status** | `WAITING`, `CALLED`, `IN_CHAIR`, `DONE`, `NO_SHOW`, `CANCELLED` | Lifecycle state of a customer's token. |

### 2.2 Barber Availability Rules
- A barber **cannot** receive another customer while `BUSY` (i.e., while handling an active `CALLED` or `IN_CHAIR` customer).
- A barber **cannot** receive a customer while `ON_BREAK` or `OFF_DUTY`.
- A barber **cannot** switch to `ON_BREAK` (or be marked `OFF_DUTY`) while handling an active customer (`CALLED` or `IN_CHAIR`).
- A barber who is currently `ON_BREAK` **remains visible** in the customer barber selection interface (`/join` and Reception walk-in) with an `On Break` status indicator, but **does not accept new bookings** until returning to `AVAILABLE`.
- Existing customers who already selected that barber before the break **remain assigned** to that barber's queue and are never reassigned to another barber.

### 2.3 Allowed Queue-Entry Transitions
```text
WAITING  ──► CALLED    (Reception calls next eligible customer for an available barber)
WAITING  ──► CANCELLED (Customer self-cancels or Receptionist cancels)

CALLED   ──► IN_CHAIR  (Assigned barber taps START)
CALLED   ──► NO_SHOW   (Receptionist marks No-show after the 10-minute grace period elapses)
CALLED   ──► CANCELLED (Customer self-cancels or Receptionist cancels before sitting)

IN_CHAIR ──► DONE      (Assigned barber taps DONE)
```

### 2.4 Strict State Machine Enforcement Rules
- **Terminal states:** `DONE`, `NO_SHOW`, and `CANCELLED` are strictly terminal. No transitions out of terminal states are permitted.
- **No backward transitions:** Transitions such as `IN_CHAIR → CALLED`, `IN_CHAIR → WAITING`, `CALLED → WAITING`, `DONE → IN_CHAIR`, or `NO_SHOW → WAITING` are **forbidden** and rejected by the backend with HTTP `409 Conflict`.
- **Single active state per customer:** Active statuses are `WAITING`, `CALLED`, and `IN_CHAIR`.
- **Single active customer per barber:** A barber can be linked to **at most one** entry in `CALLED` or `IN_CHAIR` status at any moment.

---

## 3. Barber Allocation Rules (FCFS + Preference Integrity)

When Reception invokes **`Call Next`** for Barber `X`:
1. Acquire an atomic server-side allocation lock / database transaction to prevent concurrent race conditions.
2. Verify Barber `X` exists, has `isOnDuty === true`, has `status === 'AVAILABLE'`, and has **zero** existing queue entries in `CALLED` or `IN_CHAIR`. If not, reject with `409 Conflict`.
3. Query all entries where `status === 'WAITING'`, ordered strictly **First-Come, First-Served** by `(createdAt ASC, id ASC)`.
4. Select the **earliest** entry satisfying:
   - `preferredBarberId === X.id` **OR** `preferredBarberId === null` (`Any Barber`).
5. If no eligible entry exists, return `404` / friendly message (`"No eligible waiting customers for [X.name]"`).
6. Atomically:
   - Update entry: `status = 'CALLED'`, `assignedBarberId = X.id`, `calledAt = now()`.
   - Update Barber `X`: `status = 'BUSY'` (representing reserved/active chair until `DONE`, `NO_SHOW`, or `CANCELLED`).
7. Commit transaction and broadcast `queue:updated`, `barbers:updated`, and `customer:called` events to all connected clients.

### Hard Invariants
- If a customer explicitly selected **Ravi**, they are **NEVER** assigned to **Amit** or **Imran**, even if Amit or Imran are idle.
- A customer who selected **Any Barber** can be allocated to whichever eligible on-duty `AVAILABLE` barber calls next.
- One customer can **NEVER** be assigned to two barbers simultaneously.
- One barber can **NEVER** have more than one active (`CALLED` or `IN_CHAIR`) customer simultaneously.

---

## 4. Approximate Waiting-Time Calculation & Limitations

All estimated waiting times displayed in the system are **approximate** planning indicators computed dynamically from live queue data. The engine maintains **separate calculations** for **Any Barber** and **Specific Barber** selections and **never violates barber preferences** to manufacture a shorter waiting estimate (e.g., an idle chair belonging to Amit is never used to reduce the waiting estimate for a customer who specifically chose Ravi).

### 4.1 Any Barber Wait Formula (Home Screen & `Any Barber` Selection)
Following the assignment formula:
$$\text{Estimated Wait (Any Barber)} \approx \left\lceil \frac{\text{Total Remaining Minutes of Active Chairs} + \text{Total Service Minutes of Waiting Customers Ahead}}{\max(1, \text{Number of Working Barbers})} \right\rceil$$

Where:
- **Working Barbers** = count of barbers where `isOnDuty === true` AND `status !== 'ON_BREAK'`. (If all on-duty barbers are temporarily `ON_BREAK`, we fall back to `max(1, onDutyBarbers.length)` and show a break advisory).
- **Remaining Minutes of an Active (`IN_CHAIR`) Customer** = `max(5, totalDuration - elapsedMinutes)` so an ongoing haircut nearing completion contributes at least 5 minutes remaining rather than negative time. A `CALLED` customer contributes their full `totalDuration`.
- **Special Zero-Wait Case:** If `waitingCount === 0` AND at least one on-duty barber is `AVAILABLE`, estimated wait for a new `Any Barber` joiner is **`0 minutes`**.

### 4.2 Specific Barber Wait Formula (Customer Selected Barber `X`)
When calculating an approximate wait time for a customer who chose Barber `X` specifically (either previewing on `/join` or tracking position on `/status/:id`), **only Barber `X`'s chair and queue load are considered**—never borrowing idle capacity from another barber:
1. Compute `remainingMinutesOnChair(X)` for Barber `X`'s current `CALLED` / `IN_CHAIR` customer (`0` if Barber `X` is `AVAILABLE`).
2. Add `totalDuration` of all `WAITING` customers ahead of this customer who specifically chose Barber `X`.
3. Add Barber `X`'s proportional share of `WAITING` customers ahead who chose `Any Barber` (since Barber `X` also serves FCFS `Any Barber` customers when ahead in line):
   $$\text{Any-Barber Share} = \frac{\sum \text{duration of Any-Barber customers ahead}}{\max(1, \text{Number of Working Barbers})}$$
4. Approximate estimated wait for Barber `X` = $\lceil \text{remainingMinutesOnChair}(X) + \text{specificAheadMinutes}(X) + \text{Any-Barber Share} \rceil$.

### 4.3 Queue Position Calculation (for `/status/:id`)
- If customer chose **Any Barber**: position = `1 + (number of WAITING customers with earlier createdAt/id)`.
- If customer chose **Specific Barber `X`**: eligible ahead = earlier `WAITING` customers who chose Barber `X` or `Any Barber`, giving their effective position in Barber `X`'s queue.
- **"Almost Next" Trigger:** Shown prominently when `status === 'WAITING'` and `queuePosition <= 2`.

### 4.4 Documented Limitations
- Waiting times are **approximate** estimates based on catalog service durations; actual service times vary by hair complexity and customer arrival speed.
- If a barber is `ON_BREAK`, break duration is unknown, so an explicit "Barber is on break" advisory is shown alongside the estimate rather than guessing return time.
- Customers choosing `Any Barber` may be pulled by another barber faster than a barber-specific estimate predicts; estimates automatically recalculate in real time after every status change.

---

## 5. No-Show Handling (Consistent 10-Minute Grace Period)
1. The **10-minute grace timer** begins the exact moment a customer's status transitions to `CALLED` (`calledAt = now()`).
2. Reception Dashboard displays a live countdown/elapsed timer on both the barber card and the queue row (e.g., `04:12 / 10:00` — `05:48 left`).
3. The **`No-show`** action becomes **available strictly after 10 minutes** have elapsed since `calledAt` (disabled with countdown before 10 minutes on UI and enforced on the backend via configurable `NO_SHOW_GRACE_MINUTES`, defaulting to `10`).
4. Once Reception clicks **`No-show`** and confirms the dialog, the backend atomically:
   - Validates current status is `CALLED` and elapsed time since `calledAt` is `>= 10 minutes` (otherwise returns HTTP `409 Conflict`).
   - Updates the customer entry to `status = 'NO_SHOW'`, `completedAt = now()`.
   - Updates the assigned barber's availability back to `AVAILABLE`.
5. The customer is immediately removed from the active queue across all screens.
6. **Rejoining after No-show:** Because `NO_SHOW` is terminal, the phone number no longer has an active entry. If the customer returns later, they must join the queue again via `/join` or Reception Walk-in to receive a **brand-new token** placed at the **end of the queue** (FCFS).

---

## 6. Cancellation Handling
1. A customer may cancel their own active entry from `/status/:id` (with confirmation dialog), or the receptionist may cancel an entry from `/reception` (with confirmation dialog).
2. Cancellation is permitted only when `status` is `WAITING` or `CALLED`. Once `IN_CHAIR`, cancellation is disabled (service is already underway).
3. Backend atomically:
   - Updates entry `status = 'CANCELLED'`, `completedAt = now()`.
   - If the entry was `CALLED`, immediately frees the assigned barber back to `AVAILABLE`.
4. Broadcasts updates immediately so queue positions, approximate wait times, TV upcoming tokens, Barber next-customer preview, and Today's Statistics reflect the cancellation (targeting within 5 seconds under normal network conditions).

---

## 7. Salon Opening & Closing Behaviour
1. Owner configures `openTime` (default `09:00`), `closeTime` (default `21:00`), and manual override `isOnlineJoinManuallyClosed` (default `false`) in Owner Settings (`/admin`).
2. **Server-Computed Effective States** (evaluated using salon local timezone / IST `Asia/Kolkata` configurable via `SALON_TIMEZONE`):
   - `isSalonOpen`: true when `openTime <= currentTime < closeTime`.
   - `autoOnlineCloseTime`: `closeTime - 30 minutes` (e.g., `20:30` for `21:00` closing).
   - `isOnlineJoinOpen`: true **ONLY IF** `isSalonOpen === true` AND `currentTime < autoOnlineCloseTime` AND `isOnlineJoinManuallyClosed === false` AND at least one barber is `isOnDuty === true`.
3. **30-Minute Automatic Cutoff:** At `closeTime - 30 minutes`, online joining closes automatically:
   - Home (`/`) disables **Join Queue** and explains *"Online joining closes 30 minutes before closing time. Walk-ins are still welcome at reception."*
   - Join Queue (`/join`) blocks online submission on both client and server (`403 Forbidden`).
4. **Walk-in Continuity:** Reception's **`+ Add Walk-in`** remains **enabled** even when online joining is manually closed or past the 30-minute auto-cutoff, so reception can continue serving physical walk-ins until salon closing.

---

## 8. Multi-Device Synchronization & Concurrency
- **Transport:** Persistent **Socket.IO** connection from every frontend screen to the Node.js backend, with automatic reconnection and HTTP polling fallback if WebSockets are temporarily unavailable.
- **Event Catalogue:**
  - `queue:updated` — emitted on join, walk-in, call-next, start, complete, no-show, cancel.
  - `customer:called` — emitted with `{ entryId, tokenNumber, customerName, barberId, barberName }` to trigger Customer Status gold overlay/vibration and TV Display gold highlight + chime.
  - `barbers:updated` — emitted on barber availability/duty/CRUD changes.
  - `services:updated` — emitted on service CRUD/active toggles.
  - `settings:updated` — emitted on operating hours or online-join toggle updates.
- **Synchronization Target:** Updates are **targeted within 5 seconds under normal network conditions** (typically sub-second over healthy connections).
- **Reconnection, Connection Indicators & Authoritative State Refresh:**
  - Every live screen displays a clear connection indicator (`Live`, `Reconnecting`, `Offline`).
  - Automatic Socket.IO reconnection runs with bounded exponential backoff.
  - Immediately after reconnecting (or when a mobile tab resumes via `visibilitychange`), each screen performs an **authoritative REST state refresh** from the backend so no missed events leave stale UI state.
- **Safe Handling of Failed Requests & Duplicate Actions:**
  - Action buttons lock into a loading state while in flight to prevent accidental double-clicks.
  - Failed API mutations display clear localized errors and re-sync server state without corrupting UI state.
  - Critical server mutations (`POST /api/queue`, `POST /api/queue/call-next`, status transitions) run inside a serialized server-side mutex and SQLite write transaction so simultaneous requests from multiple devices cannot create duplicate active phone entries or double-assign a customer or barber.

---

## 9. Edge Cases

| # | Edge Case | Expected System Behaviour |
| :--- | :--- | :--- |
| 1 | **Duplicate Phone Join** | Customer tries to join with a phone number already in `WAITING`, `CALLED`, or `IN_CHAIR`. Backend rejects creation (`409`) and returns the existing entry; UI shows existing token (`S-14`) and links directly to `/status/:id`. |
| 2 | **Simultaneous `Call Next` Clicks** | Two tabs click `Call Next` at the exact same millisecond for two available barbers when only 1 customer is waiting. Server mutex/transaction assigns customer to the first request and returns `"No eligible waiting customers"` to the second — never double-assigns. |
| 3 | **Barber Goes `On Break` With Waiting Specific Customers** | Barber Ravi toggles `On Break`. Customers already waiting specifically for Ravi are **NOT** silently reassigned to Amit/Imran and see an amber notice on `/status/:id`. Ravi remains **visible** in customer barber selection (`/join` & Walk-in) with an `On Break` badge, but **cannot accept new bookings** or receive `Call Next` calls until returning to `AVAILABLE`. |
| 4 | **Barber Tries `On Break` / Owner Sets `Off Duty` While Serving** | Blocked with clear validation error (`409`): barber must finish (`DONE`) or reception must mark `NO_SHOW`/`CANCELLED` for their active customer first. |
| 5 | **Owner Deactivates a Service Already Selected by Waiting Customers** | Existing queue entries keep a snapshot of their selected service names, durations, and prices so active tickets and daily stats remain intact; deactivated service disappears immediately from `/join` and Reception walk-in form. |
| 6 | **Customer Waits > 60 Minutes** | Reception queue table highlights the entire row in amber with a `>60m` warning indicator. |
| 7 | **Network Drop During Form Submit** | Submit button shows loading state while pending, prevents duplicate submissions, surfaces clear retry error on failure, and safely detects duplicate phone if retry follows a completed server write. |
| 8 | **Page Refresh on Client-Side Routes** | Direct refresh on `/status/:id`, `/barber/ravi`, `/reception`, `/display`, or `/admin` works seamlessly via Vercel SPA rewrite (`vercel.json`) and rehydrates state from the backend API. |
| 9 | **Daily Token Reset / Day Rollover** | Tokens (`S-01`, `S-02`, ...) are scoped to the salon's current business date (`YYYY-MM-DD` in salon timezone) so each new day cleanly starts at `S-01` while preserving prior day records in the database. |

---

## 10. QA Test Checklist (12 Mandatory Test Cases)

| ID | Test Scenario | Preconditions | Test Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Remote Customer Join & Live Calculation** | Salon open, online joining open, seeded services & barbers active. | Open `/join`. Enter name `"Aarav Patel"`, invalid 9-digit phone `"987654321"` → submit. Fix to `"9876543210"`. Select 3 services (Haircut ₹150/30m, Beard Trim ₹80/15m, Hair Wash ₹100/15m). Attempt to click a 4th service. Select `Any Barber` → submit. | 9-digit phone blocked with validation error. 4th service blocked (max 3). Live summary shows `60 mins` & `₹330`. Submit creates unique token (`S-01`) and redirects to `/status/:id`. | Pending |
| **TC-02** | **Duplicate Phone Prevention** | `"9876543210"` has active token `S-01` (`WAITING`). | Open `/join` in another tab. Attempt to join again with `"9876543210"`. | No new token created. UI shows existing token `S-01` with button to open `/status/:id`. | Pending |
| **TC-03** | **Walk-in Registration & Unified FCFS Ordering** | `S-01` (Online) is waiting. | On `/reception`, click `+ Add Walk-in`, add `"Kunal Shah"` (`9876500002`, Haircut, `Any Barber`). | Creates `S-02` placed strictly behind `S-01` in the same queue table; updates Home waiting count & TV upcoming list within 5s. | Pending |
| **TC-04** | **Specific Barber Preference Integrity** | Ravi is `BUSY`, Amit is `AVAILABLE`. Customer `S-03` specifically selects `Ravi`. Customer `S-04` selects `Any Barber`. | On `/reception`, click `Call Next` on **Amit's** card. | Amit is assigned `S-04` (`Any Barber`), **skipping** `S-03`. `S-03` remains `WAITING` for Ravi. | Pending |
| **TC-05** | **Multi-Device End-to-End Lifecycle & Live Sync** | Open 4 browser windows side-by-side: Customer `/status/:id`, Reception `/reception`, Barber `/barber/amit`, TV `/display`. | 1. Reception clicks `Call Next` for Amit.<br>2. Barber taps `START`.<br>3. Barber taps `DONE`. | 1. Under normal network conditions (target ≤ 5s): Customer shows full-screen gold `"It's Your Turn! Please proceed to Amit."`, TV highlights token in gold, Barber sees customer.<br>2. All screens update to `IN_CHAIR` with elapsed timer.<br>3. All screens update to `DONE`, Amit returns to `AVAILABLE`, Owner stats increment. | Pending |
| **TC-06** | **Second-in-Line Customer Notification** | 3 waiting customers (`S-01`, `S-02`, `S-03`) for `Any Barber`. | Open `S-02`'s `/status/:id` page. | Prominent alert displays: `"You're almost next! Start coming to the salon."` | Pending |
| **TC-07** | **No-Show (10-Min Grace Period) & Rejoin at End of Queue** | `S-05` (`9876500005`) is `CALLED` for Ravi. `S-06` is `WAITING`. | 1. Immediately check `No-show` button on `/reception` before 10 mins elapse.<br>2. Once 10-min grace period elapses (verified with elapsed timer / test clock), confirm `No-show` for `S-05`.<br>3. Register `"9876500005"` again on `/join`. | 1. `No-show` is disabled with live countdown before 10 mins.<br>2. After 10 mins, `No-show` activates and transitions `S-05` to `NO_SHOW`, freeing Ravi to `AVAILABLE`.<br>3. Rejoining assigns brand-new token `S-07` placed strictly **after** `S-06`. | Pending |
| **TC-08** | **Customer Self-Cancellation** | `S-06` is `WAITING`. | On `/status/:id`, click `Cancel My Spot` and confirm modal. | Status becomes `CANCELLED`; entry disappears from active Reception table & TV upcoming tokens; remaining customers' approximate wait times decrease. | Pending |
| **TC-09** | **Barber On Break Handling** | Ravi is `AVAILABLE`; customer `S-08` is `WAITING` specifically for Ravi. | On `/barber/ravi`, toggle `On Break`. Check `/reception`, `/join`, and `S-08`'s `/status/:id`. | Ravi's `Call Next` is disabled on Reception; on `/join`, Ravi remains **visible** with `On Break` status but cannot accept new bookings; `S-08` remains assigned to Ravi (NOT reassigned) and sees an amber "Ravi is on break" notice. | Pending |
| **TC-10** | **Queue Closing (30-Min Cutoff & Manual Close) vs Walk-ins** | Salon open. | In `/admin`, toggle Online Queue to Closed (or set close time to 20 mins from now). Visit `/`, `/join`, and `/reception`. | `/` disables `Join Queue` with clear explanation. `/join` rejects online submission. `/reception` `+ Add Walk-in` **still works** and adds walk-in customer. | Pending |
| **TC-11** | **Owner Service & Barber Management Sync** | Admin unlocked at `/admin`. | Deactivate `"Facial"` service; add new service `"Head Massage"` (EN/GU, 20m, ₹120); add new barber `"Dev"` (`On Duty`). Open `/join` & `/display`. | `"Facial"` disappears from `/join`; `"Head Massage"` appears with localized EN/GU names; `"Dev"` appears on `/`, `/join`, `/reception`, and `/display`. | Pending |
| **TC-12** | **English / Gujarati Language Switch & State Persistence** | Open `/join` and type name `"Meera"` + select 2 services. | Click `EN \| ગુજરાતી` toggle across `/`, `/join`, `/status/:id`, `/reception`, `/barber/:name`, `/display`, `/admin`. | All labels, buttons, statuses, validation errors, and service names switch cleanly to Gujarati and back without clearing typed form inputs or losing active screen state. | Pending |

