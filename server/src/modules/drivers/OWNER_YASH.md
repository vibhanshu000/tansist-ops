# 🟦 YASH — Drivers module (backend)

3.4 Driver Management. Endpoints in API_CONTRACT (/drivers).

Files:
- drivers.routes.ts
- drivers.controller.ts
- drivers.service.ts

Rule: GET /drivers/available returns ONLY Available drivers, not Suspended,
with licenseExpiry in the future (for Ajay's dispatch).
Status enum: Available | OnTrip | OffDuty | Suspended.
