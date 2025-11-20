import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Trash2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useRankStickers, useAdminStickers } from "@/hooks/useStickers";
import { supabase } from "@/integrations/supabase/client";

interface Rank {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
}

export default function AdminRankStickers() {
  const navigate = useNavigate();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [selectedRank, setSelectedRank] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const { stickers, loading } = useRankStickers(selectedRank);
  const { uploadRankSlotSticker, deleteSticker } = useAdminStickers();

  // Fetch all ranks
  useEffect(() => {
    const fetchRanks = async () => {
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        setRanks(data);
        if (data.length > 0) {
          setSelectedRank(data[0].id);
        }
      }
    };
    fetchRanks();
  }, []);

  const handleFileUpload = async (slotNumber: number, file: File) => {
    if (!selectedRank) return;

    setUploadingSlot(slotNumber);
    const { error } = await uploadRankSlotSticker(file, selectedRank, slotNumber);

    if (error) {
      toast.error("Failed to upload sticker");
    } else {
      toast.success(`Sticker uploaded for Slot ${slotNumber}`);
      window.location.reload();
    }
    setUploadingSlot(null);
  };

  const handleDelete = async (stickerId: string, imageUrl: string, slotNumber: number) => {
    if (!confirm(`Delete sticker for Slot ${slotNumber}?`)) return;

    const { error } = await deleteSticker(stickerId, imageUrl);

    if (error) {
      toast.error("Failed to delete sticker");
    } else {
      toast.success("Sticker deleted");
      window.location.reload();
    }
  };

  const getStickerForSlot = (slotNumber: number) => {
    return stickers.find(s => s.slot_number === slotNumber);
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Achievement Stickers</h1>
            <p className="text-sm text-muted-foreground">Manage stickers by rank and slot (1-16)</p>
          </div>
        </div>
      </header>

      {/* Rank Tabs */}
      <div className="px-6 py-6">
        <Tabs value={selectedRank} onValueChange={setSelectedRank} className="w-full">
          <TabsList className="w-full flex overflow-x-auto bg-secondary/30 p-1 rounded-xl mb-6">
            {ranks.map((rank) => (
              <TabsTrigger
                key={rank.id}
                value={rank.id}
                className="flex-shrink-0 px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="mr-2">{rank.icon}</span>
                {rank.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {ranks.map((rank) => (
            <TabsContent key={rank.id} value={rank.id} className="mt-0">
              {/* Slot Grid */}
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 16 }, (_, i) => i + 1).map((slotNumber) => {
                  const sticker = getStickerForSlot(slotNumber);
                  const isUploading = uploadingSlot === slotNumber;

                  return (
                    <Card
                      key={slotNumber}
                      className="gold-border bg-card rounded-xl p-4 flex flex-col items-center gap-3"
                    >
                      <div className="text-sm font-semibold text-primary">
                        Slot {slotNumber}
                      </div>

                      {/* Preview or Upload */}
                      <div className="w-full aspect-square relative bg-secondary/20 rounded-lg overflow-hidden">
                        {sticker ? (
                          <>
                            <img
                              src={sticker.image_url}
                              alt={`Slot ${slotNumber}`}
                              className="w-full h-full object-contain"
                            />
                            <button
                              onClick={() => handleDelete(sticker.id, sticker.image_url, slotNumber)}
                              className="absolute top-2 right-2 w-8 h-8 bg-destructive/90 hover:bg-destructive rounded-lg flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </>
                        ) : (
                          <label
                            htmlFor={`upload-${slotNumber}`}
                            className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors"
                          >
                            {isUploading ? (
                              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                            ) : (
                              <>
                                <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-xs text-muted-foreground">Upload</span>
                              </>
                            )}
                          </label>
                        )}
                      </div>

                      {/* Hidden file input */}
                      <input
                        id={`upload-${slotNumber}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(slotNumber, file);
                        }}
                        disabled={isUploading}
                      />

                      {/* Replace button for existing stickers */}
                      {sticker && (
                        <label
                          htmlFor={`upload-${slotNumber}`}
                          className="w-full"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-primary text-primary hover:bg-primary/10"
                            disabled={isUploading}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Replace
                          </Button>
                        </label>
                      )}
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
