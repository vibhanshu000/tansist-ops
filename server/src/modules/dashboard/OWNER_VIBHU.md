# 🟪 VIBHU — Dashboard module (backend)

3.2 Dashboard KPIs. Endpoints in API_CONTRACT (/dashboard/kpis).

Files:
- dashboard.routes.ts
- dashboard.controller.ts
- dashboard.service.ts   (aggregate counts via Prisma groupBy/count)

Return: activeVehicles, availableVehicles, inMaintenance, activeTrips, pendingTrips,
driversOnDuty, fleetUtilization (= OnTrip vehicles / non-retired total * 100).
Support filters: type, status, region.
