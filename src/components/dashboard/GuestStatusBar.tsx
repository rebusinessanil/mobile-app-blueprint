import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { shouldDisableAnimations } from "@/lib/adaptiveAssets";

export default function GuestStatusBar() {
  const navigate = useNavigate();
  const [activeUsers, setActiveUsers] = useState(() =>
    Math.floor(Math.random() * (180 - 150 + 1)) + 150
  );
  const [animationsDisabled] = useState(() => shouldDisableAnimations());

  // Simulated live updates (disabled on mobile stability mode)
  useEffect(() => {
    if (animationsDisabled) return;

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
  }, [animationsDisabled]);

  if (animationsDisabled) {
    return (
      <div className="mx-4 mt-4">
        <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0a]/90 border border-primary/20 shadow-lg shadow-black/30">
          <div
            onClick={() => navigate("/login")}
            className="relative flex items-center justify-between px-4 py-3 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">LIVE</span>
              <span className="font-bold text-xs text-primary tabular-nums">{activeUsers}</span>
              <span className="text-xs text-white/70 whitespace-nowrap">Leaders designing now</span>
            </div>

            <div className="h-4 w-px bg-white/20 mx-3" />

            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-white/70 whitespace-nowrap">
                <span className="text-primary font-medium">Dashboard locked.</span> Login to view
              </span>
              <LogIn className="w-3.5 h-3.5 text-primary/70" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl bg-[#0a0a0a]/90 border border-primary/20 backdrop-blur-xl shadow-lg shadow-black/30"
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />

        <div
          onClick={() => navigate("/login")}
          className="relative flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        >
          {/* Left Side - Live Status */}
          <div className="flex items-center gap-2">
            {/* Pulsing Live Dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>

            {/* Live Text */}
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">LIVE</span>
            <AnimatedNumber value={activeUsers} />
            <span className="text-xs text-white/70 whitespace-nowrap">Leaders designing now</span>
          </div>

          {/* Separator */}
          <div className="h-4 w-px bg-white/20 mx-3" />

          {/* Right Side - Lock Status */}
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-white/70 whitespace-nowrap">
              <span className="text-primary font-medium">Dashboard locked.</span>
              {" "}Login to view
            </span>
            <LogIn className="w-3.5 h-3.5 text-primary/70" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}


// Animated number component for smooth transitions
function AnimatedNumber({ value }: { value: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -4, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.9 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="font-bold text-xs text-primary tabular-nums"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}
