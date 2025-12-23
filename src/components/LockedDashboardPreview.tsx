import { memo } from "react";
import { Star, Bell, Wallet, Menu, Home, Grid3X3, MessageSquare, User } from "lucide-react";

// Static placeholder data - no fetching
const STORY_AVATARS = [
  { id: 1, label: "Festival", color: "from-orange-500 to-red-600" },
  { id: 2, label: "Birthday", color: "from-blue-500 to-purple-600" },
  { id: 3, label: "Event", color: "from-green-500 to-teal-600" },
  { id: 4, label: "Special", color: "from-pink-500 to-rose-600" },
];

const RANK_CARDS = [
  { id: 1, title: "Bronze", gradient: "from-amber-700 to-amber-900", border: "border-amber-500/50" },
  { id: 2, title: "Silver", gradient: "from-gray-400 to-gray-600", border: "border-gray-400/50" },
  { id: 3, title: "Gold", gradient: "from-yellow-500 to-yellow-700", border: "border-yellow-500/50" },
  { id: 4, title: "Platinum", gradient: "from-slate-300 to-slate-500", border: "border-slate-400/50" },
  { id: 5, title: "Emerald", gradient: "from-emerald-600 to-emerald-800", border: "border-emerald-500/50" },
];

const TRIP_CARDS = [
  { id: 1, title: "Summer Trip", gradient: "from-blue-600 to-blue-800" },
  { id: 2, title: "Vietnam Trip", gradient: "from-teal-600 to-teal-800" },
];

const LockedDashboardPreview = memo(function LockedDashboardPreview() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Dashboard preview with 30% blur - clearly visible */}
      <div className="absolute inset-0 blur-[3px] opacity-70 overflow-hidden bg-background">
        {/* Header */}
        <header className="px-4 py-3 border-b border-primary/20 bg-card/95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">ReBusiness</h1>
                <p className="text-xs text-muted-foreground">Welcome back!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/40">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">₹199</span>
              </div>
              <div className="w-9 h-9 rounded-xl border-2 border-primary/50 flex items-center justify-center">
                <Menu className="w-5 h-5 text-primary" />
              </div>
              <div className="relative w-9 h-9 rounded-xl border-2 border-primary/50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs font-bold flex items-center justify-center text-white">
                  2
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Stories Section */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📖</span>
            <h2 className="text-lg font-bold text-foreground">Stories</h2>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {STORY_AVATARS.map((story) => (
              <div key={story.id} className="flex flex-col items-center gap-1">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${story.color} border-2 border-primary/40 p-0.5`}>
                  <div className="w-full h-full rounded-full bg-secondary/50" />
                </div>
                <span className="text-xs text-muted-foreground">{story.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rank Promotion Section */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h2 className="text-lg font-bold text-foreground">Rank Promotion</h2>
            </div>
            <span className="text-primary text-sm font-semibold">See All →</span>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {RANK_CARDS.map((card) => (
              <div
                key={card.id}
                className={`w-[130px] h-[100px] rounded-2xl bg-gradient-to-br ${card.gradient} border ${card.border} flex-shrink-0`}
              >
                <div className="p-3 h-full flex flex-col justify-end">
                  <p className="text-sm text-white font-semibold">{card.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bonanza Trips Section */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">✈️</span>
              <h2 className="text-lg font-bold text-foreground">Bonanza Trips</h2>
            </div>
            <span className="text-primary text-sm font-semibold">See All →</span>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {TRIP_CARDS.map((card) => (
              <div
                key={card.id}
                className={`w-[160px] h-[120px] rounded-2xl bg-gradient-to-br ${card.gradient} border border-primary/30 flex-shrink-0`}
              >
                <div className="p-3 h-full flex flex-col justify-end">
                  <p className="text-sm text-white font-semibold">{card.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Birthday Section */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎂</span>
              <h2 className="text-lg font-bold text-foreground">Birthday</h2>
            </div>
            <span className="text-primary text-sm font-semibold">See All →</span>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-primary/20 px-6 py-3">
          <div className="flex justify-around items-center">
            <div className="flex flex-col items-center gap-1">
              <Home className="w-5 h-5 text-primary" />
              <span className="text-xs text-primary font-medium">Dashboard</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Grid3X3 className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Categories</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Messages</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <User className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Profile</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle lock overlay - very light to keep dashboard visible */}
      <div className="absolute inset-0 bg-background/20" />
    </div>
  );
});

export default LockedDashboardPreview;
