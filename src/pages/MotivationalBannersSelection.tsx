import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { useMotivationalBanners } from "@/hooks/useMotivationalBanners";
import { ListPageSkeleton } from "@/components/skeletons";

const MotivationalBannersSelection = () => {
  const navigate = useNavigate();
  const { motivationalBanners, loading } = useMotivationalBanners();

  // Instant direct navigation - zero delay
  const handleMotivationalSelect = useCallback((bannerId: string) => {
    navigate(`/banner-create/motivational?motivationalBannerId=${bannerId}`);
  }, [navigate]);

  if (loading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Motivational Banners
        </h1>
        <p className="text-muted-foreground mb-6">
          Select a motivational banner theme to create your banner
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {motivationalBanners.map((banner) => (
            <Card
              key={banner.id}
              className="cursor-pointer overflow-hidden hover:scale-105 transition-transform active:scale-95"
              onClick={() => handleMotivationalSelect(banner.id)}
            >
              <div className="aspect-square relative">
                <img
                  src={banner.Motivational_image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {banner.title}
                </h3>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MotivationalBannersSelection;
