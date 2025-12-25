import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GuestStatusBar() {
  const navigate = useNavigate();
  const [activeUsers, setActiveUsers] = useState(() => 
    Math.floor(Math.random() * (180 - 150 + 1)) + 150
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simulated live updates with proper cleanup
  useEffect(() => {
    const getRandomInterval = () => Math.floor(Math.random() * 4000) + 4000; // Slower updates

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
  }, []);

  return (
    <div className="mx-4 mt-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl bg-card/95 border border-primary/20 shadow-lg shadow-black/30"
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        
        <div 
          onClick={() => navigate("/login")}
          className="relative flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        >
          {/* Left Side - Live Status */}
          <div className="flex items-center gap-2">
            {/* Live Dot - simplified for mobile */}
            <span className="relative flex h-2 w-2">
              <span className="hidden sm:inline-flex animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            
            {/* Live Text */}
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">LIVE</span>
            <span className="font-bold text-xs text-primary tabular-nums">{activeUsers}</span>
            <span className="text-xs text-white/70 whitespace-nowrap hidden xs:inline">Leaders designing now</span>
          </div>

          {/* Separator */}
          <div className="h-4 w-px bg-white/20 mx-3" />

          {/* Right Side - Lock Status */}
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-white/70 whitespace-nowrap">
              <span className="text-primary font-medium">Locked.</span>
              <span className="hidden sm:inline"> Login to view</span>
            </span>
            <LogIn className="w-3.5 h-3.5 text-primary/70" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
