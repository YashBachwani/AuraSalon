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

## 2. Queue Status State Machine

### Allowed Status Transitions
```text
WAITING  ──► CALLED    (Reception calls next eligible customer for an available barber)
WAITING  ──► CANCELLED (Customer self-cancels or Receptionist cancels)

CALLED   ──► IN_CHAIR  (Assigned barber taps START)
CALLED   ──► NO_SHOW   (Receptionist marks No-show after grace period / customer absent)
CALLED   ──► CANCELLED (Customer self-cancels or Receptionist cancels before sitting)

IN_CHAIR ──► DONE      (Assigned barber taps DONE)
```

### Strict State Machine Enforcement Rules
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

## 4. Waiting-Time Calculation Formula & Limitations

### General Salon Wait Formula (Home Screen & `Any Barber` Selection)
Following the assignment formula:
$$\text{Estimated Wait (Any Barber)} \approx \left\lceil \frac{\text{Total Remaining Minutes of Active Chairs} + \text{Total Service Minutes of Waiting Customers Ahead}}{\max(1, \text{Number of Working Barbers})} \right\rceil$$

Where:
- **Working Barbers** = count of barbers where `isOnDuty === true` AND `status !== 'ON_BREAK'`. (If all on-duty barbers are temporarily `ON_BREAK`, we fall back to `max(1, onDutyBarbers.length)` and show a break advisory).
- **Remaining Minutes of an Active (`IN_CHAIR`) Customer** = `max(5, totalDuration - elapsedMinutes)` so an ongoing haircut nearing completion contributes at least 5 minutes remaining rather than negative time. A `CALLED` customer contributes their full `totalDuration`.
- **Special Zero-Wait Case:** If `waitingCount === 0` AND at least one on-duty barber is `AVAILABLE`, estimated wait for a new `Any Barber` joiner is **`0 minutes`**.

### Barber-Specific Wait Formula (Customer Selected Specific Barber `X`)
When calculating wait time for a customer who chose Barber `X` specifically (either previewing on `/join` or tracking position on `/status/:id`):
1. Compute `remainingMinutesOnChair(X)` for Barber `X`'s current `CALLED` / `IN_CHAIR` customer (0 if `AVAILABLE`).
2. Add `totalDuration` of all `WAITING` customers ahead of this customer who specifically chose Barber `X`.
3. Add an equitable share of `WAITING` customers ahead who chose `Any Barber`:
   $$\text{Any-Barber Share} = \frac{\sum \text{duration of Any-Barber customers ahead}}{\max(1, \text{Number of Working Barbers})}$$
4. Total estimated wait for Barber `X` = $\lceil \text{remainingMinutesOnChair}(X) + \text{specificAheadMinutes}(X) + \text{Any-Barber Share} \rceil$.

### Queue Position Calculation (for `/status/:id`)
- If customer chose **Any Barber**: position = `1 + (number of WAITING customers with earlier createdAt/id)`.
- If customer chose **Specific Barber `X`**: eligible ahead = earlier `WAITING` customers who chose Barber `X` or `Any Barber`, giving their effective position in Barber `X`'s queue.
- **"Almost Next" Trigger:** Shown prominently when `status === 'WAITING'` and `queuePosition <= 2`.

### Documented Limitations
- Estimates use configured catalog service durations; actual service times vary by hair complexity and customer tardiness.
- If a barber is `ON_BREAK`, break duration is unknown, so an explicit "Barber is on break" advisory is shown alongside the estimate rather than guessing return time.
- Customers choosing `Any Barber` may be pulled by another barber faster than a barber-specific estimate predicts; estimates automatically recalculate in real time after every status change.

---

## 5. No-Show Handling
1. When a customer's status transitions to `CALLED`, the server records `calledAt`.
2. Reception Dashboard displays a live arrival timer (`now - calledAt`) on the barber card and queue row.
3. Once a called customer fails to arrive within **10 minutes** (or is confirmed absent by reception), the receptionist clicks **`No-show`** and confirms the dialog. *(Note: Receptionists may also mark an obviously absent customer as No-show with confirmation; UI clearly highlights when the 10-minute mark has elapsed).*
4. Backend atomically:
   - Validates current status is `CALLED`.
   - Sets entry `status = 'NO_SHOW'`, `completedAt = now()`.
   - Sets assigned barber `status = 'AVAILABLE'`.
5. Customer is removed from the active queue immediately across all screens.
6. **Rejoining after No-show:** Because `NO_SHOW` is terminal, the phone number no longer has an active entry. If the customer returns later, they must register again via `/join` or Reception Walk-in, receive a **brand-new token**, and be placed at the **end of the queue** (FCFS).

---

## 6. Cancellation Handling
1. A customer may cancel their own active entry from `/status/:id` (with confirmation dialog), or the receptionist may cancel an entry from `/reception` (with confirmation dialog).
2. Cancellation is permitted only when `status` is `WAITING` or `CALLED`. Once `IN_CHAIR`, cancellation is disabled (service is already underway).
3. Backend atomically:
   - Updates entry `status = 'CANCELLED'`, `completedAt = now()`.
   - If the entry was `CALLED`, immediately frees the assigned barber back to `AVAILABLE`.
4. Broadcasts updates immediately so queue positions, estimated wait times, TV upcoming tokens, Barber next-customer preview, and Today's Statistics reflect the cancellation within 5 seconds.

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
4. **Walk-in Continuity:** Reception's **`+ Add Walk-in`** remains **enabled** even when online joining is manually closed or past the 30-minute auto-cutoff, so reception can continue serving physical walk-ins until closing.

---

