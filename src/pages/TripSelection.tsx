import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { trips } from "@/data/trips";

export default function TripSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Select Trip Destination</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Trip Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => navigate(`/trip-banner-create/${trip.id}`)}
              className={`${trip.gradient} rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border-2 border-white/20`}
            >
              <div className="text-6xl mb-4">{trip.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{trip.name}</h3>
              <p className="text-white/80 text-sm">Create Achievement Banner</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
