# TransitOps — Project Context

> This file captures the full context of the project and the decisions made in the build session, so anyone (teammate or a new AI session) can pick up exactly where things left off. Read this before touching the code.

---

## 1. What This Project Is

**TransitOps** — Smart Transport Operations Platform. Built for an 8-hour Odoo hackathon.

Digitizes vehicle, driver, dispatch, maintenance, and expense management for a logistics company, replacing spreadsheets/logbooks. Enforces business rules (no double-booking vehicles/drivers, cargo weight limits, fuel sufficiency, license validity) and provides operational analytics.

**Repo:** `https://github.com/vibhanshu000/tansist-ops` (not yet pushed as of this writing — still local-only in `E:\Hackathon`)

**Team:** 3 people — Yash, Ajay, Vibhu. Work divided into 3 vertical slices (see section 4).

---

## 2. Tech Stack (locked in, don't change without reason)

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn-style hand-built components + lucide-react icons + Recharts (charts) + Framer Motion (animations) + React Router
- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Database:** SQLite (file-based, zero setup — chosen deliberately so all 3 teammates can run it on any device without installing Postgres)
- **Auth:** JWT (jsonwebtoken) + bcryptjs for password hashing
- **PDF export:** pdfkit
- **Email (reminders):** nodemailer, with a safe console-log fallback if no SMTP is configured

Why SQLite instead of Postgres: hackathon speed — no DB server to install/configure across 3 different machines. `DATABASE_URL="file:./dev.db"` in `server/.env`.

---

## 3. Repository Structure

```
E:\Hackathon\
├── README.md                     — master guide, ownership map, git workflow summary
├── CONTEXT.md                     — this file
├── .gitignore
├── package.json                   — root workspace scripts (npm run dev runs both apps)
├── docs/
│   ├── TASKS.md                   — detailed per-person task checklist + business rules + DB schema
│   ├── DESIGN_SYSTEM.md           — theme tokens, colors, typography, spacing (everyone must follow)
│   ├── API_CONTRACT.md            — every endpoint documented, source of truth for frontend/backend contract
│   └── GIT_WORKFLOW.md            — branching model, commands, conflict-avoidance rules
├── client/                        — React frontend
│   └── src/
│       ├── components/
│       │   ├── layout/            — AppShell, Sidebar, Topbar, ThemeContext (Yash's area)
│       │   └── ui/                — shared components: Modal, StatusBadge, Toast, ConfirmDialog,
│       │                            Skeleton, SortableTh, AnimatedRow, AnimatedNumber, motion.ts presets
│       ├── features/
│       │   ├── auth/              — LoginPage, AuthContext, ProtectedRoute, RoleRoute, roleAccess.ts (Yash)
│       │   ├── vehicles/          — VehiclesPage (Yash)
│       │   ├── drivers/           — DriversPage, ExpiryReminderBanner (Yash)
│       │   ├── trips/             — TripsPage — the business-rule engine UI (Ajay)
│       │   ├── maintenance/       — MaintenancePage (Ajay)
│       │   ├── dashboard/         — DashboardPage with KPIs + charts (Vibhu)
│       │   ├── fuel-expense/      — FuelExpensePage (Vibhu)
│       │   ├── reports/           — ReportsPage with charts + CSV/PDF export (Vibhu)
│       │   └── documents/         — DocumentsPage — vehicle document mgmt, bonus feature (Vibhu)
│       ├── lib/                   — api.ts (axios client), types.ts, format.ts, statusColors.ts, useSort.ts
│       ├── styles/globals.css     — design tokens as CSS vars, component classes (.card, .btn-primary, etc.)
│       ├── App.tsx                — all routes, wrapped in Theme/Toast/Confirm/Auth providers
│       └── main.tsx
└── server/                        — Express backend
    └── src/
        ├── modules/
        │   ├── auth/               — register, login, me (Yash)
        │   ├── vehicles/           — CRUD + /available endpoint (Yash)
        │   ├── drivers/            — CRUD + /available endpoint (Yash)
        │   ├── trips/              — create/dispatch/complete/cancel + ALL business rule validation (Ajay)
        │   ├── maintenance/        — create/close, auto vehicle status flip (Ajay)
        │   ├── dashboard/          — KPI aggregation (Vibhu)
        │   ├── fuel-expense/       — fuel logs (tops up tank) + expenses (Vibhu)
        │   ├── reports/            — per-vehicle metrics, CSV export, PDF export (Vibhu)
        │   ├── documents/          — vehicle document CRUD, bonus feature (Vibhu)
        │   └── reminders/          — expiring license detection + email/console reminder (Vibhu)
        ├── middleware/             — authenticate.ts (JWT verify), requireRole.ts (RBAC), errorHandler.ts
        ├── prisma/
        │   ├── schema.prisma       — all 8+ entities (Yash owns, shared file — coordinate before editing)
        │   └── seed.ts             — demo data: Van-05, Alex, 4 role-based demo users, sample vehicles/drivers
        ├── app.ts                  — mounts all routers, applies authenticate middleware
        └── index.ts                — server entry point
```

