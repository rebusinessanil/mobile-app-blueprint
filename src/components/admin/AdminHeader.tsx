import { ArrowLeft, Menu, RefreshCw } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showBack?: boolean;
}

export default function AdminHeader({
  title,
  subtitle,
  onMenuClick,
  onRefresh,
  isRefreshing,
  showBack = true,
}: AdminHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Show back button on all pages except main admin dashboard
  const isMainDashboard = location.pathname === "/admin";
  const shouldShowBack = showBack && !isMainDashboard;

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-primary/20">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {shouldShowBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20"
            >
              <ArrowLeft className="h-5 w-5 text-primary" />
            </Button>
          ) : onMenuClick ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 lg:hidden"
            >
              <Menu className="h-5 w-5 text-primary" />
            </Button>
          ) : null}
          
          <div>
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20"
            >
              <RefreshCw className={`h-4 w-4 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
