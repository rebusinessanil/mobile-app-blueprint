import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ranks } from "@/data/ranks";
import BottomNav from "@/components/BottomNav";

export default function RankSelection() {
  const navigate = useNavigate();

  const handleRankSelect = (rankId: string) => {
    navigate(`/rank-banner-create/${rankId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Select Your Rank</h1>
            <p className="text-sm text-muted-foreground">Choose your current rank to create a promotion banner</p>
          </div>
        </div>
      </header>

      {/* Ranks Grid */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-3 gap-4">
          {ranks.map((rank) => (
            <button
              key={rank.id}
              onClick={() => handleRankSelect(rank.id)}
              className="rank-card border-2 border-primary/60 bg-card rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:border-primary hover:shadow-[0_0_20px_hsl(45_100%_60%/0.3)] active:scale-95"
            >
              <div className={`w-14 h-14 ${rank.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                {rank.icon}
              </div>
              <span className="text-xs font-semibold text-center text-foreground leading-tight line-clamp-2">
                {rank.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
