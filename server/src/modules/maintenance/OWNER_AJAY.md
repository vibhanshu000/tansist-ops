# 🟧 AJAY — Maintenance module (backend)

3.6 Maintenance. Endpoints in API_CONTRACT (/maintenance).

Files:
- maintenance.routes.ts
- maintenance.controller.ts
- maintenance.service.ts

Rules:
- POST /maintenance (active) -> vehicle.status = InShop
- POST /maintenance/:id/close -> vehicle.status = Available (unless Retired)
Use transactions to keep vehicle status in sync.
