# 🟦 YASH — Vehicles module (backend)

3.3 Vehicle Registry. Endpoints in API_CONTRACT (/vehicles).

Files:
- vehicles.routes.ts
- vehicles.controller.ts
- vehicles.service.ts

Rules:
- regNumber UNIQUE (Prisma @unique) -> return 409 on duplicate
- GET /vehicles/available returns ONLY status=Available (for Ajay's dispatch)
- support filters: status, type, region, search
