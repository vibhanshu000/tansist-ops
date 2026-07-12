# ✅ TransitOps — Detailed Task Breakdown

Each person owns a full vertical slice (backend module + frontend feature). Work only in your folders. Check off tasks as you go.

Legend: 🟦 Yash · 🟧 Ajay · 🟪 Vibhu

> **Status: all mandatory deliverables + all bonus features are implemented and verified.**
> 18/18 automated checks pass (business rules, RBAC enforcement, documents, reminders, PDF/CSV export).
> Remaining work is polish, code review, and the live demo rehearsal — see the bottom of this file.

---

## 🟦 YASH — Foundation + Vehicle Registry + Driver Management

### Phase 0 — Foundation (Hour 0–1.5) — TEAM IS BLOCKED UNTIL THIS IS DONE
- [ ] Scaffold `client/` (Vite + React + TS) and `server/` (Express + TS + Prisma)
- [ ] Install & configure **Tailwind + shadcn/ui**, paste all tokens from `DESIGN_SYSTEM.md` into `tailwind.config.js`
- [ ] Import **Inter** font in `client/index.html`
- [ ] Build shared **AppShell**: `Sidebar` (logo + role-based nav + user) and `Topbar` (page title + search + user menu) in `client/src/components/layout/`
- [ ] Set up routing in `App.tsx` with a placeholder route per feature (others fill theirs in)
- [ ] Prisma **schema for all 8 entities** (see below) → `npm run db:push`
- [ ] **Seed script**: Van-05 (500kg, Available), driver Alex (valid license), + 6 vehicles / 4 drivers, 4 role rows, 1 user per role
- [ ] Write & commit **`docs/API_CONTRACT.md`** so Ajay & Vibhu can integrate
- [ ] Merge `feat/yash-foundation` → `develop` and announce in chat

### 3.1 Authentication + RBAC
- [ ] `POST /auth/register`, `POST /auth/login` (email + password, bcrypt hash, JWT)
- [ ] Auth middleware (verify JWT) + RBAC middleware (check role)
- [ ] 4 roles: **Fleet Manager, Driver, Safety Officer, Financial Analyst**
- [ ] Frontend: login page, auth context, protected routes, **hide sidebar links by role**
- [ ] Only authenticated users reach the app

### 3.3 Vehicle Registry
- [ ] Table: Reg Number · Name/Model · Type · Max Load (kg) · Odometer · Acquisition Cost · Status badge
- [ ] Add/Edit modal form
- [ ] **Reg Number UNIQUE** (DB constraint + friendly error) ← business rule
- [ ] Status enum: Available / On Trip / In Shop / Retired
- [ ] Search (reg/name) + filter (type, status)

