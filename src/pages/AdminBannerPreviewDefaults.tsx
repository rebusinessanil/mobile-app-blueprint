import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Trophy, Calendar, Gift, Award, Sparkles } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import StickerTransformControls from "@/components/admin/StickerTransformControls";
import RanksStickersPanel from "@/components/RanksStickersPanel";
import { useRankStickers } from "@/hooks/useRankStickers";
import { useStickers } from "@/hooks/useStickers";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface Rank {
  id: string;
  name: string;
  gradient: string;
  icon: string;
}

interface Sticker {
  id: string;
  name: string;
  image_url: string;
  slot_number: number;
  position_x?: number;
  position_y?: number;
  scale?: number;
  rotation?: number;
}

export default function AdminBannerPreviewDefaults() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRank, setSelectedRank] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [activeSticker, setActiveSticker] = useState<Sticker | null>(null);
  const [isStickersModalOpen, setIsStickersModalOpen] = useState(false);
  const [selectedAchievementStickers, setSelectedAchievementStickers] = useState<string[]>([]);

  const { stickers, loading: stickersLoading } = useRankStickers(
    selectedRank || undefined,
    selectedCategory || undefined
  );

  // Fetch all stickers to get details for selected sticker IDs
  const { stickers: allStickers } = useStickers();

  useEffect(() => {
    checkAdminStatus();
    fetchCategories();
    fetchRanks();
  }, []);

  useEffect(() => {
    if (stickers && selectedSlot) {
      const sticker = stickers.find((s) => s.slot_number === selectedSlot);
      setActiveSticker(sticker || null);
    }
  }, [stickers, selectedSlot]);

  const checkAdminStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase.rpc("is_admin", {
      user_id: user.id,
    });

    if (error || !data) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("template_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    if (error) {
      toast.error("Failed to fetch categories");
      return;
    }

    setCategories(data || []);
  };

  const fetchRanks = async () => {
    const { data, error } = await supabase
      .from("ranks")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    if (error) {
      toast.error("Failed to fetch ranks");
      return;
    }

    setRanks(data || []);
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "rank-promotion":
        return Trophy;
      case "trips":
        return Gift;
      case "birthday":
        return Calendar;
      default:
        return Award;
    }
  };

  if (loading || !isAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  // Category selection view
  if (!selectedCategory) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Banner Preview Defaults</h1>
              <p className="text-muted-foreground">
                Manage sticker positions and settings for all banner categories
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.slug);
              return (
                <Card
                  key={category.id}
                  className="p-6 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage {category.name.toLowerCase()} stickers
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  // Category detail view with sticker editing
  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedCategory(null);
              setSelectedRank(null);
              setActiveSticker(null);
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {selectedCategoryData?.name} - Sticker Management
            </h1>
            <p className="text-muted-foreground">
              Configure sticker positions for this category
            </p>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Rank
              </label>
              <Select value={selectedRank || ""} onValueChange={setSelectedRank}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a rank..." />
                </SelectTrigger>
                <SelectContent>
                  {ranks.map((rank) => (
                    <SelectItem key={rank.id} value={rank.id}>
                      {rank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Sticker Slot (1-16)
              </label>
              <Select
                value={selectedSlot.toString()}
                onValueChange={(val) => setSelectedSlot(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((slot) => (
                    <SelectItem key={slot} value={slot.toString()}>
                      Slot {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedRank && selectedCategory && (
            <div className="pt-4 border-t space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">
                    Currently editing:{" "}
                    <span className="text-primary">
                      {ranks.find((r) => r.id === selectedRank)?.name} -{" "}
                      {selectedCategoryData?.name} - Slot {selectedSlot}
                    </span>
                  </p>
                  <Button
                    onClick={() => setIsStickersModalOpen(true)}
                    className="gap-2"
                    variant="outline"
                  >
                    <Sparkles className="w-4 h-4" />
                    Select Stickers
                  </Button>
                </div>
                
                {/* Selected Stickers Preview */}
                {selectedAchievementStickers.length > 0 && (
                  <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                    <span className="text-xs text-muted-foreground font-medium">
                      Selected ({selectedAchievementStickers.length}):
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {selectedAchievementStickers.map((stickerId) => {
                        const sticker = allStickers.find(s => s.id === stickerId);
                        if (!sticker) return null;
                        
                        return (
                          <div
                            key={stickerId}
                            className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-primary/50 shadow-sm"
                            title={sticker.name}
                          >
                            <img
                              src={sticker.image_url}
                              alt={sticker.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {activeSticker ? (
                <StickerTransformControls
                  stickerId={activeSticker.id}
                  imageUrl={activeSticker.image_url}
                  rankId={selectedRank}
                  categoryId={selectedCategory}
                  slotNumber={selectedSlot}
                  initialTransform={{
                    position_x: activeSticker.position_x || 50,
                    position_y: activeSticker.position_y || 50,
                    scale: activeSticker.scale || 1,
                    rotation: activeSticker.rotation || 0,
                  }}
                  onTransformChange={(transform) => {
                    console.log("Transform changed:", transform);
                  }}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sticker uploaded for this slot yet.</p>
                  <p className="text-sm mt-2">
                    Upload a sticker in the Rank Stickers section first.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Rank Stickers Selection Modal */}
        {selectedRank && (
          <RanksStickersPanel
            isOpen={isStickersModalOpen}
            onClose={() => setIsStickersModalOpen(false)}
            currentSlot={selectedSlot}
            rankName={ranks.find((r) => r.id === selectedRank)?.name || ""}
            selectedStickers={selectedAchievementStickers}
            onStickersChange={setSelectedAchievementStickers}
          />
        )}
      </div>
    </AdminLayout>
  );
}
