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
  const selectedRankData = ranks.find((r) => r.id === selectedRank);

  // Category detail view with banner preview
  return (
    <AdminLayout>
      <div className="container mx-auto p-4 max-w-[480px] bg-background min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedCategory(null);
              setSelectedRank(null);
              setActiveSticker(null);
            }}
            className="rounded-2xl border-2 border-border/40"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg font-bold text-muted-foreground tracking-wider">
            BANNER PREVIEW
          </h1>
          
          <Button
            onClick={() => setIsStickersModalOpen(true)}
            variant="ghost"
            size="icon"
            className="rounded-2xl border-2 border-primary/60"
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </Button>
        </div>

        {/* Main Banner Preview */}
        <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden border-4 border-primary/80 shadow-2xl mb-4"
          style={{
            background: selectedRankData?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          {/* Top Upline Avatars */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3">
            <div className="w-14 h-14 rounded-full border-3 border-white overflow-hidden bg-muted">
              <div className="w-full h-full bg-muted-foreground/20" />
            </div>
            <div className="w-14 h-14 rounded-full border-3 border-white overflow-hidden bg-muted">
              <div className="w-full h-full bg-muted-foreground/20" />
            </div>
          </div>

          {/* Top Right Logo */}
          <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/40 border-2 border-primary/60" />

          {/* Main Content Area */}
          <div className="absolute inset-0 flex items-center justify-between px-6 pt-24 pb-20">
            {/* Left: Achiever Photo */}
            <div className="w-[45%] aspect-[3/4] rounded-3xl overflow-hidden shadow-xl bg-muted">
              <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Achiever Photo</span>
              </div>
            </div>

            {/* Right: Info Section */}
            <div className="w-[48%] flex flex-col justify-between h-full">
              {/* Name */}
              <div className="text-center mt-8">
                <h2 className="text-2xl font-bold text-white tracking-wide">
                  {selectedRankData?.name || "RANK NAME"}
                </h2>
              </div>

              {/* Profile Photo */}
              <div className="relative mb-4">
                <div className="w-32 h-40 rounded-2xl overflow-hidden ml-auto shadow-lg bg-muted-foreground/20 border-2 border-white/30">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[10px] text-white/60">Profile</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Info Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-3 flex items-center justify-between">
            <div className="text-left">
              <p className="text-[10px] text-white/80">CALL FOR MENTORSHIP</p>
              <p className="text-sm font-bold text-white">+91 7734990035</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">ADMIN PREVIEW</p>
              <p className="text-xs text-primary font-semibold">{selectedRankData?.name || "RANK"}</p>
            </div>
          </div>
        </div>

        {/* Profile Photo Selector Row */}
        <div className="flex items-center gap-3 mb-4 px-2">
          {[1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`w-14 h-14 rounded-full overflow-hidden ${
                index === 1 
                  ? 'border-3 border-primary ring-2 ring-primary/30' 
                  : 'border-2 border-border/40'
              } bg-muted cursor-pointer hover:border-primary/50 transition-all`}
            >
              <div className="w-full h-full bg-muted-foreground/20" />
            </div>
          ))}
          <Button className="ml-auto bg-teal-600 hover:bg-teal-700 h-14 px-6 rounded-xl">
            <span className="text-xs font-bold flex flex-col items-center gap-0.5">
              <span>↓</span>
              <span>DOWNLOAD</span>
            </span>
          </Button>
        </div>

        {/* Template Backgrounds Grid (16 Slots) */}
        <div className="bg-card/50 rounded-3xl p-4 border border-border/40">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 16 }, (_, i) => i + 1).map((slotNum) => {
              const isSelected = selectedSlot === slotNum;
              const bgColors = [
                'bg-gradient-to-br from-orange-400 to-pink-400',
                'bg-gradient-to-br from-blue-900 to-blue-700',
                'bg-gradient-to-br from-blue-600 to-indigo-700',
                'bg-gradient-to-br from-red-900 to-orange-800',
                'bg-gradient-to-br from-teal-700 to-teal-900',
                'bg-gradient-to-br from-purple-600 to-pink-600',
                'bg-gradient-to-br from-blue-800 to-blue-950',
                'bg-gradient-to-br from-amber-700 to-orange-900',
                'bg-gradient-to-br from-purple-800 to-indigo-900',
                'bg-gradient-to-br from-red-800 to-red-950',
                'bg-gradient-to-br from-purple-700 to-purple-900',
                'bg-gradient-to-br from-green-700 to-green-900',
                'bg-gradient-to-br from-orange-800 to-red-900',
                'bg-gradient-to-br from-blue-900 to-indigo-950',
                'bg-gradient-to-br from-pink-700 to-rose-900',
                'bg-gradient-to-br from-gray-800 to-gray-950',
              ];
              
              return (
                <button
                  key={slotNum}
                  onClick={() => setSelectedSlot(slotNum)}
                  className={`aspect-square rounded-2xl ${bgColors[slotNum - 1]} flex items-center justify-center text-white text-2xl font-bold transition-all ${
                    isSelected
                      ? 'ring-4 ring-primary scale-95 shadow-lg shadow-primary/30'
                      : 'hover:ring-2 hover:ring-primary/50'
                  }`}
                >
                  {slotNum <= 2 ? (
                    <div className="w-full h-full rounded-2xl overflow-hidden">
                      <div className="w-full h-full bg-muted-foreground/40" />
                    </div>
                  ) : (
                    <span>{slotNum}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rank & Slot Selector */}
        <Card className="mt-4 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-2 block text-muted-foreground">
                Rank
              </label>
              <Select value={selectedRank || ""} onValueChange={setSelectedRank}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select rank..." />
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
              <label className="text-xs font-medium mb-2 block text-muted-foreground">
                Slot
              </label>
              <Select
                value={selectedSlot.toString()}
                onValueChange={(val) => setSelectedSlot(parseInt(val))}
              >
                <SelectTrigger className="h-10">
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

          {/* Selected Stickers Preview */}
          {selectedAchievementStickers.length > 0 && (
            <div className="pt-3 border-t border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Selected Stickers ({selectedAchievementStickers.length}/6):
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {selectedAchievementStickers.map((stickerId) => {
                  const sticker = allStickers.find(s => s.id === stickerId);
                  if (!sticker) return null;
                  
                  return (
                    <div
                      key={stickerId}
                      className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-primary/50 shadow-sm"
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
