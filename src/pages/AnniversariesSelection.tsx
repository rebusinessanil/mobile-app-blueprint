import { useNavigate } from "react-router-dom";
import { useAnniversaries } from "@/hooks/useAnniversaries";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";

const AnniversariesSelection = () => {
  const navigate = useNavigate();
  const { anniversaries, loading } = useAnniversaries();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background pb-20">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-semibold text-foreground">Anniversary Celebrations</h1>
            <p className="text-sm text-muted-foreground mt-1">Select an anniversary theme</p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background pb-20">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold text-foreground">Anniversary Celebrations</h1>
          <p className="text-sm text-muted-foreground mt-1">Select an anniversary theme</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {anniversaries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No anniversary themes available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {anniversaries.map((anniversary) => (
              <Card
                key={anniversary.id}
                className="group cursor-pointer overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                onClick={() => navigate(`/banner-create/anniversary?anniversaryId=${anniversary.id}`)}
              >
                <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                  <img
                    src={anniversary.anniversary_image_url}
                    alt={anniversary.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                      {anniversary.title}
                    </h3>
                    {anniversary.short_title && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {anniversary.short_title}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default AnniversariesSelection;
