# 🟦 YASH — Middleware

Files:
- authenticate.ts   (verify JWT, attach req.user)
- requireRole.ts    (RBAC: requireRole('FleetManager', ...))
- errorHandler.ts   (central error -> { data:null, error:message })

Everyone's routes rely on authenticate. Keep the response envelope consistent:
{ data, error }.
