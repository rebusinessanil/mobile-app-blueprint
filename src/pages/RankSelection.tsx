import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ranks } from "@/data/ranks";

export default function RankSelection() {
  const navigate = useNavigate();

  const handleRankSelect = (rankId: string) => {
    navigate(`/rank-banner-create/${rankId}`);
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
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
              className="gold-border bg-card rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:gold-glow transition-all"
            >
              <div className={`w-16 h-16 ${rank.gradient} rounded-2xl flex items-center justify-center text-3xl shadow-lg`}>
                {rank.icon}
              </div>
              <span className="text-sm font-semibold text-center text-foreground leading-tight">
                {rank.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}