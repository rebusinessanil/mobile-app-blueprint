import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveActivityTicker() {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [activeUsers, setActiveUsers] = useState(() => 
    Math.floor(Math.random() * (180 - 150 + 1)) + 150
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Phase progression with proper cleanup
  useEffect(() => {
    const phase2Timer = setTimeout(() => setPhase(2), 500);
    const phase3Timer = setTimeout(() => setPhase(3), 1200);
    
    phaseTimersRef.current = [phase2Timer, phase3Timer];

    return () => {
      phaseTimersRef.current.forEach(timer => clearTimeout(timer));
      phaseTimersRef.current = [];
    };
  }, []);

  // Simulated live updates with proper cleanup
  useEffect(() => {
    if (phase !== 3) return;

    const getRandomInterval = () => Math.floor(Math.random() * 4000) + 4000; // Slower for mobile

    const updateUsers = () => {
      setActiveUsers(prev => {
        const change = Math.floor(Math.random() * 3) + 1;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const newValue = prev + (change * direction);
        return Math.max(140, Math.min(200, newValue));
      });
      timeoutRef.current = setTimeout(updateUsers, getRandomInterval());
    };

    timeoutRef.current = setTimeout(updateUsers, getRandomInterval());

    // CRITICAL: Proper cleanup to prevent memory leaks
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [phase]);

  // Check if mobile to simplify animations
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ width: 120, height: 35 }}
        animate={{
          width: phase >= 2 ? (isMobile ? 260 : 300) : 120,
          height: phase >= 2 ? (isMobile ? 44 : 50) : 35,
        }}
        transition={isMobile ? { duration: 0.2 } : {
          type: "spring",
          stiffness: 300,
          damping: 25,
          mass: 1,
        }}
        className="bg-card border border-white/10 rounded-full overflow-hidden flex items-center justify-center shadow-lg shadow-black/50"
      >
        <AnimatePresence>
          {phase === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center gap-3 px-4"
            >
              {/* Live Dot - ping hidden on mobile via CSS */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="hidden sm:inline-flex animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </div>

              {/* Live Text - simplified number display for mobile */}
              <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                <span className="font-bold text-primary tabular-nums">{activeUsers}</span>
                <span className="text-white/90 text-xs sm:text-sm">Leaders designing now</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
