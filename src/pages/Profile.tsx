import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { User, Wallet, Download, Settings, Lock, HelpCircle, MessageCircle, LogOut, Star, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const menuItems = [
    { icon: User, label: "My Profile", description: "Edit your personal information", path: "/profile-edit" },
    { icon: Wallet, label: "My Wallet", description: "Manage your wallet balance", path: "/wallet" },
    { icon: Download, label: "My Downloads", description: "View all your created banners", path: "/downloads" },
    { icon: Settings, label: "Banner Settings", description: "Customize default banner preferences", path: "/banner-settings" },
    { icon: Lock, label: "Change PIN", description: "Update your security PIN", path: "/change-pin" },
    { icon: HelpCircle, label: "Help & FAQ", description: "Get help and find answers", path: "/help" },
    { icon: MessageCircle, label: "Contact Support", description: "Get in touch with our team", path: "/support" },
  ];

  return (
    <div className="min-h-screen bg-navy-dark pb-24">
      {/* Profile Header */}
      <div className="relative px-6 pt-8 pb-6">
        {/* Profile Card */}
        <div className="gold-border bg-gradient-to-br from-card to-secondary rounded-3xl p-6 text-center space-y-3">
          <div className="relative inline-block">
            <div className="w-24 h-24 gold-border bg-secondary rounded-2xl flex items-center justify-center mx-auto">
              <User className="w-12 h-12 text-primary" />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-card">
              <Edit className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">John Doe</h2>
            <div className="flex items-center justify-center gap-1 text-primary">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-semibold">Gold Member</span>
            </div>
          </div>
          <div className="bg-muted/50 rounded-xl px-4 py-2 inline-block">
            <p className="text-sm text-muted-foreground">ID: RB12345 | Code: GLD001</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-6 space-y-3">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={index}
              to={item.path}
              className="gold-border bg-card rounded-2xl p-5 flex items-center gap-4 hover:gold-glow transition-all"
            >
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{item.label}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <svg
                className="w-5 h-5 text-muted-foreground flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>

      {/* Logout Button */}
      <div className="px-6 mt-6">
        <Button
          variant="destructive"
          className="w-full h-14 rounded-2xl font-bold text-base bg-destructive/90 hover:bg-destructive"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}