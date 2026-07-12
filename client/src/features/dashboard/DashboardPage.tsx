import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Truck, CheckCircle, Wrench, MapPin, Clock, Users, Gauge } from "lucide-react";
import { apiGet } from "../../lib/api";
import type { Kpis, VehicleReport } from "../../lib/types";
import { PageHeader } from "../../components/ui/PageHeader";
import { CardSkeleton, ChartSkeleton } from "../../components/ui/Skeleton";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber";
import { staggerContainer, staggerItem, fadeUp } from "../../components/ui/motion";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

const KPI_DEFS = [
  { key: "activeVehicles", label: "Active Vehicles", icon: Truck, color: "#2563EB" },
  { key: "availableVehicles", label: "Available Vehicles", icon: CheckCircle, color: "#16A34A" },
  { key: "inMaintenance", label: "In Maintenance", icon: Wrench, color: "#D97706" },
  { key: "activeTrips", label: "Active Trips", icon: MapPin, color: "#2563EB" },
  { key: "pendingTrips", label: "Pending Trips", icon: Clock, color: "#D97706" },
  { key: "driversOnDuty", label: "Drivers On Duty", icon: Users, color: "#4F46E5" },
] as const;

const PIE_COLORS = ["#16A34A", "#2563EB", "#D97706", "#DC2626"];

export function DashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [fleet, setFleet] = useState<VehicleReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [region, setRegion] = useState("");

  async function load() {
    setLoading(true);
    const params: any = {};
    if (type) params.type = type;
    if (region) params.region = region;
    try {
      setKpis(await apiGet<Kpis>("/dashboard/kpis", params));
      setFleet(await apiGet<VehicleReport[]>("/reports/fleet"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, region]);

  const statusCounts = ["Available", "OnTrip", "InShop", "Retired"].map((s) => ({
    name: s,
    value: fleet.filter((f) => f.status === s).length,
  })).filter((x) => x.value > 0);

  const costData = fleet.map((f) => ({ name: f.regNumber, cost: f.operationalCost }));
  const utilization = kpis?.fleetUtilization ?? 0;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Fleet operations at a glance" />

      <motion.div className="flex gap-3 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <select className="input max-w-[160px]" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          <option>Van</option><option>Truck</option><option>Pickup</option><option>Car</option>
        </select>
        <input className="input max-w-[160px]" placeholder="Region" value={region} onChange={(e) => setRegion(e.target.value)} />
      </motion.div>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          : KPI_DEFS.map((d) => {
              const Icon = d.icon;
              const value = kpis ? (kpis as any)[d.key] : 0;
              return (
                <motion.div key={d.key} variants={staggerItem} className="card-hover">
                  <div className="flex items-center justify-between mb-2">
                    <span className="label !mb-0">{d.label}</span>
                    <motion.div whileHover={{ rotate: 8, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
                      <Icon size={18} style={{ color: d.color }} />
                    </motion.div>
                  </div>
                  <div className="text-3xl font-bold text-text-primary">
                    <AnimatedNumber value={value} />
                  </div>
                </motion.div>
              );
            })}
      </motion.div>

      <motion.div className="card mb-6" variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="label">Fleet Utilization</span>
            <div className="text-3xl font-bold text-text-primary">
              <AnimatedNumber value={utilization} suffix="%" />
            </div>
          </div>
          <motion.div animate={{ rotate: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <Gauge size={40} className="text-primary" />
          </motion.div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-appbg overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${utilization}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.25 }}>
          <h2 className="text-lg font-semibold mb-4">Fleet Status</h2>
          {loading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label isAnimationActive animationDuration={800} animationEasing="ease-out">
                  {statusCounts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }}>
          <h2 className="text-lg font-semibold mb-4">Operational Cost by Vehicle</h2>
          {loading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={costData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="cost" fill="#4F46E5" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
}
