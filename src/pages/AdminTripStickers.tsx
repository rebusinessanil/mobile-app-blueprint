import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRankStickers } from "@/hooks/useRankStickers";

export default function AdminTripStickers() {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch Bonanza Trips category ID
  const { data: bonanzaCategory } = useQuery({
    queryKey: ["bonanza-category"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_categories")
        .select("id")
        .eq("slug", "bonanza-trips")
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch trip templates (these act as "ranks" for trips)
  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ["trip-templates", bonanzaCategory?.id],
    queryFn: async () => {
      if (!bonanzaCategory?.id) return [];
      
      const { data, error } = await supabase
        .from("templates")
        .select("id, name")
        .eq("category_id", bonanzaCategory.id)
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      return data;
    },
    enabled: !!bonanzaCategory?.id
  });

  // Fetch sticker categories
  const { data: stickerCategories } = useQuery({
    queryKey: ["sticker-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sticker_categories")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      return data;
    }
  });

  // Use template ID as rankId for sticker management
  const { stickers, uploadSticker, deleteSticker, loading } = useRankStickers(
    selectedTrip || undefined,
    selectedCategory || undefined
  );

  const handleUploadSticker = async (slotNumber: number) => {
    if (!selectedTrip || !selectedCategory) {
      toast.error("Please select both trip and sticker category");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const name = prompt("Enter sticker name:");
        if (name) {
          await uploadSticker(file, slotNumber, name);
        }
      }
    };
    input.click();
  };

  const handleDeleteSticker = async (slotNumber: number, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this sticker?")) return;
    await deleteSticker(slotNumber, imageUrl);
  };

  if (tripsLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Bonanza Trip Stickers</h1>
        <p className="text-muted-foreground mt-2">Manage stickers for trip achievement banners (16 slots per trip per category)</p>
      </div>
      
      <div className="space-y-6">
        {/* Trip Selection */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Select Trip Destination</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {trips?.map((trip) => (
              <Button
                key={trip.id}
                onClick={() => setSelectedTrip(trip.id)}
                variant={selectedTrip === trip.id ? "default" : "outline"}
                className="h-auto py-4"
              >
                {trip.name}
              </Button>
            ))}
          </div>
        </Card>

        {/* Category Selection */}
        {selectedTrip && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Select Sticker Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stickerCategories?.map((category) => (
                <Button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Sticker Slots */}
        {selectedTrip && selectedCategory && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                Manage Stickers - {trips?.find(t => t.id === selectedTrip)?.name}
              </h2>
              <div className="text-sm text-muted-foreground">
                {stickers.filter(s => s.image_url).length} / 16 slots used
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading stickers...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {stickers.map((sticker, index) => (
                  <div
                    key={index}
                    className="border-2 border-dashed border-border rounded-lg overflow-hidden"
                  >
                    {sticker.image_url ? (
                      <div className="relative group">
                        <img
                          src={sticker.image_url}
                          alt={sticker.name || `Slot ${sticker.slot_number}`}
                          className="w-full h-24 object-contain bg-muted"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSticker(sticker.slot_number!, sticker.image_url!)}
                            className="text-white hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bold">
                          {sticker.slot_number}
                        </div>
                        <div className="p-2 text-xs text-center truncate">{sticker.name}</div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUploadSticker(index + 1)}
                        className="flex flex-col items-center justify-center h-24 w-full hover:bg-accent transition-colors"
                      >
                        <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Slot {index + 1}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
