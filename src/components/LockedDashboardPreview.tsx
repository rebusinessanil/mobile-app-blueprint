import { memo } from "react";
import { Star, Bell, Wallet, Menu, Lock } from "lucide-react";

// Static placeholder cards - no data fetching
const PLACEHOLDER_CARDS = [
  { id: 1, title: "Bronze Achiever", gradient: "from-amber-700 to-amber-900" },
  { id: 2, title: "Silver Achiever", gradient: "from-gray-400 to-gray-600" },
  { id: 3, title: "Gold Achiever", gradient: "from-yellow-500 to-yellow-700" },
];

const PLACEHOLDER_CATEGORIES = [
  { id: 1, name: "Rank Promotion", icon: "🏆" },
  { id: 2, name: "Bonanza Trips", icon: "✈️" },
  { id: 3, name: "Birthday", icon: "🎂" },
];

// Memoized static component for optimal performance
const LockedDashboardPreview = memo(function LockedDashboardPreview() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Blurred dashboard background */}
      <div className="absolute inset-0 bg-navy-dark opacity-90" />
      
      {/* Dashboard preview content - visual only */}
      <div className="absolute inset-0 blur-[2px] opacity-40 overflow-hidden">
        {/* Fixed Header Preview */}
        <header className="px-4 py-3 border-b border-primary/20 bg-navy-dark/95">
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
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 flex-shrink-0"
              />
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
                  className={`w-[140px] h-[105px] rounded-2xl bg-gradient-to-br ${card.gradient} border border-primary/20 flex-shrink-0`}
                >
                  <div className="p-3 h-full flex flex-col justify-end">
                    <p className="text-xs text-white/80 font-medium truncate">{card.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Bottom Nav Preview */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-primary/20 px-4 py-3">
          <div className="flex justify-around">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-xl bg-secondary" />
            ))}
          </div>
        </div>
      </div>

      {/* Lock overlay with icon */}
      <div className="absolute inset-0 flex items-center justify-center bg-navy-dark/60">
        <div className="flex flex-col items-center gap-3 opacity-30">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary/50" />
          </div>
          <p className="text-sm text-muted-foreground/50 font-medium">Dashboard Locked</p>
        </div>
      </div>
    </div>
  );
});

export default LockedDashboardPreview;
