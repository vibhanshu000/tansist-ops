# 🟪 VIBHU — Fuel & Expense module (backend)

3.7 Fuel & Expense. Endpoints in API_CONTRACT (/fuel, /expenses).

Files:
- fuelExpense.routes.ts
- fuelExpense.controller.ts
- fuelExpense.service.ts

- POST/GET /fuel      (vehicleId, liters, cost, date)
- POST/GET /expenses  (vehicleId, type, amount, date)
- helper: operationalCost(vehicleId) = sum(fuel.cost) + sum(maintenance.cost)
