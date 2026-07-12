import { Moon, Sun, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../features/auth/AuthContext";
import { useTheme } from "./ThemeContext";

export function Topbar() {
  const { logout, user } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <header className="h-16 shrink-0 border-b border-appborder bg-surface flex items-center justify-between px-6">
      <motion.div className="text-sm text-text-secondary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        Welcome back, <span className="font-medium text-text-primary">{user?.name}</span>
      </motion.div>
      <div className="flex items-center gap-2">
        <motion.button
          onClick={toggle}
          className="btn-secondary !px-2.5"
          title="Toggle dark mode"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={dark ? "sun" : "moon"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <motion.button onClick={logout} className="btn-secondary" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <LogOut size={16} /> Logout
        </motion.button>
      </div>
    </header>
  );
}