### 3.4 Driver Management
- [ ] Table: Name · License No · License Category · License Expiry · Contact · Safety Score · Status badge
- [ ] Add/Edit modal form
- [ ] **Highlight expired licenses in red** (feeds Ajay's trip validation)
- [ ] Status enum: Available / On Trip / Off Duty / Suspended

**Done when:** login-by-role works, sidebar filters by role, vehicles + drivers CRUD works with unique-reg enforced.

---

## 🟧 AJAY — Trip Management + Maintenance (business-rule engine)

> Wait for Yash's `develop` merge (schema + vehicle/driver APIs) before starting UI. You can read `API_CONTRACT.md` and start server logic earlier.

### 3.5 Trip Management
- [ ] Create Trip form: source · destination · vehicle · driver · cargo weight · planned distance
- [ ] Vehicle dropdown shows **only Available** vehicles (never Retired / In Shop / On Trip)
- [ ] Driver dropdown shows **only Available drivers with valid (non-expired) license, not Suspended**
- [ ] **Cargo weight ≤ vehicle max load** — block + clear error
- [ ] Trip list/table + filter by status
- [ ] Lifecycle badges: Draft → Dispatched → Completed → Cancelled

### Status Transitions (HIGHEST-SCORING PART)
- [ ] **Dispatch** → vehicle + driver both → On Trip (vanish from dropdowns)
- [ ] **Complete** → modal for final odometer + fuel consumed → vehicle + driver → Available, update vehicle odometer
- [ ] **Cancel** dispatched trip → restore vehicle + driver to Available

### 3.6 Maintenance
- [ ] Create maintenance record: vehicle · type (e.g. Oil Change) · cost · date · notes
- [ ] **On create (active) → vehicle → In Shop** (auto-hidden from dispatch)
- [ ] **Close maintenance → vehicle → Available** (unless Retired)

**Done when:** Example Workflow Steps 3–8 run live with zero manual DB edits. Rehearse the demo — you own its climax.

---

## 🟪 VIBHU — Dashboard + Fuel/Expense + Reports + Integration

> Heavy analytics need real data, so build UI shells early, wire to live data after Ajay's trips work.

### 3.2 Dashboard
- [ ] KPI cards (big bold numbers): Active Vehicles · Available Vehicles · In Maintenance · Active Trips · Pending Trips · Drivers On Duty · **Fleet Utilization %**
- [ ] Fleet Utilization % = (vehicles On Trip / total non-retired) × 100
- [ ] Filters: vehicle type · status · region

### 3.7 Fuel & Expense
- [ ] Fuel log form: vehicle · liters · cost · date
- [ ] Expense form: vehicle · type (toll / maintenance / other) · amount · date
- [ ] **Auto-compute operational cost = Fuel + Maintenance per vehicle**

### 3.8 Reports & Analytics
- [ ] **Fuel Efficiency** = Distance / Fuel
- [ ] **Fleet Utilization** chart
- [ ] **Operational Cost** breakdown
- [ ] **Vehicle ROI** = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
- [ ] Charts (Recharts): bar (cost), line (efficiency), donut (fleet status)
- [ ] **CSV export** (easy points — don't skip)

### Integration + Polish (your superpower)
- [ ] Run full workflow end-to-end every ~2h, file bugs to Yash/Ajay
- [ ] Bonus order: charts → dark mode → search/sort → PDF export

**Done when:** dashboard shows live numbers that change when Ajay dispatches a trip, 3+ charts render, CSV export works.

---

## <a name="business-rules"></a>🔒 The Mandatory Business Rules (owner in brackets)

1. Vehicle registration number must be unique. **[Yash]**
2. Retired / In Shop vehicles never appear in dispatch selection. **[Ajay]**
3. Drivers with expired license or Suspended status cannot be assigned. **[Ajay]**
4. Vehicle/driver already On Trip cannot be assigned to another trip. **[Ajay]**
5. Cargo weight must not exceed vehicle max load capacity. **[Ajay]**
6. Dispatch → vehicle + driver both become On Trip. **[Ajay]**
7. Complete → vehicle + driver both back to Available. **[Ajay]**
8. Cancel dispatched trip → restore vehicle + driver to Available. **[Ajay]**
9. Create active maintenance → vehicle becomes In Shop. **[Ajay]**
10. Close maintenance → vehicle back to Available (unless Retired). **[Ajay]**
11. **(added)** Vehicle must have enough fuel in its tank for the trip's planned distance — checked at both trip creation and dispatch. **[Ajay]**

### Rule 11 detail — fuel sufficiency check
- Each vehicle now has `fuelLevel` (current liters in tank), `fuelCapacity` (tank size), `fuelEfficiencyKmpl` (km per liter).
- Required fuel for a trip = `plannedDistance / fuelEfficiencyKmpl`.
- If `vehicle.fuelLevel < requiredFuel`, the trip is rejected with a message like:
  `"Vehicle Van-05 has insufficient fuel: 40.0L in tank, but this trip needs about 50.0L (10 km/L over 500km). Refuel the vehicle or choose another one."`
- Checked again at dispatch (tank level may have changed since draft).
- Completing a trip deducts `fuelConsumed` from the tank (floored at 0).
- Adding a fuel log (`POST /fuel`) tops up the tank, capped at `fuelCapacity` — this is how a vehicle gets "refueled" in the UI.
- Frontend (`TripsPage`) shows the vehicle's tank level/efficiency in the dropdown, warns inline under Planned Distance if insufficient, and disables the Create button until fixed. Server re-validates regardless (never trust client-only checks).

> Rules 2–10 mostly live in Ajay's slice. Yash exposes clean status fields; Vibhu reflects them in KPIs. Ajay: these are the winning points — make them bulletproof.

---

## 🔐 RBAC — now enforced on the backend (not just hidden nav links)

| Endpoint group | Allowed roles |
|---|---|
| Vehicles create/update/delete | FleetManager |
| Drivers create/update/delete | FleetManager, SafetyOfficer |
| Trips create/dispatch/complete/cancel | FleetManager, Driver |
| Maintenance create/close | FleetManager |
| Fuel & Expense create | FleetManager, FinancialAnalyst |
| Vehicle Documents create/delete | FleetManager, SafetyOfficer |
| Reminders send | FleetManager, SafetyOfficer |
| All GET endpoints | any authenticated user |

Frontend also has a `RoleRoute` guard so typing a URL directly (e.g. `/vehicles` as a Driver) redirects home — not just hidden sidebar links.

## 🎁 Bonus Features — all implemented

- **Charts and visual analytics** — Dashboard (pie + bar) and Reports (line + bar) via Recharts
- **CSV export** — `/reports/export.csv`
- **PDF export** — `/reports/export.pdf` via pdfkit, styled with brand colors
- **Email reminders for expiring licenses** — `/reminders/expiring-licenses` + `/reminders/send`. Falls back to a console log if no SMTP env vars are set (safe for demo), sends real email via nodemailer if `SMTP_HOST` etc. are configured in `server/.env`
- **Vehicle document management** — new `/documents` module + `DocumentsPage` (Registration, Insurance, Permit, Other; expiry tracking)
- **Search, filters, sorting** — search + status filter on Vehicles/Drivers/Trips; column sorting via `useSort` hook on Vehicles/Drivers tables
- **Dark mode** — toggle in Topbar, persisted to localStorage

## 🧹 UX polish — done

- Themed toast notifications replace `alert()` (see `ToastContext`)
- Themed confirm dialog replaces `confirm()` (see `ConfirmDialog`)
- Loading skeletons on all list/chart pages instead of blank screens

## 🔲 What's genuinely left (process, not code)

- [ ] Push to GitHub, set up `main`/`develop` branches (see `GIT_WORKFLOW.md`)
- [ ] Each teammate clones + runs locally to confirm on their own device
- [ ] Full demo rehearsal with all three people
- [ ] Optional: configure real SMTP creds in `.env` if you want reminders to send actual emails (not required — simulated mode works fine for judging)

---

## 🗄️ Database Entities (Yash builds in `schema.prisma`; everyone references)

```
User        id · name · email(unique) · passwordHash · roleId
Role        id · name  (Fleet Manager | Driver | Safety Officer | Financial Analyst)
Vehicle     id · regNumber(unique) · name · type · maxLoadKg · odometer ·
            acquisitionCost · region · status(Available|OnTrip|InShop|Retired)
Driver      id · name · licenseNumber · licenseCategory · licenseExpiry ·
            contact · safetyScore · status(Available|OnTrip|OffDuty|Suspended)
Trip        id · source · destination · vehicleId · driverId · cargoWeight ·
            plannedDistance · finalOdometer? · fuelConsumed? · revenue? ·
            status(Draft|Dispatched|Completed|Cancelled) · createdAt
Maintenance id · vehicleId · type · cost · date · notes · isActive
FuelLog     id · vehicleId · liters · cost · date
Expense     id · vehicleId · type(toll|maintenance|other) · amount · date
```