---

## 4. Team Task Division

| Person | Owns | Modules (spec section) |
|---|---|---|
| **Yash** | Foundation, Auth+RBAC, Vehicle Registry, Driver Management, shared layout/theme, Prisma schema | 3.1, 3.3, 3.4 |
| **Ajay** | Trip Management, Maintenance — the business-rule engine (dispatch/complete/cancel transitions) | 3.5, 3.6 |
| **Vibhu** | Dashboard, Fuel & Expense, Reports & Analytics, integration/QA, bonus features (documents, reminders, PDF) | 3.2, 3.7, 3.8 |

Git workflow: `main` (protected, demo-ready) ← `develop` (integration) ← `feat/<name>-<area>` branches. Full detail in `docs/GIT_WORKFLOW.md`. **Repo has not been pushed to GitHub yet** — this is still a pending action item.

---

## 5. Database Entities (Prisma schema, SQLite)

```
Role          — FleetManager | Driver | SafetyOfficer | FinancialAnalyst
User          — name, email(unique), passwordHash, roleId
Vehicle       — regNumber(unique), name, type, maxLoadKg, odometer, acquisitionCost,
                region, status(Available|OnTrip|InShop|Retired),
                fuelLevel, fuelCapacity, fuelEfficiencyKmpl   <- added later for fuel rule
Driver        — name, licenseNumber(unique), licenseCategory, licenseExpiry, contact,
                safetyScore, status(Available|OnTrip|OffDuty|Suspended)
Trip          — source, destination, vehicleId, driverId, cargoWeight, plannedDistance,
                finalOdometer?, fuelConsumed?, revenue?, status(Draft|Dispatched|Completed|Cancelled)
Maintenance   — vehicleId, type, cost, date, notes, isActive
FuelLog       — vehicleId, liters, cost, date  (posting this tops up the vehicle's fuelLevel)
Expense       — vehicleId, type(toll|maintenance|other), amount, date
VehicleDocument — vehicleId, name, docType(Registration|Insurance|Permit|Other), expiryDate?, notes
```

`revenue` (on Trip) and `region` (on Vehicle) were added beyond the literal spec text because the ROI formula and dashboard region-filter requirements need them — documented as intentional inferences, not spec violations.

---

## 6. Mandatory Business Rules — ALL IMPLEMENTED AND TESTED

