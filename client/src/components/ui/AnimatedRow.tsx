import { type ReactNode } from "react";
import { motion } from "framer-motion";

// Wraps a <tr> with a staggered fade/slide-in — use inside a `<AnimatePresence>`-free
// tbody (framer-motion animates on mount/key-change automatically via `layout`).
export function AnimatedRow({ children, index = 0, className }: { children: ReactNode; index?: number; className?: string }) {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.tr>
  );
}
