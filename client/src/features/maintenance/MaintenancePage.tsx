import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Wrench, CheckCircle } from "lucide-react";
import { apiGet, apiPost } from "../../lib/api";
import type { Maintenance, Vehicle } from "../../lib/types";
import { formatCurrency, formatDate } from "../../lib/format";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Modal } from "../../components/ui/Modal";
import { PageHeader, EmptyState } from "../../components/ui/PageHeader";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { AnimatedRow } from "../../components/ui/AnimatedRow";
import { useToast } from "../../components/ui/ToastContext";

export function MaintenancePage() {
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ vehicleId: "", type: "Oil Change", cost: 0, notes: "" });
  const [error, setError] = useState("");
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      setRecords(await apiGet<Maintenance[]>("/maintenance"));
      setVehicles(await apiGet<Vehicle[]>("/vehicles"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await apiPost("/maintenance", {
        vehicleId: Number(form.vehicleId),
        type: form.type,
        cost: Number(form.cost),
        notes: form.notes,
      });
      setOpen(false);
      setForm({ vehicleId: "", type: "Oil Change", cost: 0, notes: "" });
      toast.success("Maintenance record created — vehicle marked In Shop");
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function close(id: number) {
    try {
      await apiPost(`/maintenance/${id}/close`);
      toast.success("Maintenance closed — vehicle restored to Available");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // vehicles that can go into maintenance (not on trip, not retired)
  const eligible = vehicles.filter((v) => v.status === "Available" || v.status === "InShop");

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Service logs — active records mark the vehicle In Shop"
        action={<button className="btn-primary" onClick={() => { setError(""); setOpen(true); }}><Plus size={16} /> New Record</button>}
      />

      <motion.div className="card !p-0 overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        {loading ? (
          <TableSkeleton cols={7} />
        ) : records.length === 0 ? (
          <EmptyState icon={<Wrench size={40} />} message="No maintenance records yet"
            action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Record</button>} />
        ) : (
          <table className="w-full">
            <thead className="border-b border-appborder">
              <tr>
                <th className="th">Vehicle</th>
                <th className="th">Type</th>
                <th className="th">Cost</th>
                <th className="th">Date</th>
                <th className="th">Notes</th>
                <th className="th">State</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {records.map((m, i) => (
                <AnimatedRow key={m.id} index={i} className="border-b border-appborder last:border-0 hover:bg-appbg transition-colors">
                  <td className="td font-medium">{m.vehicle?.regNumber ?? m.vehicleId}</td>
                  <td className="td">{m.type}</td>
                  <td className="td">{formatCurrency(m.cost)}</td>
                  <td className="td">{formatDate(m.date)}</td>
                  <td className="td text-text-secondary">{m.notes || "-"}</td>
                  <td className="td">
                    <StatusBadge status={m.isActive ? "InShop" : "Completed"} label={m.isActive ? "Active" : "Closed"} />
                  </td>
                  <td className="td">
                    {m.isActive && (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => close(m.id)} className="btn-secondary !py-1.5 !px-3 text-xs"><CheckCircle size={14} /> Close</motion.button>
                    )}
                  </td>
                </AnimatedRow>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Maintenance Record">
        <form onSubmit={create} className="space-y-3">
          {error && <div className="rounded-btn bg-danger/10 text-danger text-sm px-3 py-2">{error}</div>}
          <div>
            <label className="label">Vehicle</label>
            <select className="input" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
              <option value="">Select vehicle</option>
              {eligible.map((v) => <option key={v.id} value={v.id}>{v.regNumber} — {v.name} ({v.status})</option>)}
            </select>
            <p className="text-xs text-text-secondary mt-1">Creating an active record sets the vehicle to In Shop.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <input className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required />
            </div>
            <div>
              <label className="label">Cost</label>
              <input className="input" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