1. Vehicle registration number must be unique
2. Retired / In Shop vehicles never appear in dispatch selection (`/vehicles/available` only returns Available)
3. Drivers with expired license or Suspended status cannot be assigned (`/drivers/available` filters both)
4. Vehicle/driver already On Trip cannot be assigned to another trip
5. Cargo weight must not exceed vehicle max load capacity
6. Dispatch → vehicle + driver both become On Trip (atomic Prisma transaction)
7. Complete → vehicle + driver both back to Available; vehicle odometer updated
8. Cancel dispatched trip → restore vehicle + driver to Available
9. Create active maintenance record → vehicle becomes In Shop
10. Close maintenance → vehicle back to Available (unless Retired)
11. **(added later)** Vehicle must have enough fuel in tank for the trip's planned distance — checked at both trip creation AND dispatch (fuel level can change between draft and dispatch). Formula: `requiredFuel = plannedDistance / fuelEfficiencyKmpl`. Rejected with a specific error message showing exact shortfall. Completing a trip deducts actual `fuelConsumed` from the tank. Posting a fuel log tops up the tank (capped at `fuelCapacity`).

All rules are enforced **server-side** in `trips.routes.ts` / `maintenance.routes.ts` (never trust client-only checks) with client-side pre-validation in `TripsPage.tsx` for instant UX feedback (disables Create button, shows inline error before hitting the API).

Verified via automated end-to-end test scripts run during the session (created temporarily, then deleted after passing — not part of the permanent codebase):
- Original workflow test: 22/22 checks passed
- RBAC + bonus features test: 18/18 checks passed
- Fuel rule test: 8/8 checks passed

---

## 7. RBAC — Enforced on Backend (not just hidden UI)

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

Implemented via `requireRole(...roles)` middleware applied per-route. Frontend also has a `RoleRoute` wrapper so typing a URL directly (e.g. `/vehicles` as a Driver) redirects home — this is in addition to hiding sidebar links, closing the "URL bypass" gap that existed earlier in the build.

---

## 8. Design System (locked — "$3000 website" look)

Full spec in `docs/DESIGN_SYSTEM.md`. Key tokens:

- **Primary:** `#4F46E5` (indigo-600), hover `#4338CA`
- **Neutrals:** slate scale (`--bg`, `--surface`, `--border`, `--text-primary`, `--text-secondary`) as CSS vars, dark-mode variants included
- **Status colors:** success=green, warning=amber, info=blue, danger=red, neutral=gray — mapped consistently for every status string across Vehicle/Driver/Trip/License via `lib/statusColors.ts`
- **Font:** Inter
- **Shape:** 12px card radius, 8px button radius, 6px badge radius, subtle shadow
- **Layout:** fixed 240px sidebar + topbar + max-width 1280px content area
- **Currency:** ₹ (Indian Rupees), via `formatCurrency()` in `lib/format.ts` — changed from $ per explicit request. PDF export uses "Rs." since pdfkit's default font lacks the ₹ glyph.
- **Animations (added per explicit request):** Framer Motion throughout — page transitions, staggered card/row entrances, animated KPI counters (`AnimatedNumber`), animated modals/toasts/confirm dialogs with backdrop blur, sidebar active-tab sliding indicator, button hover/tap micro-interactions, login page ambient gradient blobs. Shared presets in `components/ui/motion.ts`. Reusable `AnimatedRow` wraps table rows across all list pages for consistency.

Rule communicated to the team: nobody invents new colors/fonts/spacing outside these tokens.

---

## 9. Feature Completion Status

### Mandatory deliverables — ALL DONE
- Responsive web interface
- Authentication with RBAC
- CRUD for Vehicles and Drivers
- Trip Management with validations
- Automatic status transitions
- Maintenance workflow
- Fuel & Expense tracking
- Dashboard with KPIs

### Bonus features — ALL DONE
- Charts and visual analytics (Recharts: pie, bar, line on Dashboard + Reports)
- CSV export (`/reports/export.csv`)
- PDF export (`/reports/export.pdf` via pdfkit, styled with brand colors)
- Email reminders for expiring licenses (`/reminders/*`, simulated via console log if no SMTP configured, real email via nodemailer if `SMTP_HOST` etc. set in `.env`)
- Vehicle document management (`/documents` module + `DocumentsPage`)
- Search, filters, sorting (search+filter on Vehicles/Drivers/Trips; column sort via `useSort` hook)
- Dark mode (toggle in Topbar, persisted to localStorage, full CSS var theming)