## 8. Multi-Device Synchronization & Concurrency
- **Transport:** Persistent **Socket.IO** WebSocket connection from every frontend screen to the Node.js backend, with automatic fallback/reconnection.
- **Event Catalogue:**
  - `queue:updated` — emitted on join, walk-in, call-next, start, complete, no-show, cancel.
  - `customer:called` — emitted with `{ entryId, tokenNumber, customerName, barberId, barberName }` to trigger Customer Status gold overlay/vibration and TV Display gold highlight + chime.
  - `barbers:updated` — emitted on barber status/duty/CRUD changes.
  - `services:updated` — emitted on service CRUD/active toggles.
  - `settings:updated` — emitted on operating hours or online-join toggle updates.
- **Target Latency:** Sub-second typical propagation; guaranteed `< 5 seconds` SLA.
- **Reconnection & Stale Data Recovery:**
  - Every screen displays a subtle connection status dot.
  - Upon Socket.IO `reconnect` event (or window `visibilitychange` back to foreground on mobile phones that slept), each screen automatically re-fetches authoritative REST state to guarantee zero stale UI data.
- **Concurrency & Race Condition Prevention:**
  - Critical mutations (`POST /api/queue`, `POST /api/queue/call-next`, status transitions) run inside a serialized server-side mutex/database transaction so simultaneous requests from two devices cannot create duplicate active phone entries or assign one customer to two barbers.

---

## 9. Edge Cases

| # | Edge Case | Expected System Behaviour |
| :--- | :--- | :--- |
| 1 | **Duplicate Phone Join** | Customer tries to join with a phone number already in `WAITING`, `CALLED`, or `IN_CHAIR`. Backend rejects creation (`409`) and returns the existing entry; UI shows existing token (`S-14`) and links directly to `/status/:id`. |
| 2 | **Simultaneous `Call Next` Clicks** | Two tabs click `Call Next` at the exact same millisecond for two available barbers when only 1 customer is waiting. Server mutex/transaction assigns customer to the first request and returns `"No eligible waiting customers"` to the second — never double-assigns. |
| 3 | **Barber Goes `On Break` With Waiting Specific Customers** | Barber Ravi toggles `On Break`. Customers waiting specifically for Ravi are **NOT** silently reassigned to Amit/Imran. Their `/status/:id` page displays an amber notice that Ravi is on break. Ravi cannot receive `Call Next` calls while on break. |
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
| **TC-05** | **Multi-Device End-to-End Lifecycle & Sync (< 5s)** | Open 4 browser windows side-by-side: Customer `/status/:id`, Reception `/reception`, Barber `/barber/amit`, TV `/display`. | 1. Reception clicks `Call Next` for Amit.<br>2. Barber taps `START`.<br>3. Barber taps `DONE`. | 1. Within 5s: Customer shows full-screen gold `"It's Your Turn! Please proceed to Amit."`, TV highlights token in gold, Barber sees customer.<br>2. All screens update to `IN_CHAIR` with elapsed timer.<br>3. All screens update to `DONE`, Amit returns to `AVAILABLE`, Owner stats increment. | Pending |
| **TC-06** | **Second-in-Line Customer Notification** | 3 waiting customers (`S-01`, `S-02`, `S-03`) for `Any Barber`. | Open `S-02`'s `/status/:id` page. | Prominent alert displays: `"You're almost next! Start coming to the salon."` | Pending |
| **TC-07** | **No-Show & Rejoin at End of Queue** | `S-05` (`9876500005`) is `CALLED` for Ravi. `S-06` is `WAITING`. | On `/reception`, mark `S-05` as `No-show`. Then register `"9876500005"` again on `/join`. | `S-05` transitions to `NO_SHOW`, Ravi becomes `AVAILABLE`. Rejoining succeeds, assigns brand-new token `S-07`, and places customer **after** `S-06`. | Pending |
| **TC-08** | **Customer Self-Cancellation** | `S-06` is `WAITING`. | On `/status/:id`, click `Cancel My Spot` and confirm modal. | Status becomes `CANCELLED`; entry disappears from active Reception table & TV upcoming tokens; remaining customers' wait times decrease. | Pending |
| **TC-09** | **Barber On Break Handling** | Ravi is `AVAILABLE`; customer `S-08` is `WAITING` specifically for Ravi. | On `/barber/ravi`, toggle `On Break`. Check `/reception` and `S-08`'s `/status/:id`. | Ravi's `Call Next` is disabled on Reception; `S-08` is NOT reassigned to another barber and sees an amber "Ravi is on break" notice. | Pending |
| **TC-10** | **Queue Closing (30-Min Cutoff & Manual Close) vs Walk-ins** | Salon open. | In `/admin`, toggle Online Queue to Closed (or set close time to 20 mins from now). Visit `/`, `/join`, and `/reception`. | `/` disables `Join Queue` with clear explanation. `/join` rejects online submission. `/reception` `+ Add Walk-in` **still works** and adds walk-in customer. | Pending |
| **TC-11** | **Owner Service & Barber Management Sync** | Admin unlocked at `/admin`. | Deactivate `"Facial"` service; add new service `"Head Massage"` (EN/GU, 20m, ₹120); add new barber `"Dev"` (`On Duty`). Open `/join` & `/display`. | `"Facial"` disappears from `/join`; `"Head Massage"` appears with localized EN/GU names; `"Dev"` appears on `/`, `/join`, `/reception`, and `/display`. | Pending |
| **TC-12** | **English / Gujarati Language Switch & State Persistence** | Open `/join` and type name `"Meera"` + select 2 services. | Click `EN \| ગુજરાતી` toggle across `/`, `/join`, `/status/:id`, `/reception`, `/barber/:name`, `/display`, `/admin`. | All labels, buttons, statuses, validation errors, and service names switch cleanly to Gujarati and back without clearing typed form inputs or losing active screen state. | Pending |
