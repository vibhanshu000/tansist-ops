import { useEffect } from "react";
import { motion } from "framer-motion";
import { Truck } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
  /** Total time the splash stays on screen before it dismisses (ms). */
  duration?: number;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

export function SplashScreen({ onFinish, duration = 2400 }: SplashScreenProps) {
  useEffect(() => {
    const t = setTimeout(onFinish, duration);
    return () => clearTimeout(t);
  }, [onFinish, duration]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#4F46E5] via-[#4338CA] to-[#3730A3]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
      transition={{ duration: 0.6, ease: easeOut }}
    >
      {/* Ambient floating glows */}
      <motion.div
        className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo badge */}
        <motion.div
          className="relative flex h-24 w-24 items-center justify-center rounded-[28px] bg-white/15 backdrop-blur-sm ring-1 ring-white/25"
          initial={{ scale: 0.4, opacity: 0, rotate: -25 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
        >
          {/* Pulsing ring */}
          <motion.span
            className="absolute inset-0 rounded-[28px] ring-2 ring-white/40"
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Truck className="text-white" size={44} strokeWidth={2.2} />
          </motion.div>
        </motion.div>

        {/* Animated road under the truck */}
        <div className="relative mt-4 h-[3px] w-40 overflow-hidden rounded-full bg-white/20">
          <motion.div
            className="absolute inset-y-0 w-10 rounded-full bg-white/80"
            initial={{ x: -48 }}
            animate={{ x: 176 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Wordmark */}
        <motion.h1
          className="mt-7 text-3xl font-bold tracking-tight text-white"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.35 }}
        >
          TransitOps
        </motion.h1>
        <motion.p
          className="mt-1.5 text-sm text-white/70"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.5 }}
        >
          Smart Transport Operations Platform
        </motion.p>

        {/* Progress bar */}
        <div className="mt-8 h-1 w-56 overflow-hidden rounded-full bg-white/20">
          <motion.div
            className="h-full rounded-full bg-white"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: duration / 1000 - 0.4, ease: easeOut, delay: 0.2 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
