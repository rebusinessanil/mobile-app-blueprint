import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function TripSelection() {
  const navigate = useNavigate();

  // Fetch Bonanza Trips category
  const { data: category } = useQuery({
    queryKey: ["bonanza-category"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_categories")
        .select("*")
        .eq("slug", "bonanza-trips")
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch trip templates
  const { data: trips, isLoading } = useQuery({
    queryKey: ["trip-templates", category?.id],
    queryFn: async () => {
      if (!category?.id) return [];
      
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("category_id", category.id)
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      return data;
    },
    enabled: !!category?.id
  });

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
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading trips...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips?.map((trip) => (
              <button
                key={trip.id}
                onClick={() => navigate(`/trip-banner-create/${trip.id}`)}
                className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border-2 border-primary/20"
              >
                {trip.cover_thumbnail_url ? (
                  <div className="h-32 mb-4 rounded-xl overflow-hidden">
                    <img 
                      src={trip.cover_thumbnail_url} 
                      alt={trip.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="text-6xl mb-4">🏖️</div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{trip.name}</h3>
                <p className="text-white/80 text-sm">Create Achievement Banner</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
