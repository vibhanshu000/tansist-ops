# 🟧 AJAY — Trips module (backend) — THE BUSINESS-RULE ENGINE

3.5 Trip Management + status transitions. Endpoints in API_CONTRACT (/trips).

Files:
- trips.routes.ts
- trips.controller.ts
- trips.service.ts     (all the rule logic + transactions)

Enforce (server-side, don't trust the client):
- cargoWeight <= vehicle.maxLoadKg
- vehicle & driver must be Available at dispatch (not OnTrip/InShop/Retired/Suspended/expired)
- dispatch: trip=Dispatched, vehicle=OnTrip, driver=OnTrip  (use a transaction)
- complete: trip=Completed, vehicle=Available, driver=Available, update odometer, store fuel/revenue
- cancel:   trip=Cancelled, restore vehicle+driver=Available

Use Prisma transactions so status changes are atomic.
