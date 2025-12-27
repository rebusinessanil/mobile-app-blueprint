import { ReactNode } from "react";

interface AdminStatsCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  iconColor?: string;
}

export default function AdminStatsCard({ 
  icon, 
  value, 
  label, 
  iconColor = "text-primary" 
}: AdminStatsCardProps) {
  return (
    <div className="bg-card border border-primary/20 rounded-xl p-3 hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-2">
        <div className={iconColor}>{icon}</div>
        <div>
          <p className="text-xl font-bold text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
        </div>
      </div>
    </div>
  );
}
