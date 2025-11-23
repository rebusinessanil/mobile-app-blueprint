import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTemplateBackgrounds, uploadTemplateBackground, removeTemplateBackground, toggleBackgroundActive } from "@/hooks/useTemplateBackgrounds";

export default function AdminTripBackgrounds() {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

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
  const { data: trips, isLoading: tripsLoading } = useQuery({
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

  const { backgrounds, loading: backgroundsLoading } = useTemplateBackgrounds(selectedTrip || undefined);

  const handleUpload = async (slotNumber: number, file: File) => {
    if (!selectedTrip) {
      toast.error("Please select a trip first");
      return;
    }

    if (backgrounds.filter(b => b.background_image_url && b.background_image_url !== 'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-backgrounds/placeholder-background.png').length >= 16) {
      toast.error("Maximum 16 backgrounds allowed per trip");
      return;
    }

    const { error } = await uploadTemplateBackground(selectedTrip, file, slotNumber);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Background uploaded successfully");
    }
  };

  const handleRemove = async (backgroundId: string) => {
    if (!confirm("Are you sure you want to remove this background?")) return;

    const { error } = await removeTemplateBackground(backgroundId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Background removed successfully");
    }
  };

  const handleToggleActive = async (backgroundId: string, currentStatus: boolean) => {
    const { error } = await toggleBackgroundActive(backgroundId, !currentStatus);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Background ${!currentStatus ? 'activated' : 'deactivated'}`);
    }
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
        <h1 className="text-3xl font-bold">Bonanza Trip Backgrounds</h1>
        <p className="text-muted-foreground mt-2">Manage background images for trip achievement banners (16 slots per trip)</p>
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

        {/* Background Management */}
        {selectedTrip && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                Manage Backgrounds - {trips?.find(t => t.id === selectedTrip)?.name}
              </h2>
              <div className="text-sm text-muted-foreground">
                {backgrounds.filter(b => b.background_image_url && b.background_image_url !== 'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-backgrounds/placeholder-background.png').length} / 16 slots used
              </div>
            </div>

            {backgroundsLoading ? (
              <div className="text-center py-12">Loading backgrounds...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 16 }, (_, i) => i + 1).map((slotNumber) => {
                  const background = backgrounds.find(b => b.slot_number === slotNumber);
                  const hasImage = background?.background_image_url && 
                    background.background_image_url !== 'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-backgrounds/placeholder-background.png';

                  return (
                    <div
                      key={slotNumber}
                      className="border-2 border-dashed border-border rounded-lg overflow-hidden"
                    >
                      {hasImage ? (
                        <div className="relative group">
                          <img
                            src={background.background_image_url}
                            alt={`Slot ${slotNumber}`}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleActive(background.id, background.is_active || false)}
                              className="text-white hover:text-white"
                            >
                              {background.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemove(background.id)}
                              className="text-white hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                            {slotNumber}
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-32 cursor-pointer hover:bg-accent transition-colors">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground">Slot {slotNumber}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(slotNumber, file);
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
