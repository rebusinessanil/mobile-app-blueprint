import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveActivityTicker() {
  // Initialize with random values
  const [activeUsers, setActiveUsers] = useState(() => 
    Math.floor(Math.random() * (180 - 140 + 1)) + 140
  );
  const [designsCreated, setDesignsCreated] = useState(() => 
    Math.floor(Math.random() * (5500 - 5200 + 1)) + 5200
  );
  
  const prevUsersRef = useRef(activeUsers);
  const prevDesignsRef = useRef(designsCreated);

  useEffect(() => {
    // Random interval between 3-6 seconds
    const getRandomInterval = () => Math.floor(Math.random() * 3000) + 3000;
    
    let usersTimeout: NodeJS.Timeout;
    let designsTimeout: NodeJS.Timeout;

    const updateUsers = () => {
      setActiveUsers(prev => {
        prevUsersRef.current = prev;
        // Can go up or down by 1-3
        const change = Math.floor(Math.random() * 3) + 1;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const newValue = prev + (change * direction);
        // Keep within reasonable bounds (100-200)
        return Math.max(100, Math.min(200, newValue));
      });
      usersTimeout = setTimeout(updateUsers, getRandomInterval());
    };

    const updateDesigns = () => {
      setDesignsCreated(prev => {
        prevDesignsRef.current = prev;
        // Only increment by 1-5 (never decrease)
        const increment = Math.floor(Math.random() * 5) + 1;
        return prev + increment;
      });
      designsTimeout = setTimeout(updateDesigns, getRandomInterval());
    };

    // Start the intervals
    usersTimeout = setTimeout(updateUsers, getRandomInterval());
    designsTimeout = setTimeout(updateDesigns, getRandomInterval());

    return () => {
      clearTimeout(usersTimeout);
      clearTimeout(designsTimeout);
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-center gap-4 px-5 py-3 rounded-full bg-emerald-950/60 backdrop-blur-md border border-primary/20 shadow-lg shadow-primary/5"
      >
        {/* Live Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Live</span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-white/20" />

        {/* Active Users */}
        <div className="flex items-center gap-1.5 text-sm">
          <AnimatedNumber value={activeUsers} />
          <span className="text-white/80">Leaders designing now</span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-white/20 hidden sm:block" />

        {/* Designs Created - Hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm">
          <AnimatedNumber value={designsCreated} />
          <span className="text-white/80">banners created</span>
        </div>
      </motion.div>
    </div>
  );
}

// Animated number component for smooth transitions
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsChanging(true);
      // Small delay for animation effect
      const timeout = setTimeout(() => {
        setDisplayValue(value);
        setIsChanging(false);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [value, displayValue]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -10, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="font-bold text-primary tabular-nums"
      >
        {value.toLocaleString()}
      </motion.span>
    </AnimatePresence>
  );
}
