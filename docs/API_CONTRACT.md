# 📡 API Contract — TransitOps

**Owner: Yash.** This is the single source of truth for every endpoint. Frontend builds against this so nobody waits on backend. If you change an endpoint, update this file AND tell the group.

Base URL: `http://localhost:4000/api`
Auth: send `Authorization: Bearer <token>` on all routes except `/auth/*`.
All responses: `{ "data": ..., "error": null }` or `{ "data": null, "error": "message" }`.

---

## 🟦 Auth (Yash) — `/auth`
| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/auth/register` | `{name,email,password,role}` | `{token,user}` |
| POST | `/auth/login` | `{email,password}` | `{token,user}` |
| GET | `/auth/me` | — | `{user}` |

`user = {id,name,email,role}` · role ∈ `FleetManager|Driver|SafetyOfficer|FinancialAnalyst`

---

## 🟦 Vehicles (Yash) — `/vehicles`
| Method | Path | Notes |
|--------|------|-------|
| GET | `/vehicles` | supports `?status=&type=&region=&search=` |
| GET | `/vehicles/:id` | |
| POST | `/vehicles` | 409 if regNumber exists |
| PUT | `/vehicles/:id` | |
| DELETE | `/vehicles/:id` | |
| GET | `/vehicles/available` | **for Ajay's dispatch dropdown** — only status=Available |

Vehicle = `{id,regNumber,name,type,maxLoadKg,odometer,acquisitionCost,region,status,fuelLevel,fuelCapacity,fuelEfficiencyKmpl}`

---

## 🟦 Drivers (Yash) — `/drivers`
| Method | Path | Notes |
|--------|------|-------|
| GET | `/drivers` | `?status=&search=` |
| GET | `/drivers/:id` | |
| POST | `/drivers` | |
| PUT | `/drivers/:id` | |
| DELETE | `/drivers/:id` | |
| GET | `/drivers/available` | **for Ajay** — Available, not Suspended, license not expired |

Driver = `{id,name,licenseNumber,licenseCategory,licenseExpiry,contact,safetyScore,status}`

---

## 🟧 Trips (Ajay) — `/trips`
| Method | Path | Body / Notes |
|--------|------|--------------|
| GET | `/trips` | `?status=` |
| POST | `/trips` | `{source,destination,vehicleId,driverId,cargoWeight,plannedDistance}` — validates cargo ≤ maxLoad AND fuelLevel ≥ plannedDistance/fuelEfficiencyKmpl |
| POST | `/trips/:id/dispatch` | sets trip=Dispatched, vehicle+driver=OnTrip |
| POST | `/trips/:id/complete` | `{finalOdometer,fuelConsumed,revenue}` → vehicle+driver=Available |
| POST | `/trips/:id/cancel` | restores vehicle+driver=Available |

Trip = `{id,source,destination,vehicleId,driverId,cargoWeight,plannedDistance,finalOdometer,fuelConsumed,revenue,status}`

---

## 🟧 Maintenance (Ajay) — `/maintenance`
| Method | Path | Notes |
|--------|------|-------|
| GET | `/maintenance` | `?vehicleId=` |
| POST | `/maintenance` | creates active record → vehicle=InShop |
| POST | `/maintenance/:id/close` | vehicle=Available (unless Retired) |

Maintenance = `{id,vehicleId,type,cost,date,notes,isActive}`

---

## 🟪 Fuel & Expense (Vibhu) — `/fuel`, `/expenses`
| Method | Path | Body |
|--------|------|------|
| GET | `/fuel` | `?vehicleId=` |
| POST | `/fuel` | `{vehicleId,liters,cost,date}` |
| GET | `/expenses` | `?vehicleId=` |
| POST | `/expenses` | `{vehicleId,type,amount,date}` |

---

## 🟪 Dashboard & Reports (Vibhu) — `/dashboard`, `/reports`
| Method | Path | Returns |
|--------|------|---------|
| GET | `/dashboard/kpis` | `{activeVehicles,availableVehicles,inMaintenance,activeTrips,pendingTrips,driversOnDuty,fleetUtilization}` |
| GET | `/reports/vehicle/:id` | `{fuelEfficiency,operationalCost,roi}` |
| GET | `/reports/fleet` | array for charts |
| GET | `/reports/export.csv` | CSV file download |

---

## 🟪 Vehicle Documents (Vibhu) — `/documents` (bonus feature)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/documents` | `?vehicleId=` |
| POST | `/documents` | `{vehicleId,name,docType,expiryDate?,notes}` — FleetManager/SafetyOfficer only |
| DELETE | `/documents/:id` | FleetManager/SafetyOfficer only |

docType ∈ `Registration \| Insurance \| Permit \| Other`

---

## 🟪 Reminders (Vibhu) — `/reminders` (bonus feature)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/reminders/expiring-licenses?days=30` | returns drivers whose license expires within N days |
| POST | `/reminders/send` | `{days}` — sends email via SMTP if configured, else logs to server console. FleetManager/SafetyOfficer only |

---

## RBAC — enforced on all write routes
| Group | Roles allowed to write |
|---|---|
| Vehicles | FleetManager |
| Drivers | FleetManager, SafetyOfficer |
| Trips | FleetManager, Driver |
| Maintenance | FleetManager |
| Fuel / Expenses | FleetManager, FinancialAnalyst |
| Documents / Reminders | FleetManager, SafetyOfficer |

All GET endpoints only require authentication (any role).

---

## Status string values (use EXACTLY these)
```
Vehicle: Available | OnTrip | InShop | Retired
Driver:  Available | OnTrip | OffDuty | Suspended
Trip:    Draft | Dispatched | Completed | Cancelled
```
