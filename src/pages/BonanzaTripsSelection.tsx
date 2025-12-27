import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useBonanzaTrips } from "@/hooks/useBonanzaTrips";
import SelectionCard from "@/components/dashboard/SelectionCard";
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
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
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

        {trips.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎁</span>
            </div>
            <p className="text-muted-foreground">No trips available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {trips.map((trip) => (
              <SelectionCard
                key={trip.id}
                id={trip.id}
                title={trip.title}
                subtitle={trip.description || undefined}
                imageUrl={trip.trip_image_url}
                fallbackIcon="🎁"
                fallbackGradient="bg-gradient-to-br from-red-600 to-orange-600"
                onClick={() => navigate(`/banner-create/bonanza?tripId=${trip.id}`)}
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
