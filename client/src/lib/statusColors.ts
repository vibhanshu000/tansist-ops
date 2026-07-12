// Maps every status string to a design-system color token.
// Used by StatusBadge so vehicle/driver/trip statuses look identical everywhere.
export type Tone = "success" | "warning" | "info" | "danger" | "neutral";

const map: Record<string, Tone> = {
  // Vehicle
  Available: "success",
  OnTrip: "info",
  InShop: "warning",
  Retired: "danger",
  // Driver
  OffDuty: "neutral",
  Suspended: "danger",
  // Trip
  Draft: "warning",
  Dispatched: "info",
  Completed: "success",
  Cancelled: "danger",
  // License
  Expired: "danger",
  Valid: "success",
};

export function toneFor(status: string): Tone {
  return map[status] ?? "neutral";
}

// human-readable label (OnTrip -> On Trip)
export function labelFor(status: string): string {
  return status.replace(/([a-z])([A-Z])/g, "$1 $2");
}
