import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardPreviewOverlayProps {
  isAuthenticated: boolean;
  onShowLogin: () => void;
}

export default function DashboardPreviewOverlay({ 
  isAuthenticated, 
  onShowLogin 
}: DashboardPreviewOverlayProps) {
  const [showOverlay, setShowOverlay] = useState(!isAuthenticated);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // If user is authenticated, remove overlay immediately
    if (isAuthenticated) {
      setShowOverlay(false);
      return;
    }

    // Start countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          onShowLogin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isAuthenticated, onShowLogin]);

  if (!showOverlay || isAuthenticated) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-background/30 backdrop-blur-sm" />
      
      {/* Lock indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 pointer-events-auto">
        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center animate-pulse">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Preview Mode</p>
          <p className="text-sm text-muted-foreground">
            Login required in <span className="text-primary font-bold">{countdown}</span>s
          </p>
        </div>
      </div>
    </div>
  );
}
