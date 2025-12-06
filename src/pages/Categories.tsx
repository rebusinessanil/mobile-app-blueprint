import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Search, Filter, Trophy, Gift, Calendar, Star, MessageCircle, Zap, Briefcase, Target, Medal, Image, Users, IndianRupee, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import ProfileCompletionGate from "@/components/ProfileCompletionGate";

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Get authenticated user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  // Instant navigation handler - no delays
  const handleCategoryClick = useCallback((e: React.MouseEvent, path: string) => {
    e.preventDefault();
    // Use startTransition for non-blocking navigation
    navigate(path);
  }, [navigate]);

  const categories = [
    { icon: Trophy, label: "Rank Promotion", color: "bg-yellow-600", path: "/rank-selection" },
    { icon: Gift, label: "Bonanza Promotion", color: "bg-red-600", path: "/banner-create/bonanza" },
    { icon: Calendar, label: "Birthday Banner", color: "bg-teal-600", path: "/banner-create/birthday" },
    { icon: Star, label: "Anniversary Banner", color: "bg-blue-600", path: "/banner-create/anniversary" },
    { icon: MessageCircle, label: "Thank You Message", color: "bg-green-600", path: "/category/thank-you-message" },
    { icon: Zap, label: "Motivational Quote", color: "bg-yellow-600", path: "/banner-create/motivational" },
    { icon: Calendar, label: "Festival Banner", color: "bg-purple-600", path: "/banner-create/festival" },
    { icon: Target, label: "Weekly Achievement", color: "bg-teal-600", path: "/category/weekly-achievement" },
    { icon: Briefcase, label: "Special Campaign", color: "bg-yellow-700", path: "/category/special-campaign" },
    { icon: Medal, label: "Achievements", color: "bg-purple-600", path: "/category/achievements" },
    { icon: Image, label: "Custom Banner", color: "bg-blue-700", path: "/category/custom-banner" },
    { icon: Users, label: "Event / Meeting", color: "bg-yellow-600", path: "/banner-create/meeting" },
    { icon: Users, label: "New Joiner Banner", color: "bg-teal-700", path: "/category/new-joiner-banner" },
    { icon: IndianRupee, label: "Income Banner", color: "bg-green-700", path: "/category/income-banner" },
    { icon: BarChart3, label: "Capping Banner", color: "bg-red-700", path: "/category/capping-banner" },
  ];

  const filteredCategories = categories.filter((cat) =>
    cat.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProfileCompletionGate userId={userId}>
      <div className="min-h-screen bg-navy-dark pb-24">
        {/* Header */}
        <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <h1 className="text-2xl font-bold text-foreground mb-4">All Categories</h1>
        
        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="gold-border bg-secondary text-foreground pl-11 h-12"
            />
          </div>
          <button className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors">
            <Filter className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </header>

      {/* Categories Grid */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-3 gap-4">
          {filteredCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Link
                key={index}
                to={category.path}
                onClick={(e) => handleCategoryClick(e, category.path)}
                className="gold-border bg-card rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:gold-glow transition-all active:scale-95"
              >
                <div className={`w-14 h-14 ${category.color} rounded-2xl flex items-center justify-center`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs font-semibold text-center text-foreground leading-tight">
                  {category.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

        <BottomNav />
      </div>
    </ProfileCompletionGate>
  );
}