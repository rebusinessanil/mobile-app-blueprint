import { memo } from "react";
import { Star, Bell, Wallet, Menu, Home, Grid, MessageSquare, User } from "lucide-react";

// Static placeholder cards - no data fetching
const PLACEHOLDER_CARDS = [
  { id: 1, title: "Bronze Achiever", gradient: "from-amber-700 to-amber-900" },
  { id: 2, title: "Silver Achiever", gradient: "from-gray-400 to-gray-600" },
  { id: 3, title: "Gold Achiever", gradient: "from-yellow-500 to-yellow-700" },
  { id: 4, title: "Platinum", gradient: "from-slate-300 to-slate-500" },
];

const PLACEHOLDER_CATEGORIES = [
  { id: 1, name: "Rank Promotion", icon: "🏆" },
  { id: 2, name: "Bonanza Trips", icon: "✈️" },
  { id: 3, name: "Birthday", icon: "🎂" },
  { id: 4, name: "Anniversary", icon: "💞" },
];

// Memoized static component for optimal performance
const LockedDashboardPreview = memo(function LockedDashboardPreview() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-navy-dark">
      {/* Dashboard preview content - static, visual only, no blur */}
      <div className="absolute inset-0 overflow-y-auto pb-20">
        {/* Fixed Header Preview */}
        <header className="sticky top-0 px-4 py-3 border-b border-primary/20 bg-navy-dark/95 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">ReBusiness</h1>
                <p className="text-xs text-muted-foreground">Welcome back!</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/30">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">₹199</span>
              </div>
              <div className="w-9 h-9 rounded-xl border-2 border-primary flex items-center justify-center">
                <Menu className="w-5 h-5 text-primary" />
              </div>
              <div className="relative w-9 h-9 rounded-xl border-2 border-primary flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs font-bold flex items-center justify-center text-white">
                  2
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Stories Preview */}
        <div className="px-4 py-4">
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 border-2 border-primary/50 flex-shrink-0 flex items-center justify-center"
              >
                <span className="text-2xl opacity-60">
                  {["🎉", "🏆", "✈️", "🎂", "💼", "⭐"][i - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Sections Preview */}
        {PLACEHOLDER_CATEGORIES.map((category) => (
          <div key={category.id} className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                <h2 className="text-lg font-bold text-foreground">{category.name}</h2>
              </div>
              <span className="text-primary text-sm font-semibold">See All →</span>
            </div>
            <div className="flex gap-3 overflow-hidden">
              {PLACEHOLDER_CARDS.map((card) => (
                <div
                  key={card.id}
                  className={`w-[140px] h-[105px] rounded-2xl bg-gradient-to-br ${card.gradient} border border-primary/30 flex-shrink-0 shadow-lg`}
                >
                  <div className="p-3 h-full flex flex-col justify-end">
                    <p className="text-xs text-white font-medium truncate">{card.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Extra padding for bottom nav */}
        <div className="h-24" />
      </div>

      {/* Bottom Nav Preview - Fixed */}
      <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-primary/20 px-6 py-3 z-10">
        <div className="flex justify-around items-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Home className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-primary font-medium">Home</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Grid className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Categories</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Messages</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Profile</span>
          </div>
        </div>
      </div>

      {/* Subtle dark overlay for readability */}
      <div className="absolute inset-0 bg-navy-dark/30 pointer-events-none" />
    </div>
  );
});

export default LockedDashboardPreview;
