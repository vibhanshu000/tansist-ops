# 🟦 YASH — Auth feature (frontend)

Build here: login page, auth context/provider, protected route wrapper, role-based nav gating.
Module: 3.1 Authentication + RBAC. See ../../../docs/TASKS.md and ../../../docs/API_CONTRACT.md (/auth).

Suggested files:
- LoginPage.tsx
- AuthProvider.tsx        (stores token + user, exposes useAuth())
- ProtectedRoute.tsx
- roleAccess.ts           (which role sees which nav links)
