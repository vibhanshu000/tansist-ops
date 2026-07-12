# 🟦 YASH — Auth module (backend)

3.1 Auth + RBAC. Endpoints in API_CONTRACT (/auth).

Files:
- auth.routes.ts
- auth.controller.ts   (register, login, me)
- auth.service.ts      (bcrypt hash, JWT sign/verify)

RBAC lives in ../../middleware/ (authenticate + requireRole).
Roles: FleetManager | Driver | SafetyOfficer | FinancialAnalyst.
