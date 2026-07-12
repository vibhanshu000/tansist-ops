import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  Wrench,
  Fuel,
  BarChart3,
  FileText,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { navForRole } from "../../features/auth/roleAccess";

const icons: Record<string, any> = {
  dashboard: LayoutDashboard,
  truck: Truck,
  users: Users,
  map: MapPin,
  wrench: Wrench,
  fuel: Fuel,
  chart: BarChart3,
  file: FileText,
};

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;
  const items = navForRole(user.role);

  return (
    <aside className="w-60 shrink-0 border-r border-appborder bg-surface flex flex-col h-full">
      <motion.div
        className="h-16 flex items-center gap-2 px-6 border-b border-appborder"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          initial={{ rotate: -15, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Truck className="text-primary" size={24} />
        </motion.div>
        <span className="text-lg font-bold text-text-primary">TransitOps</span>
      </motion.div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item, i) => {
          const Icon = icons[item.icon];
          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.03 * i, ease: [0.16, 1, 0.3, 1] }}
            >
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "bg-primary-light text-primary"
                      : "text-text-secondary hover:bg-appbg hover:text-text-primary"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active-bar"
                        className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon size={18} />
                    {item.label}
                  </>
                )}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-appborder">
        <div className="text-sm font-medium text-text-primary">{user.name}</div>
        <div className="text-xs text-text-secondary">{user.role.replace(/([a-z])([A-Z])/g, "$1 $2")}</div>
      </div>
    </aside>
  );
}
