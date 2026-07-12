import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Fuel } from "lucide-react";
import { apiGet, apiPost } from "../../lib/api";
import type { FuelLog, Expense, Vehicle } from "../../lib/types";
import { formatCurrency, formatDate } from "../../lib/format";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { AnimatedRow } from "../../components/ui/AnimatedRow";
import { useToast } from "../../components/ui/ToastContext";

export function FuelExpensePage() {
  const [tab, setTab] = useState<"fuel" | "expense">("fuel");
  const [fuel, setFuel] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState<any>({ vehicleId: "", liters: 0, cost: 0 });
  const [expForm, setExpForm] = useState<any>({ vehicleId: "", type: "toll", amount: 0 });
  const [error, setError] = useState("");
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      setFuel(await apiGet<FuelLog[]>("/fuel"));
      setExpenses(await apiGet<Expense[]>("/expenses"));
      setVehicles(await apiGet<Vehicle[]>("/vehicles"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (tab === "fuel") {
        await apiPost("/fuel", { vehicleId: Number(fuelForm.vehicleId), liters: Number(fuelForm.liters), cost: Number(fuelForm.cost) });
        setFuelForm({ vehicleId: "", liters: 0, cost: 0 });
        toast.success("Fuel log added");
      } else {
        await apiPost("/expenses", { vehicleId: Number(expForm.vehicleId), type: expForm.type, amount: Number(expForm.amount) });
        setExpForm({ vehicleId: "", type: "toll", amount: 0 });
        toast.success("Expense added");
      }
      setOpen(false);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Fuel & Expense"
        subtitle="Log fuel and operational expenses"
        action={<button className="btn-primary" onClick={() => { setError(""); setOpen(true); }}><Plus size={16} /> Add {tab === "fuel" ? "Fuel Log" : "Expense"}</button>}
      />

      <motion.div className="flex gap-2 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <button className={tab === "fuel" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("fuel")}>Fuel Logs</button>
        <button className={tab === "expense" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("expense")}>Expenses</button>
      </motion.div>

      <motion.div className="card !p-0 overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
        {loading ? (
          <TableSkeleton cols={4} />
        ) : (
          <AnimatePresence mode="wait">
            {tab === "fuel" ? (
              <motion.table key="fuel" className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <thead className="border-b border-appborder">
                  <tr><th className="th">Vehicle</th><th className="th">Liters</th><th className="th">Cost</th><th className="th">Date</th></tr>
                </thead>
                <tbody>
                  {fuel.map((f, i) => (
                    <AnimatedRow key={f.id} index={i} className="border-b border-appborder last:border-0 hover:bg-appbg transition-colors">
                      <td className="td font-medium">{f.vehicle?.regNumber ?? f.vehicleId}</td>
                      <td className="td">{f.liters} L</td>
                      <td className="td">{formatCurrency(f.cost)}</td>
                      <td className="td">{formatDate(f.date)}</td>
                    </AnimatedRow>
                  ))}
                  {fuel.length === 0 && <tr><td className="td text-text-secondary" colSpan={4}>No fuel logs yet.</td></tr>}
                </tbody>
              </motion.table>
            ) : (
              <motion.table key="expense" className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <thead className="border-b border-appborder">
                  <tr><th className="th">Vehicle</th><th className="th">Type</th><th className="th">Amount</th><th className="th">Date</th></tr>
                </thead>
                <tbody>
                  {expenses.map((x, i) => (
                    <AnimatedRow key={x.id} index={i} className="border-b border-appborder last:border-0 hover:bg-appbg transition-colors">
                      <td className="td font-medium">{x.vehicle?.regNumber ?? x.vehicleId}</td>
                      <td className="td capitalize">{x.type}</td>
                      <td className="td">{formatCurrency(x.amount)}</td>
                      <td className="td">{formatDate(x.date)}</td>
                    </AnimatedRow>
                  ))}
                  {expenses.length === 0 && <tr><td className="td text-text-secondary" colSpan={4}>No expenses yet.</td></tr>}
                </tbody>
              </motion.table>
            )}
          </AnimatePresence>
        )}
      </motion.div>

      <Modal open={open} onClose={() => setOpen(false)} title={tab === "fuel" ? "Add Fuel Log" : "Add Expense"}>
        <form onSubmit={submit} className="space-y-3">
          {error && <div className="rounded-btn bg-danger/10 text-danger text-sm px-3 py-2">{error}</div>}
          {tab === "fuel" ? (
            <>
              <div>
                <label className="label">Vehicle</label>
                <select className="input" value={fuelForm.vehicleId} onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })} required>
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Liters</label><input className="input" type="number" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} required /></div>
                <div><label className="label">Cost</label><input className="input" type="number" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} required /></div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Vehicle</label>
                <select className="input" value={expForm.vehicleId} onChange={(e) => setExpForm({ ...expForm, vehicleId: e.target.value })} required>
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={expForm.type} onChange={(e) => setExpForm({ ...expForm, type: e.target.value })}>
                    <option value="toll">Toll</option><option value="maintenance">Maintenance</option><option value="other">Other</option>
                  </select>
                </div>
                <div><label className="label">Amount</label><input className="input" type="number" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} required /></div>
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
