import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Menu, Bell, Star, Calendar, Zap, Award } from "lucide-react";
import { useTemplateCategories, useTemplates } from "@/hooks/useTemplates";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useRanks } from "@/hooks/useTemplates";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Profile from "./Profile";
export default function Dashboard() {
  const { ranks } = useRanks();
  const [userId, setUserId] = useState<string | null>(null);
  const { profile } = useProfile(userId ?? undefined);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [bonanzaTrips, setBonanzaTrips] = useState<Array<{
    id: string;
    title: string;
    trip_image_url: string;
  }>>([]);

  // Fetch bonanza trips
  useEffect(() => {
    const fetchTrips = async () => {
      const { data } = await (supabase as any)
        .from('bonanza_trips')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (data) setBonanzaTrips(data);
    };
    fetchTrips();
  }, []);

  // Get authenticated user
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const quickActions = [{
    icon: Calendar,
    label: "Festival Banner",
    color: "bg-icon-purple",
    path: "/banner-create/festival"
  }, {
    icon: Zap,
    label: "Motivational Quote",
    color: "bg-icon-orange",
    path: "/banner-create/motivational"
  }, {
    icon: Award,
    label: "Achievements",
    color: "bg-icon-purple",
    path: "/categories/achievements"
  }, {
    label: "Special Offer Today",
    color: "bg-secondary",
    special: true,
    path: "/categories/special"
  }];
  return <div className="min-h-screen bg-navy-dark pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ReBusiness</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {profile?.name || "User"}!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <SheetTrigger asChild>
                <button className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <Menu className="w-5 h-5 text-primary" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full p-0 border-l border-primary/20 overflow-y-auto">
                <Profile />
              </SheetContent>
            </Sheet>
            <Link to="/messages" className="relative w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
              <Bell className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs font-bold flex items-center justify-center text-white">
                2
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <Link 
              key={index} 
              to={action.path}
              className="gold-border bg-card p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:gold-glow transition-all"
            >
              {action.special ? (
                <div className="text-xs font-semibold text-foreground leading-tight">
                  {action.label}
                </div>
              ) : (
                <>
                  <div className={`w-12 h-12 ${action.color} rounded-2xl flex items-center justify-center`}>
                    {action.icon && <action.icon className="w-6 h-6 text-white" />}
                  </div>
                  <span className="text-xs font-semibold text-foreground">{action.label}</span>
                </>
              )}
            </Link>
          ))}
        </div>

        {/* Rank Promotion Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <h2 className="text-lg font-bold text-foreground">Rank Promotion</h2>
            </div>
            <Link to="/rank-selection" className="text-primary text-sm font-semibold hover:underline">
              See All →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {ranks.slice(0, 3).map((rank) => (
              <Link 
                key={rank.id} 
                to={`/rank-banner-create/${rank.id}`}
                className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all"
              >
                <div className={`h-24 ${rank.gradient} flex items-center justify-center text-4xl`}>
                  {rank.icon}
                </div>
                <div className="p-3 text-center">
                  <p className="text-sm font-semibold text-foreground leading-tight">{rank.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bonanza Trips Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✈️</span>
              <h2 className="text-lg font-bold text-foreground">Bonanza Trips</h2>
            </div>
            <Link to="/categories/bonanza" className="text-primary text-sm font-semibold hover:underline">
              See All →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {bonanzaTrips.slice(0, 3).map((trip) => (
              <Link 
                key={trip.id} 
                to={`/banner-create/bonanza?tripId=${trip.id}`}
                className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all"
              >
                {trip.trip_image_url ? (
                  <div className="h-24 relative">
                    <img 
                      src={trip.trip_image_url} 
                      alt={trip.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <div className="h-24 bg-gradient-to-br from-secondary to-card flex items-center justify-center text-4xl">
                    ✈️
                  </div>
                )}
                <div className="p-3 text-center">
                  <p className="text-sm font-semibold text-foreground leading-tight">{trip.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Birthday Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎂</span>
              <h2 className="text-lg font-bold text-foreground">Birthday</h2>
            </div>
            <Link to="/banner-create/birthday" className="text-primary text-sm font-semibold hover:underline">
              Create →
            </Link>
          </div>
        </div>

        {/* Anniversary Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💞</span>
              <h2 className="text-lg font-bold text-foreground">Anniversary</h2>
            </div>
            <Link to="/banner-create/anniversary" className="text-primary text-sm font-semibold hover:underline">
              Create →
            </Link>
          </div>
        </div>

        {/* Meeting Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <h2 className="text-lg font-bold text-foreground">Meeting</h2>
            </div>
            <Link to="/banner-create/meeting" className="text-primary text-sm font-semibold hover:underline">
              Create →
            </Link>
          </div>
        </div>

        {/* Festival Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <h2 className="text-lg font-bold text-foreground">Festival</h2>
            </div>
            <Link to="/banner-create/festival" className="text-primary text-sm font-semibold hover:underline">
              Create →
            </Link>
          </div>
        </div>

        {/* Motivational Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <h2 className="text-lg font-bold text-foreground">Motivational</h2>
            </div>
            <Link to="/banner-create/motivational" className="text-primary text-sm font-semibold hover:underline">
              Create →
            </Link>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>;
}