import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isIOS, shouldDisableAnimations } from "@/lib/adaptiveAssets";

export default function LiveActivityTicker() {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [activeUsers, setActiveUsers] = useState(() =>
    Math.floor(Math.random() * (180 - 150 + 1)) + 150
  );
  const [animationsDisabled] = useState(() => shouldDisableAnimations());
  const [isiOSDevice] = useState(() => isIOS());

  // Phase progression - skip animations on iOS/mobile
  useEffect(() => {
    if (animationsDisabled || isiOSDevice) {
      setPhase(3);
      return;
    }

    const phase2Timer = setTimeout(() => setPhase(2), 500);
    const phase3Timer = setTimeout(() => setPhase(3), 1200);

    return () => {
      clearTimeout(phase2Timer);
      clearTimeout(phase3Timer);
    };
  }, [animationsDisabled, isiOSDevice]);

  // Simulated live updates - disabled when animations are disabled
  useEffect(() => {
    if (phase !== 3 || animationsDisabled || isiOSDevice) return;

    const getRandomInterval = () => Math.floor(Math.random() * 3000) + 3000;

    let timeout: NodeJS.Timeout;

    const updateUsers = () => {
      setActiveUsers((prev) => {
        const change = Math.floor(Math.random() * 3) + 1;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const newValue = prev + change * direction;
        return Math.max(140, Math.min(200, newValue));
      });
      timeout = setTimeout(updateUsers, getRandomInterval());
    };

    timeout = setTimeout(updateUsers, getRandomInterval());

    return () => clearTimeout(timeout);
  }, [phase, animationsDisabled, isiOSDevice]);

  // Static version for stability
  if (animationsDisabled || isiOSDevice) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-full overflow-hidden flex items-center justify-center shadow-lg shadow-black/50 px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
              <span className="font-bold text-primary tabular-nums">{activeUsers}</span>
              <span className="text-white/90">Leaders designing now</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ width: 120, height: 35 }}
        animate={{
          width: phase >= 2 ? 300 : 120,
          height: phase >= 2 ? 50 : 35,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          mass: 1,
        }}
        className="bg-[#0a0a0a] border border-white/10 rounded-full overflow-hidden flex items-center justify-center shadow-lg shadow-black/50"
      >
        <AnimatePresence>
          {phase === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex items-center gap-3 px-4"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                <AnimatedNumber value={activeUsers} />
                <span className="text-white/90">Leaders designing now</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}


function AnimatedNumber({ value }: { value: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -8, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.9 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="font-bold text-primary tabular-nums"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}
