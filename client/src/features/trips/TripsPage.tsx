import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, MapPin, Send, CheckCircle, XCircle } from "lucide-react";
import { apiGet, apiPost } from "../../lib/api";
import type { Trip, Vehicle, Driver } from "../../lib/types";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Modal } from "../../components/ui/Modal";
import { PageHeader, EmptyState } from "../../components/ui/PageHeader";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { AnimatedRow } from "../../components/ui/AnimatedRow";
import { useToast } from "../../components/ui/ToastContext";
import { useConfirm } from "../../components/ui/ConfirmDialog";

const TRIP_STATUSES = ["Draft", "Dispatched", "Completed", "Cancelled"];
const emptyTrip = { source: "", destination: "", vehicleId: "", driverId: "", cargoWeight: 0, plannedDistance: 0 };

export function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyTrip);
  const [error, setError] = useState("");
  const toast = useToast();
  const confirm = useConfirm();

  // complete modal
  const [completeTrip, setCompleteTrip] = useState<Trip | null>(null);
  const [completeForm, setCompleteForm] = useState({ finalOdometer: 0, fuelConsumed: 0, revenue: 0 });
  const [completeError, setCompleteError] = useState("");

  async function load() {
    setLoading(true);
    const params: any = {};
    if (statusFilter) params.status = statusFilter;
    try {
      setTrips(await apiGet<Trip[]>("/trips", params));
    } finally {
      setLoading(false);
    }
  }

  async function loadPools() {
    setVehicles(await apiGet<Vehicle[]>("/vehicles/available"));
    setDrivers(await apiGet<Driver[]>("/drivers/available"));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const visibleTrips = search
    ? trips.filter(
        (t) =>
          t.source.toLowerCase().includes(search.toLowerCase()) ||
          t.destination.toLowerCase().includes(search.toLowerCase()) ||
          t.vehicle?.regNumber.toLowerCase().includes(search.toLowerCase()) ||
          t.driver?.name.toLowerCase().includes(search.toLowerCase())
      )
    : trips;

  function openCreate() {
    setForm(emptyTrip);
    setError("");
    loadPools();
    setCreateOpen(true);
  }

  const selectedVehicle = vehicles.find((v) => v.id === Number(form.vehicleId));
  const plannedDistanceNum = Number(form.plannedDistance) || 0;
  const requiredFuel = selectedVehicle ? plannedDistanceNum / (selectedVehicle.fuelEfficiencyKmpl || 1) : 0;
  const insufficientFuel = !!selectedVehicle && plannedDistanceNum > 0 && selectedVehicle.fuelLevel < requiredFuel;
  const overweight = !!selectedVehicle && Number(form.cargoWeight) > selectedVehicle.maxLoadKg;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    // Client-side pre-checks for instant feedback (server re-validates authoritatively).
    if (overweight) {
      setError(`Cargo weight exceeds ${selectedVehicle!.regNumber}'s capacity (${selectedVehicle!.maxLoadKg}kg).`);
      return;
    }
    if (insufficientFuel) {
      setError(
        `${selectedVehicle!.regNumber} only has ${selectedVehicle!.fuelLevel.toFixed(1)}L of fuel, but this trip needs about ${requiredFuel.toFixed(1)}L. Refuel the vehicle or pick another one.`
      );
      return;
    }
    try {
      await apiPost("/trips", {
        source: form.source,
        destination: form.destination,
        vehicleId: Number(form.vehicleId),
        driverId: Number(form.driverId),
        cargoWeight: Number(form.cargoWeight),
        plannedDistance: Number(form.plannedDistance),
      });
      setCreateOpen(false);
      toast.success("Trip created as Draft");
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function dispatch(id: number) {
    try {
      await apiPost(`/trips/${id}/dispatch`);
      toast.success("Trip dispatched — vehicle and driver are now On Trip");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function cancel(id: number) {
    const yes = await confirm({ message: "Cancel this trip? The vehicle and driver will be restored to Available.", danger: true, confirmLabel: "Cancel Trip" });
    if (!yes) return;
    try {
      await apiPost(`/trips/${id}/cancel`);
      toast.success("Trip cancelled");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function openComplete(t: Trip) {
    setCompleteTrip(t);
    setCompleteForm({ finalOdometer: t.vehicle?.odometer ?? 0, fuelConsumed: 0, revenue: 0 });
    setCompleteError("");
  }

  async function submitComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!completeTrip) return;
    setCompleteError("");
    try {
      await apiPost(`/trips/${completeTrip.id}/complete`, {
        finalOdometer: Number(completeForm.finalOdometer),
        fuelConsumed: Number(completeForm.fuelConsumed),
        revenue: Number(completeForm.revenue),
      });
      setCompleteTrip(null);
      toast.success("Trip completed — vehicle and driver are Available again");
      load();
    } catch (err: any) {
      setCompleteError(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Trip Management"
        subtitle="Dispatch, monitor and complete trips"
        action={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Create Trip</button>}
      />

      <motion.div className="flex gap-3 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <input className="input max-w-xs" placeholder="Search route, vehicle or driver..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-[180px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {TRIP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </motion.div>

      <motion.div className="card !p-0 overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
        {loading ? (
          <TableSkeleton cols={8} />
        ) : visibleTrips.length === 0 ? (
          <EmptyState icon={<MapPin size={40} />} message="No trips yet"
            action={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Create Trip</button>} />
        ) : (
          <table className="w-full">
            <thead className="border-b border-appborder">
              <tr>
                <th className="th">#</th>
                <th className="th">Route</th>
                <th className="th">Vehicle</th>
                <th className="th">Driver</th>
                <th className="th">Cargo</th>
                <th className="th">Distance</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleTrips.map((t, i) => (
                <AnimatedRow key={t.id} index={i} className="border-b border-appborder last:border-0 hover:bg-appbg transition-colors">
                  <td className="td font-medium">{t.id}</td>
                  <td className="td">{t.source} → {t.destination}</td>
                  <td className="td">{t.vehicle?.regNumber ?? t.vehicleId}</td>
                  <td className="td">{t.driver?.name ?? t.driverId}</td>
                  <td className="td">{t.cargoWeight} kg</td>
                  <td className="td">{t.plannedDistance} km</td>
                  <td className="td"><StatusBadge status={t.status} /></td>
                  <td className="td">
                    <div className="flex gap-2">
                      {t.status === "Draft" && (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => dispatch(t.id)} className="btn-primary !py-1.5 !px-3 text-xs"><Send size={14} /> Dispatch</motion.button>
                      )}
                      {t.status === "Dispatched" && (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openComplete(t)} className="btn-primary !py-1.5 !px-3 text-xs"><CheckCircle size={14} /> Complete</motion.button>
                      )}
                      {(t.status === "Draft" || t.status === "Dispatched") && (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => cancel(t.id)} className="btn-secondary !py-1.5 !px-3 text-xs"><XCircle size={14} /> Cancel</motion.button>
                      )}
                    </div>
                  </td>
                </AnimatedRow>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Create trip */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Trip">
        <form onSubmit={create} className="space-y-3">
          {error && <div className="rounded-btn bg-danger/10 text-danger text-sm px-3 py-2">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Source</label>
              <input className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required />
            </div>
            <div>
              <label className="label">Destination</label>
              <input className="input" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required />
            </div>
            <div>
              <label className="label">Vehicle (available only)</label>
              <select className="input" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNumber} — {v.name} (max {v.maxLoadKg}kg, {v.fuelLevel.toFixed(0)}L fuel @ {v.fuelEfficiencyKmpl}km/L)
                  </option>
                ))}
              </select>
              {vehicles.length === 0 && <p className="text-xs text-text-secondary mt-1">No available vehicles right now.</p>}
              {selectedVehicle && (
                <p className="text-xs text-text-secondary mt-1">
                  Tank: {selectedVehicle.fuelLevel.toFixed(1)}L / {selectedVehicle.fuelCapacity.toFixed(0)}L · Efficiency: {selectedVehicle.fuelEfficiencyKmpl} km/L
                </p>
              )}
            </div>
            <div>
              <label className="label">Driver (available only)</label>
              <select className="input" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} required>
                <option value="">Select driver</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.licenseCategory})</option>)}
              </select>
              {drivers.length === 0 && <p className="text-xs text-text-secondary mt-1">No available drivers right now.</p>}
            </div>
            <div>
              <label className="label">Cargo Weight (kg)</label>
              <input className="input" type="number" value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })} required />
              {overweight && (
                <p className="text-xs text-danger mt-1">Exceeds capacity ({selectedVehicle!.maxLoadKg}kg)</p>
              )}
            </div>
            <div>
              <label className="label">Planned Distance (km)</label>
              <input className="input" type="number" value={form.plannedDistance} onChange={(e) => setForm({ ...form, plannedDistance: e.target.value })} required />
              {insufficientFuel && (
                <p className="text-xs text-danger mt-1">
                  Needs ~{requiredFuel.toFixed(1)}L, tank only has {selectedVehicle!.fuelLevel.toFixed(1)}L
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="btn-primary" disabled={overweight || insufficientFuel}>Create Trip</button>
          </div>
        </form>
      </Modal>

      {/* Complete trip */}
      <Modal open={!!completeTrip} onClose={() => setCompleteTrip(null)} title={`Complete Trip #${completeTrip?.id ?? ""}`}>
        <form onSubmit={submitComplete} className="space-y-3">
          {completeError && <div className="rounded-btn bg-danger/10 text-danger text-sm px-3 py-2">{completeError}</div>}
          <div>
            <label className="label">Final Odometer</label>
            <input className="input" type="number" value={completeForm.finalOdometer} onChange={(e) => setCompleteForm({ ...completeForm, finalOdometer: Number(e.target.value) })} required />
          </div>
          <div>
            <label className="label">Fuel Consumed (liters)</label>
            <input className="input" type="number" value={completeForm.fuelConsumed} onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumed: Number(e.target.value) })} required />
          </div>
          <div>
            <label className="label">Revenue</label>
            <input className="input" type="number" value={completeForm.revenue} onChange={(e) => setCompleteForm({ ...completeForm, revenue: Number(e.target.value) })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setCompleteTrip(null)}>Cancel</button>
            <button className="btn-primary">Complete Trip</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
