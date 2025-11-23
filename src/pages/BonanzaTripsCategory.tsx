import { Link } from "react-router-dom";
import { ArrowLeft, Plane } from "lucide-react";
import { useBonanzaTrips } from "@/hooks/useBonanzaTrips";
import BottomNav from "@/components/BottomNav";

export default function BonanzaTripsCategory() {
  const { data: trips = [], isLoading } = useBonanzaTrips();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl p-3">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Bonanza Trips</h1>
                <p className="text-sm text-muted-foreground">Select your achievement trip</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              to={`/banner-create/bonanza?tripId=${trip.id}`}
              className="group"
            >
              <div className="relative cursor-pointer">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-card border-2 border-primary/20 group-hover:border-primary/40 transition-all duration-300">
                  <img
                    src={trip.trip_image_url}
                    alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mt-3 px-2">
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {trip.title}
                  </h3>
                  {trip.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {trip.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {trips.length === 0 && (
          <div className="text-center py-12">
            <Plane className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No trips available</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
