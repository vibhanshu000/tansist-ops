import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Mail } from "lucide-react";
import { apiGet, apiPost } from "../../lib/api";
import type { ExpiringLicense } from "../../lib/types";
import { useToast } from "../../components/ui/ToastContext";
import { useAuth } from "../auth/AuthContext";

// Bonus feature: email reminders for expiring licenses. Shows a banner + manual trigger.
export function ExpiryReminderBanner() {
  const [list, setList] = useState<ExpiringLicense[]>([]);
  const [sending, setSending] = useState(false);
  const toast = useToast();
  const { user } = useAuth();
  const canSend = user?.role === "FleetManager" || user?.role === "SafetyOfficer";

  async function load() {
    setList(await apiGet<ExpiringLicense[]>("/reminders/expiring-licenses", { days: 30 }));
  }

  useEffect(() => {
    load();
  }, []);

  async function send() {
    setSending(true);
    try {
      const result = await apiPost<any[]>("/reminders/send", { days: 30 });
      toast.success(`Sent ${result.length} reminder${result.length === 1 ? "" : "s"} (check server console if SMTP isn't configured)`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence>
      {list.length > 0 && (
        <motion.div
          className="rounded-card border border-warning/30 bg-warning/10 px-4 py-3 mb-4 flex items-start justify-between gap-4"
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-start gap-3">
            <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}>
              <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
            </motion.div>
            <div className="text-sm">
              <span className="font-medium text-text-primary">{list.length} license{list.length === 1 ? "" : "s"} expiring within 30 days: </span>
              <span className="text-text-secondary">
                {list.map((l) => `${l.name} (${l.daysLeft}d)`).join(", ")}
              </span>
            </div>
          </div>
          {canSend && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={send} disabled={sending} className="btn-secondary !py-1.5 !px-3 text-xs shrink-0">
              <Mail size={14} /> {sending ? "Sending..." : "Send Reminders"}
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
