import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useFestivals } from "@/hooks/useFestivals";
import BottomNav from "@/components/BottomNav";

export default function FestivalSelection() {
  const navigate = useNavigate();
  const { festivals, loading } = useFestivals();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading festivals...</p>
        </div>
      </div>
    );
  }

  const handleFestivalClick = (festivalId: string) => {
    console.log('🎉 Festival selected:', festivalId);
    navigate('/banner-create/festival', {
      state: { festivalId }
    });
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-24">
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Select Festival</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">Festival Banners</h2>
          <p className="text-muted-foreground">
            Choose a festival to create your celebration banner
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {festivals.map((festival) => (
            <button
              key={festival.id}
              onClick={() => handleFestivalClick(festival.id)}
              className="gold-border bg-card rounded-2xl overflow-hidden hover:gold-glow transition-all text-left"
            >
              <div className="h-32 relative">
                {festival.poster_url ? (
                  <img
                    src={festival.poster_url}
                    alt={festival.festival_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-4xl">
                    🎉
                  </div>
                )}
              </div>
              <div className="p-4 text-center">
                <h3 className="text-sm font-semibold text-foreground leading-tight">
                  {festival.festival_name}
                </h3>
                {festival.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {festival.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>

        {festivals.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎉</span>
            </div>
            <p className="text-muted-foreground">No festivals available yet</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
