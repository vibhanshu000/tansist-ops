# 🚚 TransitOps — Smart Transport Operations Platform

> 8-hour hackathon build. Team of 3. Monorepo: React (client) + Node/Express (server) + Prisma/PostgreSQL.
> Repo: https://github.com/vibhanshu000/tansist-ops

**READ THIS FIRST if you are a teammate or an IDE agent (Kiro / Cursor / Copilot).**
This file tells you exactly what to build, where to put it, and how to avoid stepping on each other.

---

## 👥 Who Owns What

| Person | Role | Owns (client + server) | Modules |
|--------|------|------------------------|---------|
| **Yash** | Foundation & Registry | `auth`, `vehicles`, `drivers` + shared layout + DB schema | 3.1, 3.3, 3.4 |
| **Ajay** | Dispatch Engine | `trips`, `maintenance` + status transitions | 3.5, 3.6 |
| **Vibhu** | Insights & Integration | `dashboard`, `fuel-expense`, `reports` + polish | 3.2, 3.7, 3.8 |

Full task detail: **[docs/TASKS.md](docs/TASKS.md)**

---

## 📁 Folder Structure (and who touches which folder)

```
tansist-ops/
├── README.md                     ← you are here (master guide)
├── docs/
│   ├── TASKS.md                  ← detailed per-person checklist
│   ├── DESIGN_SYSTEM.md          ← theme tokens — EVERYONE follows this
│   ├── API_CONTRACT.md           ← endpoint contract — Yash writes, all read
│   └── GIT_WORKFLOW.md           ← branching + merge rules
│
├── client/                       ← FRONTEND (React + Vite + Tailwind + shadcn/ui)
│   └── src/
│       ├── components/
│       │   ├── layout/           ← 🟦 YASH  (Sidebar, Topbar, AppShell)
│       │   └── ui/               ← 🟩 SHARED (shadcn components — nobody edits, only adds)
│       ├── features/
│       │   ├── auth/             ← 🟦 YASH
│       │   ├── vehicles/         ← 🟦 YASH
│       │   ├── drivers/          ← 🟦 YASH
│       │   ├── trips/            ← 🟧 AJAY
│       │   ├── maintenance/      ← 🟧 AJAY
│       │   ├── dashboard/        ← 🟪 VIBHU
│       │   ├── fuel-expense/     ← 🟪 VIBHU
│       │   └── reports/          ← 🟪 VIBHU
│       ├── lib/                  ← 🟩 SHARED (api client, hooks, utils)
│       ├── styles/               ← 🟦 YASH sets up, then frozen
│       ├── App.tsx               ← 🟦 YASH owns routing (others add their route)
│       └── main.tsx
│
├── server/                       ← BACKEND (Node + Express + Prisma)
│   └── src/
│       ├── modules/
│       │   ├── auth/             ← 🟦 YASH
│       │   ├── vehicles/         ← 🟦 YASH
│       │   ├── drivers/          ← 🟦 YASH
│       │   ├── trips/            ← 🟧 AJAY
│       │   ├── maintenance/      ← 🟧 AJAY
│       │   ├── dashboard/        ← 🟪 VIBHU
│       │   ├── fuel-expense/     ← 🟪 VIBHU
│       │   └── reports/          ← 🟪 VIBHU
│       ├── middleware/           ← 🟦 YASH (auth, rbac, error handler)
│       ├── prisma/
│       │   ├── schema.prisma     ← 🟦 YASH owns (all 8 entities)
│       │   └── seed.ts           ← 🟦 YASH (Van-05, Alex + sample data)
│       ├── app.ts                ← 🟦 YASH (mounts all module routes)
│       └── index.ts
│
└── package.json (root)           ← workspace scripts
```

**Rule:** Each `features/<area>` and `modules/<area>` folder belongs to ONE person. If you need something in someone else's folder, ask them or open the API contract — don't edit their files.

---

## 🎨 Theme (non-negotiable — makes it look like a $3000 product)

Primary `#4F46E5` (indigo) · Slate neutrals · **Inter** font · 12px card radius · status = colored pills · shadcn/ui components · generous whitespace.

**Nobody invents new colors, fonts, or spacing.** Everything is defined in [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) and wired into `tailwind.config.js`. Use the tokens, not raw values.

---

## 🌿 Branching (short answer: NEVER work on main)

Each person works on their **own long-lived branch**, opens PRs into `develop`. `main` stays demo-ready.

```
main         ← always working & demo-ready (protected, no direct pushes)
 └── develop ← integration branch (everyone merges here via PR)
      ├── feat/yash-foundation
      ├── feat/ajay-trips
      └── feat/vibhu-dashboard
```

Full rules + commands: **[docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)**

---

## ✅ Current Status — foundation is BUILT and working

The full stack is scaffolded and verified end-to-end (22/22 business-rule checks pass). Stack:
**React + Vite + TS + Tailwind (client)** · **Express + Prisma + SQLite (server)**. SQLite means zero DB install — it just works on any device.

All 8 modules have working backend + frontend. Teammates now extend/polish their slices.

## 🚀 Getting Started (every device, same steps)

```bash
# 1. Clone
git clone https://github.com/vibhanshu000/tansist-ops.git
cd tansist-ops

# 2. Get on develop, then make your branch
git checkout develop
git pull
git checkout -b feat/<yourname>-<area>      # e.g. feat/ajay-trips

# 3. Install deps (run in BOTH folders)
cd server && npm install
cd ../client && npm install

# 4. Backend: env + database (from the server/ folder)
cd ../server
copy .env.example .env      # Windows (or: cp .env.example .env)
npm run db:push             # create SQLite tables
npm run db:seed             # load Van-05, Alex + sample data

# 5. Run — TWO terminals
#   terminal 1:
cd server && npm run dev    # API on http://localhost:4000
#   terminal 2:
cd client && npm run dev    # UI on http://localhost:5173
```

Open http://localhost:5173 and log in with any demo account (password: `password`):

| Email | Role |
|-------|------|
| fleet@transitops.com | Fleet Manager (sees everything) |
| driver@transitops.com | Driver (Dashboard + Trips) |
| safety@transitops.com | Safety Officer (Vehicles, Drivers) |
| finance@transitops.com | Financial Analyst (Fuel, Reports) |

> Note: `.env` and `dev.db` are gitignored. Each teammate creates their own local DB with the seed command — everyone gets the same starting data.

---

## ✅ Definition of Done (the demo must pass this)

The full **Example Workflow** must run live with zero manual DB edits:
1. Register Van-05 (500kg, Available) → 2. Register Alex (valid license) → 3. Create trip (450kg) → 4. System validates 450 ≤ 500 → 5. Dispatch → both On Trip → 6. Complete (odometer + fuel) → 7. both Available → 8. Add maintenance → vehicle In Shop, hidden from dispatch → 9. Reports update cost + fuel efficiency.

See the 10 mandatory business rules in [docs/TASKS.md](docs/TASKS.md#business-rules).

---

## 📞 Communication Rule

- Post your PR link in the group chat when you merge to `develop`.
- If you change the API contract, update [docs/API_CONTRACT.md](docs/API_CONTRACT.md) **and** tell the group.
- Integrate every ~2 hours. Vibhu runs the full flow and files bugs.
