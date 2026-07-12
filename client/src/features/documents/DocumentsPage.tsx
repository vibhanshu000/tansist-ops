import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, Trash2 } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "../../lib/api";
import type { VehicleDocument, Vehicle } from "../../lib/types";
import { formatDate, isExpired } from "../../lib/format";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Modal } from "../../components/ui/Modal";
import { PageHeader, EmptyState } from "../../components/ui/PageHeader";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { AnimatedRow } from "../../components/ui/AnimatedRow";
import { useToast } from "../../components/ui/ToastContext";
import { useConfirm } from "../../components/ui/ConfirmDialog";

const DOC_TYPES = ["Registration", "Insurance", "Permit", "Other"];
const empty = { vehicleId: "", name: "", docType: "Registration", expiryDate: "", notes: "" };

export function DocumentsPage() {
  const [docs, setDocs] = useState<VehicleDocument[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [error, setError] = useState("");
  const toast = useToast();
  const confirm = useConfirm();

  async function load() {
    setLoading(true);
    try {
      setDocs(await apiGet<VehicleDocument[]>("/documents"));
      setVehicles(await apiGet<Vehicle[]>("/vehicles"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await apiPost("/documents", {
        vehicleId: Number(form.vehicleId),
        name: form.name,
        docType: form.docType,
        expiryDate: form.expiryDate || undefined,
        notes: form.notes,
      });
      setOpen(false);
      setForm(empty);
      toast.success("Document added");
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function remove(d: VehicleDocument) {
    const yes = await confirm({ message: `Delete document "${d.name}"?`, danger: true, confirmLabel: "Delete" });
    if (!yes) return;
    try {
      await apiDelete(`/documents/${d.id}`);
      toast.success("Document deleted");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Vehicle Documents"
        subtitle="Registration, insurance and permits per vehicle"
        action={<button className="btn-primary" onClick={() => { setError(""); setOpen(true); }}><Plus size={16} /> Add Document</button>}
      />

      <motion.div className="card !p-0 overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        {loading ? (
          <TableSkeleton cols={6} />
        ) : docs.length === 0 ? (
          <EmptyState icon={<FileText size={40} />} message="No documents yet"
            action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Document</button>} />
        ) : (
          <table className="w-full">
            <thead className="border-b border-appborder">
              <tr>
                <th className="th">Vehicle</th>
                <th className="th">Document</th>
                <th className="th">Type</th>
                <th className="th">Expiry</th>
                <th className="th">Notes</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => {
                const expired = d.expiryDate ? isExpired(d.expiryDate) : false;
                return (
                  <AnimatedRow key={d.id} index={i} className="border-b border-appborder last:border-0 hover:bg-appbg transition-colors">
                    <td className="td font-medium">{d.vehicle?.regNumber ?? d.vehicleId}</td>
                    <td className="td">{d.name}</td>
                    <td className="td">{d.docType}</td>
                    <td className="td">
                      {d.expiryDate ? (
                        expired ? <StatusBadge status="Expired" /> : formatDate(d.expiryDate)
                      ) : "-"}
                    </td>
                    <td className="td text-text-secondary">{d.notes || "-"}</td>
                    <td className="td">
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => remove(d)} className="text-text-secondary hover:text-danger"><Trash2 size={16} /></motion.button>
                    </td>
                  </AnimatedRow>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Vehicle Document">
        <form onSubmit={save} className="space-y-3">
          {error && <div className="rounded-btn bg-danger/10 text-danger text-sm px-3 py-2">{error}</div>}
          <div>
            <label className="label">Vehicle</label>
            <select className="input" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
              <option value="">Select vehicle</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Document Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Insurance Policy #4432" />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })}>
                {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Expiry Date</label>
              <input className="input" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
