import { ReactNode } from "react";
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
  Library,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

const adminRoutes = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/users", icon: Users, label: "Users" },
  { path: "/admin/templates", icon: FileImage, label: "Templates" },
  { path: "/admin/stories", icon: BookOpen, label: "Stories" },
  { path: "/admin/ranks", icon: Award, label: "Ranks" },
  { path: "/admin/sticker-library", icon: Library, label: "Sticker Library" },
  { path: "/admin/category-stickers", icon: Layers, label: "Category Stickers" },
  { path: "/admin/stickers", icon: Sticker, label: "Stickers" },
  { path: "/admin/rank-stickers", icon: Award, label: "Rank Stickers" },
  { path: "/admin/template-backgrounds", icon: Image, label: "Backgrounds" },
  { path: "/admin/banner-defaults", icon: Settings, label: "Banner Defaults" },
  { path: "/admin/banner-preview-defaults", icon: Settings, label: "Banner Preview Defaults" },
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
      <div className="p-6 border-b border-primary/20">
        <h1 className="text-2xl font-bold text-primary">ReBusiness Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Management Panel</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {adminRoutes.map((route) => {
          const Icon = route.icon;
          const isActive = location.pathname === route.path;
          
          return (
            <Link
              key={route.path}
              to={route.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-primary/20 text-primary border-2 border-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{route.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-primary/20">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-dark">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-navy-dark/95 backdrop-blur-sm border-b border-primary/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 bg-card border-primary/20">
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-card border-r border-primary/20">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
