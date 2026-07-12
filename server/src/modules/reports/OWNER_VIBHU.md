# 🟪 VIBHU — Reports module (backend)

3.8 Reports & Analytics. Endpoints in API_CONTRACT (/reports).

Files:
- reports.routes.ts
- reports.controller.ts
- reports.service.ts

Metrics:
- fuelEfficiency = totalDistance / totalFuel
- operationalCost = fuel + maintenance
- roi = (revenue - (maintenance + fuel)) / acquisitionCost
- GET /reports/export.csv -> stream CSV (use a csv lib or manual join)
