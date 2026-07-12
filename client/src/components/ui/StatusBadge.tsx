import { motion } from "framer-motion";
import { toneFor, labelFor, type Tone } from "../../lib/statusColors";

const toneClasses: Record<Tone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-neutralx/10 text-neutralx",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = toneFor(status);
  return (
    <motion.span
      key={status}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center rounded-badge px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {label ?? labelFor(status)}
    </motion.span>
  );
}
