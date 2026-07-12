# 🎨 TransitOps Design System

**Everyone follows this. Nobody invents new colors, fonts, or spacing.**
This single rule is what makes the app look like one designer built it — a "$3000 product" instead of 3 developers' work glued together.

Direction: modern SaaS ops dashboard (Linear / Vercel / Stripe vibe). Clean, precise, trustworthy.

---

## 1. Color Tokens

Put these in `client/tailwind.config.js` and `client/src/styles/globals.css` as CSS variables.

```
BRAND / PRIMARY
--primary:        #4F46E5   indigo-600   buttons, active nav, links
--primary-hover:  #4338CA   indigo-700
--primary-light:  #EEF2FF   indigo-50    subtle bg, badge bg

NEUTRALS (the backbone — use constantly)
--bg:             #F8FAFC   slate-50     app background
--surface:        #FFFFFF                cards, tables, panels
--border:         #E2E8F0   slate-200    all borders/dividers
--text-primary:   #0F172A   slate-900    headings, key numbers
--text-secondary: #64748B   slate-500    labels, meta text

STATUS (reuse EVERYWHERE for vehicle/driver/trip status pills)
--success:  #16A34A  green   Available, Completed
--warning:  #D97706  amber   In Shop, Pending, Draft
--info:     #2563EB  blue    On Trip, Dispatched
--danger:   #DC2626  red     Retired, Suspended, Cancelled, Expired
--neutral:  #64748B  gray    Off Duty
```

### Dark mode (bonus — same tokens inverted)
```
--bg: #0F172A   --surface: #1E293B   --border: #334155
--text-primary: #F1F5F9   --text-secondary: #94A3B8
(primary stays indigo; status colors stay, slightly brighter)
```

---

## 2. Status → Color Map (COPY THIS, don't guess)

| Entity | Status | Color token |
|--------|--------|-------------|
| Vehicle | Available | success (green) |
| Vehicle | On Trip | info (blue) |
| Vehicle | In Shop | warning (amber) |
| Vehicle | Retired | danger (red) |
| Driver | Available | success |
| Driver | On Trip | info |
| Driver | Off Duty | neutral (gray) |
| Driver | Suspended | danger |
| Trip | Draft | warning |
| Trip | Dispatched | info |
| Trip | Completed | success |
| Trip | Cancelled | danger |
| License | Expired | danger |

---

## 3. Typography

Font: **Inter** (Google Fonts). Import once in `index.html`.

| Use | Size | Weight |
|-----|------|--------|
| Page title (h1) | 24px | 700 |
| Section title (h2) | 18px | 600 |
| KPI number | 30px | 700 |
| Body / table | 14px | 400 |
| Label / meta | 12px | 500, uppercase, letter-spacing 0.05em, text-secondary |

---

## 4. Spacing & Shape (the "expensive" feel lives here)

```
Border radius:   cards/inputs 12px · buttons 8px · status badge 6px (pill)
Card padding:    24px
Gap between cards: 16px
Page max-width:  1280px, centered, 24px side padding
Card shadow:     0 1px 3px rgba(0,0,0,0.08)   (subtle, never heavy)
Sidebar width:   240px fixed
Table row height: 52px
```

---

## 5. Layout Pattern (every page uses this — Yash builds the shell)

```
┌─────────┬────────────────────────────────────────┐
│         │  Topbar: page title · search · user/role │
│ Sidebar ├────────────────────────────────────────┤
│ logo    │                                          │
│ nav     │   KPI cards row (dashboard only)         │
│ (by     │   Filters bar                            │
│  role)  │   Data table  OR  form                   │
│ user    │                                          │
└─────────┴────────────────────────────────────────┘
```

---

## 6. Shared Component Rules

- **Status badge**: pill (6px radius), colored text on same-color 10%-opacity background. e.g. Available = green text on light-green pill.
- **Table**: white surface, `--border` row dividers, header uppercase 12px `--text-secondary`, row hover = `--bg`, row height 52px.
- **Buttons**: primary = filled indigo · secondary = white + border · danger = red. 8px radius, 10px×16px padding.
- **Forms**: label above input, full-width inputs, 8px radius, focus ring `--primary`, errors in `--danger` below field.
- **Empty state**: every table gets an icon + "No X yet" message + CTA button.
- **Icons**: `lucide-react` only. (truck, users, wrench, fuel, bar-chart-3, layout-dashboard, map-pin.)

---

## 7. Libraries (enforce consistency automatically)

| Purpose | Library |
|---------|---------|
| Components | **shadcn/ui** |
| CSS | **Tailwind CSS** |
| Icons | **lucide-react** |
| Charts | **Recharts** |
| Forms | react-hook-form + zod |

---

## One-liner to paste in team chat
> Indigo `#4F46E5` primary, slate neutrals, Inter font, 12px card radius, status = colored pills, shadcn/ui + lucide + Recharts. Tokens live in DESIGN_SYSTEM.md. Don't invent styles.
