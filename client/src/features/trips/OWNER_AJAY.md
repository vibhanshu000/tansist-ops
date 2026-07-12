# 🟧 AJAY — Trips feature (frontend)

Module 3.5 Trip Management + status transitions (HIGHEST-SCORING). See TASKS.md + API_CONTRACT (/trips).

Suggested files:
- TripsPage.tsx           (list + status filter)
- CreateTripForm.tsx      (vehicle/driver dropdowns from /vehicles/available & /drivers/available)
- TripActions.tsx         (Dispatch / Complete / Cancel buttons)
- CompleteTripModal.tsx   (finalOdometer + fuelConsumed + revenue)
- tripApi.ts

Rules you enforce (mirror on backend too):
- dropdowns only show Available vehicles/drivers
- cargoWeight <= vehicle.maxLoadKg
- Dispatch/Complete/Cancel flip statuses (see business rules 6-8)
