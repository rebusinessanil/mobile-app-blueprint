import { useNavigate } from "react-router-dom";
import { useAnniversaries } from "@/hooks/useAnniversaries";
import SelectionCard from "@/components/dashboard/SelectionCard";
import BottomNav from "@/components/BottomNav";
import ListPageSkeleton from "@/components/skeletons/ListPageSkeleton";

const AnniversariesSelection = () => {
  const navigate = useNavigate();
  const { anniversaries, loading } = useAnniversaries();

  // Only show skeleton on initial load with no cached data
  if (loading && anniversaries.length === 0) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold text-foreground">Anniversary Celebrations</h1>
          <p className="text-sm text-muted-foreground mt-1">Select an anniversary theme</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {anniversaries.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💞</span>
            </div>
            <p className="text-muted-foreground">No anniversary themes available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {anniversaries.map((anniversary) => (
              <SelectionCard
                key={anniversary.id}
                id={anniversary.id}
                title={anniversary.title}
                subtitle={anniversary.short_title || undefined}
                imageUrl={anniversary.Anniversary_image_url}
                fallbackIcon="💞"
                fallbackGradient="bg-gradient-to-br from-rose-600 to-pink-600"
                onClick={() => navigate(`/banner-create/anniversary?anniversaryId=${anniversary.id}`)}
                aspectRatio="4/3"
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default AnniversariesSelection;
