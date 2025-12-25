import { memo } from "react";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LockedCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * A locked card component that shows blurred content with a lock overlay
 * Used for guest users to indicate private content that requires login
 */
function LockedCardComponent({ title, icon, children, className = "" }: LockedCardProps) {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate("/login")}
      className={`relative cursor-pointer group ${className}`}
    >
      {/* Blurred Content */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="blur-sm opacity-60 pointer-events-none select-none">
          {children}
        </div>
        
        {/* Lock Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-dark/40 backdrop-blur-[2px] rounded-2xl">
          <div className="flex flex-col items-center gap-2 p-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground">{title}</p>
              <p className="text-[10px] text-muted-foreground">Login to View</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(LockedCardComponent);
