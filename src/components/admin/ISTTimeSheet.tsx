import { Clock } from "lucide-react";
import { useISTClock } from "@/hooks/useISTClock";

interface ISTTimeSheetProps {
  showCountdown?: boolean;
  compact?: boolean;
}

export default function ISTTimeSheet({ showCountdown = true, compact = false }: ISTTimeSheetProps) {
  const { currentTime, timeUntilMidnight } = useISTClock();

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3 h-3 text-primary" />
        <span className="font-mono">{currentTime}</span>
        <span className="text-primary/60">IST</span>
      </div>
    );
  }

  return (
    <div className="bg-card border border-primary/20 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">IST Time</span>
        </div>
        <span className="text-xs font-mono text-primary">{currentTime}</span>
      </div>
      
      {showCountdown && (
        <div className="flex items-center justify-between pt-2 border-t border-primary/10">
          <span className="text-xs text-muted-foreground">Next status update</span>
          <div className="flex items-center gap-1">
            <span className="bg-primary/10 text-primary text-xs font-mono px-1.5 py-0.5 rounded">
              {String(timeUntilMidnight.hours).padStart(2, '0')}h
            </span>
            <span className="text-muted-foreground">:</span>
            <span className="bg-primary/10 text-primary text-xs font-mono px-1.5 py-0.5 rounded">
              {String(timeUntilMidnight.minutes).padStart(2, '0')}m
            </span>
            <span className="text-muted-foreground">:</span>
            <span className="bg-primary/10 text-primary text-xs font-mono px-1.5 py-0.5 rounded">
              {String(timeUntilMidnight.seconds).padStart(2, '0')}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
