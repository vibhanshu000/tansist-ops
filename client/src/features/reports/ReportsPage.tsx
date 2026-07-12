import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText } from "lucide-react";
import { api, apiGet } from "../../lib/api";
import type { VehicleReport } from "../../lib/types";
import { formatCurrency } from "../../lib/format";
import { PageHeader } from "../../components/ui/PageHeader";
import { ChartSkeleton, TableSkeleton } from "../../components/ui/Skeleton";
import { AnimatedRow } from "../../components/ui/AnimatedRow";
import { useToast } from "../../components/ui/ToastContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

export function ReportsPage() {
  const [fleet, setFleet] = useState<VehicleReport[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    apiGet<VehicleReport[]>("/reports/fleet")
      .then(setFleet)
      .finally(() => setLoading(false));
  }, []);

  async function exportFile(kind: "csv" | "pdf") {
    try {
      const res = await api.get(`/reports/export.${kind}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fleet-report.${kind}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Report exported as ${kind.toUpperCase()}`);
    } catch (err: any) {
      toast.error("Export failed");
    }
  }

  const efficiencyData = fleet.map((f) => ({ name: f.regNumber, efficiency: f.fuelEfficiency }));
  const roiData = fleet.map((f) => ({ name: f.regNumber, roi: f.roi }));

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Fuel efficiency, operational cost and vehicle ROI"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => exportFile("pdf")}><FileText size={16} /> Export PDF</button>
            <button className="btn-primary" onClick={() => exportFile("csv")}><Download size={16} /> Export CSV</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
          <h2 className="text-lg font-semibold mb-4">Fuel Efficiency (km / L)</h2>
          {loading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="efficiency" stroke="#4F46E5" strokeWidth={2} isAnimationActive animationDuration={800} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
          <h2 className="text-lg font-semibold mb-4">Vehicle ROI</h2>
          {loading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="roi" fill="#16A34A" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <motion.div className="card !p-0 overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}>
        {loading ? (
          <TableSkeleton cols={9} />
        ) : (
          <table className="w-full">
            <thead className="border-b border-appborder">
              <tr>
                <th className="th">Vehicle</th>
                <th className="th">Distance</th>
                <th className="th">Fuel (L)</th>
                <th className="th">Efficiency</th>
                <th className="th">Fuel Cost</th>
                <th className="th">Maint. Cost</th>
                <th className="th">Op. Cost</th>
                <th className="th">Revenue</th>
                <th className="th">ROI</th>
              </tr>
            </thead>
            <tbody>
              {fleet.map((f, i) => (
                <AnimatedRow key={f.vehicleId} index={i} className="border-b border-appborder last:border-0 hover:bg-appbg transition-colors">
                  <td className="td font-medium">{f.regNumber}</td>
                  <td className="td">{f.totalDistance} km</td>
                  <td className="td">{f.totalFuelLiters}</td>
                  <td className="td">{f.fuelEfficiency}</td>
                  <td className="td">{formatCurrency(f.fuelCost)}</td>
                  <td className="td">{formatCurrency(f.maintenanceCost)}</td>
                  <td className="td">{formatCurrency(f.operationalCost)}</td>
                  <td className="td">{formatCurrency(f.revenue)}</td>
                  <td className={`td font-medium ${f.roi >= 0 ? "text-success" : "text-danger"}`}>{f.roi}</td>
                </AnimatedRow>
              ))}
              {fleet.length === 0 && <tr><td className="td text-text-secondary" colSpan={9}>No data yet.</td></tr>}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