### UX polish — DONE
- Themed toast notifications replace `alert()`
- Themed confirm dialog replaces `confirm()`
- Loading skeletons on all list/chart pages
- Premium animations (see section 8)

---

## 10. Key Decisions / Corrections Made During This Session (chronological)

1. **Initial ask:** guide a 3-person hackathon team, divide tasks. → Produced role-based task division (Yash/Ajay/Vibhu), tech stack recommendation, timeline.
2. **Follow-up:** re-divide tasks in more detail + lock a design theme so all 3 people's UI matches, referencing their GitHub repo `vibhanshu000/tansist-ops`. → Produced the indigo/slate "SaaS dashboard" theme and detailed per-person checklists.
3. **Folder structure request:** wanted clarity on which folder belongs to whom, a README for cross-device/cross-IDE-agent onboarding, and a decision on git branching strategy. → Scaffolded the full repo structure with `OWNER_<name>.md` marker files in every feature/module folder, wrote `README.md`, `docs/TASKS.md`, `docs/DESIGN_SYSTEM.md`, `docs/API_CONTRACT.md`, `docs/GIT_WORKFLOW.md`. Recommended branching: never work on `main`, use `develop` + per-person `feat/*` branches merged via PR.
4. **"Start building the website"** → Actually scaffolded and implemented the full working app: Prisma schema (8 entities), Express modules for every feature, React frontend with all pages, ran it locally (client on :5173, server on :4000), wrote and ran an automated end-to-end test of the full Example Workflow from the spec — 22/22 checks passed. Chose SQLite over Postgres specifically for zero-setup portability across 3 devices.
5. **"What's left in this project?"** → Audited actual code (not assumptions) and found two real gaps: RBAC existed as middleware but was never applied to routes (any authenticated user could do anything), and native `alert()`/`confirm()` were used instead of themed UI. Also listed unimplemented bonus features.
6. **"Complete all the features"** → Fixed RBAC enforcement (added `requireRole` to every write route per the table in section 7), replaced native dialogs with `ToastContext`/`ConfirmDialog`, added loading skeletons, added column sorting, and implemented ALL remaining bonus features (vehicle documents, email reminders, PDF export). Re-verified with an 18/18 automated test covering RBAC denial/allow per role and every bonus feature.
7. **Correction request: fuel validation on trip creation** → Added `fuelLevel`/`fuelCapacity`/`fuelEfficiencyKmpl` to Vehicle model, added business rule 11 (section 6), wired fuel deduction on trip completion and fuel top-up on fuel-log creation, added inline UI validation with clear error messages in the Trip creation modal. Verified with an 8/8 automated test including the exact error message content.
8. **"Make cost in Rupees" + "make UI feel like a $3000 premium website"** → Changed `formatCurrency` to ₹/en-IN formatting, fixed a hardcoded `$` in the PDF export. Added Framer Motion across the entire app (see section 8) — page transitions, staggered entrances, animated counters, animated modals/toasts, sidebar active indicator, login page ambient background, button micro-interactions. Both apps rebuilt clean with zero type errors after each change.
9. **"What security features can we add?"** → Audited actual auth code and found real, specific gaps (not generic advice): `/auth/register` is public and lets anyone self-assign any role including FleetManager (most serious finding), weak 4-char password minimum, no rate limiting on login/register, no `helmet` security headers, hardcoded JWT secret placeholder, no request body size limit, no audit trail, JWT can't be revoked. Gave a prioritized fix list.
10. **Follow-up clarifying intent:** user wants to confirm the *pattern* — should new users self-register, or should a manager provision accounts/credentials for a specific role? → Recommended **manager-provisioned accounts** (no public self-registration) since this is an internal ops tool: remove public `/auth/register`, add a FleetManager-only `POST /users` endpoint that creates accounts with a temp password shown once, add a "Manage Users" page (FleetManager-only) to create/list/deactivate accounts, optionally add a `mustChangePassword` first-login flow. **This has been proposed but not yet implemented** — see section 11.
11. **This request:** create this CONTEXT.md file.

