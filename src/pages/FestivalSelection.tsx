import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useFestivals } from "@/hooks/useFestivals";
import SelectionCard from "@/components/dashboard/SelectionCard";
import BottomNav from "@/components/BottomNav";
import ListPageSkeleton from "@/components/skeletons/ListPageSkeleton";

export default function FestivalSelection() {
  const navigate = useNavigate();
  const { festivals, loading } = useFestivals();

  // Only show skeleton on initial load with no cached data
  if (loading && festivals.length === 0) {
    return <ListPageSkeleton />;
  }

  const handleFestivalClick = (festivalId: string) => {
    console.log('🎉 Festival selected:', festivalId);
    navigate('/banner-create/festival', {
      state: { festivalId }
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
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

        {festivals.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎉</span>
            </div>
            <p className="text-muted-foreground">No festivals available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {festivals.map((festival) => (
              <SelectionCard
                key={festival.id}
                id={festival.id}
                title={festival.festival_name}
                subtitle={festival.description || undefined}
                imageUrl={festival.poster_url}
                fallbackIcon="🎉"
                fallbackGradient="bg-gradient-to-br from-purple-600 to-pink-600"
                onClick={() => handleFestivalClick(festival.id)}
                aspectRatio="4/3"
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
