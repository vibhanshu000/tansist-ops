# 🟦 YASH — Prisma (schema + seed) — SHARED FILE, YASH OWNS

- schema.prisma : all 8 entities (see docs/TASKS.md DB section). This is a shared file —
  if Ajay/Vibhu need a field, ASK YASH, don't edit it in parallel (merge conflicts).
- seed.ts : must create
    * 4 roles + 1 user per role (login creds in README/chat)
    * Van-05 (maxLoadKg=500, status=Available)
    * driver Alex (valid future licenseExpiry, status=Available)
    * ~6 more vehicles, ~4 more drivers, a couple fuel logs
  So the demo + dashboards have data immediately.

Commands: `npm run db:push` then `npm run db:seed`.