---

## 11. Pending / Not Yet Done (action items for next session)

These were discussed/recommended but **not yet implemented in code**:

1. **User provisioning overhaul (agreed direction, not yet built):**
   - Remove public `POST /auth/register` (currently anyone can call it and self-assign `role: "FleetManager"` — this is the most serious open security issue)
   - Add `POST /users` — FleetManager-only, creates an account with a temp password (shown once in the response) or manager-set password
   - Add `GET /users` — FleetManager-only, list all accounts
   - Add deactivate/delete capability for accounts
   - Add a "Manage Users" / "Team" page in the frontend (FleetManager-only nav item), styled consistently, with a create-user modal
   - Optional: `mustChangePassword` flag forcing a password reset screen on first login
   - Optional (more realistic but more work): email-based "set your password" link instead of showing temp password to the manager directly

2. **Other security hardening recommended but not implemented:**
   - Rate limiting on `/auth/*` (e.g. `express-rate-limit`)
   - `helmet` middleware for security headers
   - Raise password minimum from 4 to 8+ characters
   - Request body size limit on `express.json()`
   - Basic audit log (who dispatched a trip, who deleted a vehicle, etc.)
   - JWT revocation strategy (currently stateless, no logout invalidation — tokens remain valid until natural 1-day expiry)
   - Rotate the placeholder JWT secret in `server/.env` before any real deployment

3. **Process/logistics (not code):**
   - Push repository to GitHub (`https://github.com/vibhanshu000/tansist-ops`) — has not been done yet, still local-only in `E:\Hackathon`
   - Set up `main`/`develop` branch protection on GitHub per `docs/GIT_WORKFLOW.md`
   - Each teammate clone + run locally to confirm on their own device
   - Full demo rehearsal with all three people following the Example Workflow from the spec

4. **Minor/optional:**
   - JS bundle is ~840KB (gzip ~244KB) after adding Framer Motion + more UI — fine for a hackathon demo; code-splitting by route would help if this becomes a real product later.

---

## 12. How to Run This Project (current working setup)

```bash
# Backend
cd server
npm install
copy .env.example .env      # or cp on non-Windows; .env already exists locally with dev values
npm run db:push             # creates/updates SQLite tables from schema.prisma
npm run db:seed             # loads demo data (Van-05, Alex, 4 role-based users, sample vehicles/drivers)
npm run dev                 # http://localhost:4000

# Frontend (separate terminal)
cd client
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :4000)
```

**Demo logins (password: `password` for all):**
| Email | Role |
|---|---|
| fleet@transitops.com | Fleet Manager |
| driver@transitops.com | Driver |
| safety@transitops.com | Safety Officer |
| finance@transitops.com | Financial Analyst |

**Demo workflow to rehearse** (matches the spec's Example Workflow section):
Register/seed has Van-05 (500kg capacity, 40L fuel @ 10km/L) and driver Alex (valid license) → create a trip with 450kg cargo and a distance within fuel range → dispatch (both go On Trip) → complete (enter final odometer + fuel consumed) → both return to Available → create a maintenance record (vehicle → In Shop, hidden from dispatch) → check Reports page for updated fuel efficiency/cost/ROI.

---

## 13. Source-of-Truth Docs (read these for detail, this file is the summary)

- `README.md` — quick start, folder ownership map, current status
- `docs/TASKS.md` — full per-person checklist, all business rules with owners, DB entity list
- `docs/DESIGN_SYSTEM.md` — exact color/font/spacing tokens
- `docs/API_CONTRACT.md` — every endpoint, request/response shape, RBAC table
- `docs/GIT_WORKFLOW.md` — branching model and exact git commands
