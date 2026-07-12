import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users, Pencil, Trash2 } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "../../lib/api";
import type { Driver } from "../../lib/types";
import { formatDate, isExpired } from "../../lib/format";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Modal } from "../../components/ui/Modal";
import { PageHeader, EmptyState } from "../../components/ui/PageHeader";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { SortableTh } from "../../components/ui/SortableTh";
import { AnimatedRow } from "../../components/ui/AnimatedRow";
import { useSort } from "../../lib/useSort";
import { useToast } from "../../components/ui/ToastContext";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { ExpiryReminderBanner } from "./ExpiryReminderBanner";

const STATUSES = ["Available", "OnTrip", "OffDuty", "Suspended"];

function isoDate(d?: string) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

const empty = { name: "", licenseNumber: "", licenseCategory: "B", licenseExpiry: "", contact: "", safetyScore: 100, status: "Available" };

export function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [error, setError] = useState("");
  const toast = useToast();
  const confirm = useConfirm();
  const { sorted, sortKey, sortDir, toggleSort } = useSort<Driver>(drivers, "name");

  async function load() {
    setLoading(true);
    const params: any = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    try {
      setDrivers(await apiGet<Driver[]>("/drivers", params));
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

  function openEdit(d: Driver) {
    setEditing(d);
    setForm({ ...d, licenseExpiry: isoDate(d.licenseExpiry) });
    setError("");
    setModalOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = { ...form, safetyScore: Number(form.safetyScore) };
    try {
      if (editing) await apiPut(`/drivers/${editing.id}`, payload);
      else await apiPost("/drivers", payload);
      setModalOpen(false);
      toast.success(editing ? "Driver updated" : "Driver created");
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function remove(d: Driver) {
    const yes = await confirm({ message: `Delete driver ${d.name}? This cannot be undone.`, danger: true, confirmLabel: "Delete" });
    if (!yes) return;
    try {
      await apiDelete(`/drivers/${d.id}`);
      toast.success("Driver deleted");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Driver Management"
        subtitle="Driver profiles, licenses and compliance"
        action={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Driver</button>}
      />

      <ExpiryReminderBanner />

      <motion.div className="flex gap-3 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <input className="input max-w-xs" placeholder="Search name or license..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-[180px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </motion.div>

      <motion.div className="card !p-0 overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
        {loading ? (
          <TableSkeleton cols={8} />
        ) : drivers.length === 0 ? (
          <EmptyState icon={<Users size={40} />} message="No drivers yet"
            action={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Driver</button>} />
        ) : (
          <table className="w-full">
            <thead className="border-b border-appborder">
              <tr>
                <SortableTh label="Name" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
                <SortableTh label="License No" active={sortKey === "licenseNumber"} dir={sortDir} onClick={() => toggleSort("licenseNumber")} />
                <th className="th">Category</th>
                <SortableTh label="Expiry" active={sortKey === "licenseExpiry"} dir={sortDir} onClick={() => toggleSort("licenseExpiry")} />
                <th className="th">Contact</th>
                <SortableTh label="Safety" active={sortKey === "safetyScore"} dir={sortDir} onClick={() => toggleSort("safetyScore")} />
                <SortableTh label="Status" active={sortKey === "status"} dir={sortDir} onClick={() => toggleSort("status")} />
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d, i) => {
                const expired = isExpired(d.licenseExpiry);
                return (
                  <AnimatedRow key={d.id} index={i} className="border-b border-appborder last:border-0 hover:bg-appbg transition-colors">
                    <td className="td font-medium">{d.name}</td>
                    <td className="td">{d.licenseNumber}</td>
                    <td className="td">{d.licenseCategory}</td>
                    <td className={`td ${expired ? "text-danger font-medium" : ""}`}>
                      {formatDate(d.licenseExpiry)} {expired && "(expired)"}
                    </td>
                    <td className="td">{d.contact}</td>
                    <td className="td">{d.safetyScore}</td>
                    <td className="td"><StatusBadge status={d.status} /></td>
                    <td className="td">
                      <div className="flex gap-2">
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => openEdit(d)} className="text-text-secondary hover:text-primary"><Pencil size={16} /></motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => remove(d)} className="text-text-secondary hover:text-danger"><Trash2 size={16} /></motion.button>
                      </div>
                    </td>
                  </AnimatedRow>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Driver" : "Add Driver"}>
        <form onSubmit={save} className="space-y-3">
          {error && <div className="rounded-btn bg-danger/10 text-danger text-sm px-3 py-2">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">License Number</label>
              <input className="input" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} required />
            </div>
            <div>
              <label className="label">License Category</label>
              <select className="input" value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}>
                <option>B</option><option>C</option><option>CE</option><option>D</option>
              </select>
            </div>
            <div>
              <label className="label">License Expiry</label>
              <input className="input" type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} required />
            </div>
            <div>
              <label className="label">Contact</label>
              <input className="input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} required />
            </div>
            <div>
              <label className="label">Safety Score</label>
              <input className="input" type="number" min={0} max={100} value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
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
