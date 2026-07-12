# 🟩 SHARED — UI components (shadcn/ui)

This is where shadcn/ui components land (Button, Card, Input, Table, Dialog, Badge, Select...).

Rules:
- Yash installs the base set in Phase 0.
- ADD components here (via `npx shadcn@latest add <name>`) — don't rewrite existing ones.
- Do NOT put feature logic here. Only reusable presentational components.
- StatusBadge.tsx lives here — uses the status->color map from DESIGN_SYSTEM.md so
  vehicle/driver/trip statuses look identical everywhere.
