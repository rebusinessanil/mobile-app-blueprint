import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileImage, 
  BookOpen, 
  Award, 
  Sticker, 
  Image, 
  Settings,
  LogOut,
  Menu,
  X,
  Images,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
}

// Cleaned admin routes - removed deprecated pages
const adminRoutes = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/users", icon: Users, label: "Users" },
  { path: "/admin/templates", icon: FileImage, label: "Templates" },
  { path: "/admin/stories", icon: BookOpen, label: "Stories" },
  { path: "/admin/ranks", icon: Award, label: "Ranks" },
  { path: "/admin/stickers", icon: Sticker, label: "Stickers" },
  { path: "/admin/sticker-management", icon: Sticker, label: "Sticker Slots" },
  { path: "/admin/template-backgrounds", icon: Image, label: "Backgrounds" },
  { path: "/admin/banner-carousel", icon: Images, label: "Carousel" },
  { path: "/admin/banner-defaults", icon: Settings, label: "Defaults" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary">ReBusiness</h1>
            <p className="text-[10px] text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {adminRoutes.map((route) => {
          const Icon = route.icon;
          const isActive = location.pathname === route.path;
          
          return (
            <Link
              key={route.path}
              to={route.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{route.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User App Link & Logout */}
      <div className="p-3 border-t border-primary/20 space-y-1">
        <Link
          to="/dashboard"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium">User App</span>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-primary/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Crown className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-bold text-primary">Admin</span>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 bg-card border-primary/20">
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-56 bg-card border-r border-primary/20">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-56 min-h-screen">
        {children}
      </main>
    </div>
  );
}

// Crown icon component
function Crown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 17h20l-2-14-6 6-4-8-4 8-6-6z" />
      <path d="M4 21h16" />
    </svg>
  );
}
