import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useBonanzaTrips } from "@/hooks/useBonanzaTrips";
import BottomNav from "@/components/BottomNav";
import ListPageSkeleton from "@/components/skeletons/ListPageSkeleton";

export default function BonanzaTripsSelection() {
  const navigate = useNavigate();
  const { trips, loading } = useBonanzaTrips();

  // Only show skeleton on initial load with no cached data
  if (loading && trips.length === 0) {
    return <ListPageSkeleton />;
  }

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
          <h1 className="text-xl font-bold text-foreground">Select Trip</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">Bonanza Trips</h2>
          <p className="text-muted-foreground">
            Choose a trip to create your achievement banner
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              to={`/banner-create/bonanza?tripId=${trip.id}`}
              className="gold-border bg-card rounded-2xl overflow-hidden hover:gold-glow transition-all"
            >
              <div className="h-32 relative">
                {trip.trip_image_url ? (
                  <img
                    src={trip.trip_image_url}
                    alt={trip.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-4xl">
                    🎁
                  </div>
                )}
              </div>
              <div className="p-4 text-center">
                <h3 className="text-sm font-semibold text-foreground leading-tight">
                  {trip.title}
                </h3>
                {trip.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {trip.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {trips.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎁</span>
            </div>
            <p className="text-muted-foreground">No trips available yet</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
