import { Home, Grid3x3, MessageSquare, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/categories", icon: Grid3x3, label: "Categories" },
    { path: "/messages", icon: MessageSquare, label: "Messages" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="app-bottom-nav bg-card border-t border-primary/30">
      <div className="h-full max-w-screen-lg mx-auto flex items-center justify-around px-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActive ? "active" : "text-muted-foreground"}`}
            >
              <Icon className="w-6 h-6" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}