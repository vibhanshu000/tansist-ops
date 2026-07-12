import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Truck, Pencil, Trash2 } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "../../lib/api";
import type { Vehicle } from "../../lib/types";
import { formatCurrency, formatNumber } from "../../lib/format";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Modal } from "../../components/ui/Modal";
import { PageHeader, EmptyState } from "../../components/ui/PageHeader";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { SortableTh } from "../../components/ui/SortableTh";
import { AnimatedRow } from "../../components/ui/AnimatedRow";
import { useSort } from "../../lib/useSort";
import { useToast } from "../../components/ui/ToastContext";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useAuth } from "../auth/AuthContext";
import { canEdit } from "../auth/roleAccess";

const STATUSES = ["Available", "OnTrip", "InShop", "Retired"];
const empty = {
  regNumber: "", name: "", type: "Van", maxLoadKg: 0, odometer: 0, acquisitionCost: 0, region: "", status: "Available",
  fuelLevel: 0, fuelCapacity: 80, fuelEfficiencyKmpl: 8,
};

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [error, setError] = useState("");
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();
  const editable = user ? canEdit("/vehicles", user.role) : false;
  const { sorted, sortKey, sortDir, toggleSort } = useSort<Vehicle>(vehicles, "regNumber");

  async function load() {
    setLoading(true);
    const params: any = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    try {
      setVehicles(await apiGet<Vehicle[]>("/vehicles", params));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setError("");
    setModalOpen(true);
  }

  function openEdit(v: Vehicle) {
    setEditing(v);
    setForm({ ...v });
    setError("");
    setModalOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      maxLoadKg: Number(form.maxLoadKg),
      odometer: Number(form.odometer),
      acquisitionCost: Number(form.acquisitionCost),
      fuelLevel: Number(form.fuelLevel),
      fuelCapacity: Number(form.fuelCapacity),
      fuelEfficiencyKmpl: Number(form.fuelEfficiencyKmpl),
    };
    try {
      if (editing) await apiPut(`/vehicles/${editing.id}`, payload);
      else await apiPost("/vehicles", payload);
      setModalOpen(false);
      toast.success(editing ? "Vehicle updated" : "Vehicle created");
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function remove(v: Vehicle) {
    const yes = await confirm({ message: `Delete vehicle ${v.regNumber}? This cannot be undone.`, danger: true, confirmLabel: "Delete" });
    if (!yes) return;
    try {
      await apiDelete(`/vehicles/${v.id}`);
      toast.success("Vehicle deleted");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Vehicle Registry"
        subtitle="Master list of fleet vehicles"
        action={
          editable ? (
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Vehicle
            </button>
          ) : undefined
        }
      />

      <motion.div className="flex gap-3 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <input
          className="input max-w-xs"
          placeholder="Search reg number or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input max-w-[180px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </motion.div>

      <motion.div className="card !p-0 overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
        {loading ? (
          <TableSkeleton cols={9} />
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={<Truck size={40} />}
            message="No vehicles yet"
            action={editable ? <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Vehicle</button> : undefined}
          />
        ) : (
          <table className="w-full">
            <thead className="border-b border-appborder">
              <tr>
                <SortableTh label="Reg Number" active={sortKey === "regNumber"} dir={sortDir} onClick={() => toggleSort("regNumber")} />
                <SortableTh label="Name / Model" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
                <SortableTh label="Type" active={sortKey === "type"} dir={sortDir} onClick={() => toggleSort("type")} />
                <SortableTh label="Max Load" active={sortKey === "maxLoadKg"} dir={sortDir} onClick={() => toggleSort("maxLoadKg")} />
                <SortableTh label="Odometer" active={sortKey === "odometer"} dir={sortDir} onClick={() => toggleSort("odometer")} />
                <SortableTh label="Acq. Cost" active={sortKey === "acquisitionCost"} dir={sortDir} onClick={() => toggleSort("acquisitionCost")} />
                <SortableTh label="Fuel" active={sortKey === "fuelLevel"} dir={sortDir} onClick={() => toggleSort("fuelLevel")} />
                <th className="th">Region</th>
                <SortableTh label="Status" active={sortKey === "status"} dir={sortDir} onClick={() => toggleSort("status")} />
                {editable && <th className="th"></th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map((v, i) => {
                const pct = v.fuelCapacity > 0 ? Math.round((v.fuelLevel / v.fuelCapacity) * 100) : 0;
                const fuelTone = pct <= 20 ? "text-danger" : pct <= 50 ? "text-warning" : "text-success";
                return (
                <AnimatedRow key={v.id} index={i} className="border-b border-appborder last:border-0 hover:bg-appbg transition-colors">
                  <td className="td font-medium">{v.regNumber}</td>
                  <td className="td">{v.name}</td>
                  <td className="td">{v.type}</td>
                  <td className="td">{formatNumber(v.maxLoadKg)} kg</td>
                  <td className="td">{formatNumber(v.odometer)}</td>
                  <td className="td">{formatCurrency(v.acquisitionCost)}</td>
                  <td className={`td font-medium ${fuelTone}`}>{v.fuelLevel.toFixed(0)}/{v.fuelCapacity.toFixed(0)}L ({pct}%)</td>
                  <td className="td">{v.region || "-"}</td>
                  <td className="td"><StatusBadge status={v.status} /></td>
                  {editable && (
                    <td className="td">
                      <div className="flex gap-2">
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => openEdit(v)} className="text-text-secondary hover:text-primary"><Pencil size={16} /></motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => remove(v)} className="text-text-secondary hover:text-danger"><Trash2 size={16} /></motion.button>
                      </div>
                    </td>
                  )}
                </AnimatedRow>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Vehicle" : "Add Vehicle"}>
        <form onSubmit={save} className="space-y-3">
          {error && <div className="rounded-btn bg-danger/10 text-danger text-sm px-3 py-2">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Registration Number</label>
              <input className="input" value={form.regNumber} onChange={(e) => setForm({ ...form, regNumber: e.target.value })} required />
            </div>
            <div>
              <label className="label">Name / Model</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option>Van</option><option>Truck</option><option>Pickup</option><option>Car</option>
              </select>
            </div>
            <div>
              <label className="label">Max Load (kg)</label>
              <input className="input" type="number" value={form.maxLoadKg} onChange={(e) => setForm({ ...form, maxLoadKg: e.target.value })} required />
            </div>
            <div>
              <label className="label">Odometer</label>
              <input className="input" type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
            </div>
            <div>
              <label className="label">Acquisition Cost</label>
              <input className="input" type="number" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} />
            </div>
            <div>
              <label className="label">Region</label>
              <input className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fuel Level (L)</label>
              <input className="input" type="number" min={0} value={form.fuelLevel} onChange={(e) => setForm({ ...form, fuelLevel: e.target.value })} />
            </div>
            <div>
              <label className="label">Fuel Capacity (L)</label>
              <input className="input" type="number" min={1} value={form.fuelCapacity} onChange={(e) => setForm({ ...form, fuelCapacity: e.target.value })} />
            </div>
            <div>
              <label className="label">Fuel Efficiency (km/L)</label>
              <input className="input" type="number" min={0.1} step={0.1} value={form.fuelEfficiencyKmpl} onChange={(e) => setForm({ ...form, fuelEfficiencyKmpl: e.target.value })} />
              <p className="text-xs text-text-secondary mt-1">Used to check if the tank has enough fuel for a trip's planned distance.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary">{editing ? "Save" : "Create"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
