# 🟧 AJAY — Maintenance feature (frontend)

Module 3.6 Maintenance. See TASKS.md + API_CONTRACT (/maintenance).

Suggested files:
- MaintenancePage.tsx     (list of records)
- MaintenanceForm.tsx     (vehicle, type, cost, date, notes)
- maintenanceApi.ts

Rules:
- Create active record -> vehicle status becomes InShop (auto-hidden from your trip dropdowns)
- Close maintenance -> vehicle becomes Available (unless Retired)
