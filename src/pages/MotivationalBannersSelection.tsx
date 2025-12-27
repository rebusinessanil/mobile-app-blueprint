import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMotivationalBanners } from "@/hooks/useMotivationalBanners";
import SelectionCard from "@/components/dashboard/SelectionCard";
import BottomNav from "@/components/BottomNav";
import ListPageSkeleton from "@/components/skeletons/ListPageSkeleton";

const MotivationalBannersSelection = () => {
  const navigate = useNavigate();
  const { motivationalBanners, loading } = useMotivationalBanners();

  // Only show skeleton on initial load with no cached data
  if (loading && motivationalBanners.length === 0) {
    return <ListPageSkeleton />;
  }

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
          <h1 className="text-xl font-bold text-foreground">Motivational Banners</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">Choose a Theme</h2>
          <p className="text-muted-foreground">
            Select a motivational banner theme to create your banner
          </p>
        </div>

        {motivationalBanners.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⚡</span>
            </div>
            <p className="text-muted-foreground">No motivational banners available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {motivationalBanners.map((banner) => (
              <SelectionCard
                key={banner.id}
                id={banner.id}
                title={banner.title}
                imageUrl={banner.Motivational_image_url}
                fallbackIcon="⚡"
                fallbackGradient="bg-gradient-to-br from-yellow-600 to-orange-600"
                onClick={() => navigate(`/banner-create/motivational?motivationalBannerId=${banner.id}`)}
                aspectRatio="square"
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MotivationalBannersSelection;
