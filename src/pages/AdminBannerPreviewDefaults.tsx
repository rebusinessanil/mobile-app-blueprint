import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trophy, Calendar, Gift, Award, Sparkles, Maximize2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import StickerTransformControls from "@/components/admin/StickerTransformControls";
import RanksStickersPanel from "@/components/RanksStickersPanel";
import BannerLargePreviewModal from "@/components/admin/BannerLargePreviewModal";
import StickerPreciseControls from "@/components/admin/StickerPreciseControls";
import { useRankStickers } from "@/hooks/useRankStickers";
import { useStickers } from "@/hooks/useStickers";
import { useRealtimeStickerSync } from "@/hooks/useRealtimeStickerSync";
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
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartPos, setResizeStartPos] = useState({
    x: 0,
    y: 0,
    initialScale: 1
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({
    x: 0,
    y: 0,
    initialX: 0,
    initialY: 0
  });
  const [isRotating, setIsRotating] = useState(false);
  const [rotateStartPos, setRotateStartPos] = useState({
    x: 0,
    y: 0,
    initialRotation: 0
  });
  const [isLargePreviewOpen, setIsLargePreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Real-time sync for sticker updates
  useRealtimeStickerSync({
    categoryId: selectedCategory || undefined,
    rankId: selectedRank || undefined,
    onUpdate: () => {
      // Refetch stickers when updates occur
      if (stickers && selectedSlot) {
        const sticker = stickers.find(s => s.slot_number === selectedSlot);
        setActiveSticker(sticker || null);
      }
    }
  });
  const {
    stickers,
    loading: stickersLoading
  } = useRankStickers(selectedRank || undefined, selectedCategory || undefined);

  // Fetch all stickers to get details for selected sticker IDs
  const {
    stickers: allStickers
  } = useStickers();
  useEffect(() => {
    checkAdminStatus();
    fetchCategories();
    fetchRanks();
  }, []);
  useEffect(() => {
    if (stickers && selectedSlot) {
      const sticker = stickers.find(s => s.slot_number === selectedSlot);
      setActiveSticker(sticker || null);
    }
  }, [stickers, selectedSlot]);
  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeSticker) return;
    setIsResizing(true);
    setResizeStartPos({
      x: e.clientX,
      y: e.clientY,
      initialScale: activeSticker.scale || 1
    });
  };
  const handleResizeMove = async (e: MouseEvent) => {
    if (!isResizing || !activeSticker || !bannerRef.current) return;
    const deltaX = e.clientX - resizeStartPos.x;
    const deltaY = e.clientY - resizeStartPos.y;
    const delta = (deltaX + deltaY) / 2;
    const scaleFactor = delta / 100;
    const newScale = Math.max(0.3, Math.min(3, resizeStartPos.initialScale + scaleFactor));

    // Update sticker scale in database
    try {
      const {
        error
      } = await supabase.from("stickers").update({
        scale: newScale
      }).eq("id", activeSticker.id).eq("rank_id", selectedRank).eq("slot_number", selectedSlot);
      if (error) throw error;

      // Update local state
      setActiveSticker({
        ...activeSticker,
        scale: newScale
      });
    } catch (error) {
      console.error("Error updating sticker scale:", error);
    }
  };
  const handleResizeEnd = () => {
    setIsResizing(false);
  };
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeSticker || !bannerRef.current) return;
    setIsDragging(true);
    setDragStartPos({
      x: e.clientX,
      y: e.clientY,
      initialX: activeSticker.position_x || 50,
      initialY: activeSticker.position_y || 50
    });
  };
  const handleDragMove = async (e: MouseEvent) => {
    if (!isDragging || !activeSticker || !bannerRef.current) return;
    const bannerRect = bannerRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - dragStartPos.x) / bannerRect.width * 100;
    const deltaY = (e.clientY - dragStartPos.y) / bannerRect.height * 100;
    const newX = Math.max(5, Math.min(95, dragStartPos.initialX + deltaX));
    const newY = Math.max(5, Math.min(95, dragStartPos.initialY + deltaY));
    try {
      const {
        error
      } = await supabase.from("stickers").update({
        position_x: newX,
        position_y: newY
      }).eq("id", activeSticker.id).eq("rank_id", selectedRank).eq("slot_number", selectedSlot);
      if (error) throw error;
      setActiveSticker({
        ...activeSticker,
        position_x: newX,
        position_y: newY
      });
    } catch (error) {
      console.error("Error updating sticker position:", error);
    }
  };
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  const handleRotateStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeSticker) return;
    setIsRotating(true);
    setRotateStartPos({
      x: e.clientX,
      y: e.clientY,
      initialRotation: activeSticker.rotation || 0
    });
  };
  const handleRotateMove = async (e: MouseEvent) => {
    if (!isRotating || !activeSticker) return;
    const deltaX = e.clientX - rotateStartPos.x;
    const newRotation = (rotateStartPos.initialRotation + deltaX) % 360;
    try {
      const {
        error
      } = await supabase.from("stickers").update({
        rotation: newRotation
      }).eq("id", activeSticker.id).eq("rank_id", selectedRank).eq("slot_number", selectedSlot);
      if (error) throw error;
      setActiveSticker({
        ...activeSticker,
        rotation: newRotation
      });
    } catch (error) {
      console.error("Error updating sticker rotation:", error);
    }
  };
  const handleRotateEnd = () => {
    setIsRotating(false);
  };
  const handleSaveChanges = async () => {
    if (!activeSticker) return;
    setIsSaving(true);
    try {
      const {
        error
      } = await supabase.from("stickers").update({
        position_x: activeSticker.position_x,
        position_y: activeSticker.position_y,
        scale: activeSticker.scale,
        rotation: activeSticker.rotation
      }).eq("id", activeSticker.id);
      if (error) throw error;
      toast.success("Changes saved successfully");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };
  const handleResetChanges = async () => {
    if (!activeSticker) return;
    try {
      const {
        data,
        error
      } = await supabase.from("stickers").select("*").eq("id", activeSticker.id).single();
      if (error) throw error;
      setActiveSticker(data as Sticker);
      toast.success("Changes reset to last saved state");
    } catch (error) {
      console.error("Error resetting changes:", error);
      toast.error("Failed to reset changes");
    }
  };
  const handleDownloadBanner = () => {
    if (!bannerRef.current) return;

    // Implementation for downloading banner as high-res image
    toast.info("Download functionality will be implemented");
  };
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [isResizing, activeSticker, resizeStartPos]);
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [isDragging, activeSticker, dragStartPos]);
  useEffect(() => {
    if (isRotating) {
      window.addEventListener("mousemove", handleRotateMove);
      window.addEventListener("mouseup", handleRotateEnd);
      return () => {
        window.removeEventListener("mousemove", handleRotateMove);
        window.removeEventListener("mouseup", handleRotateEnd);
      };
    }
  }, [isRotating, activeSticker, rotateStartPos]);
  const checkAdminStatus = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    const {
      data,
      error
    } = await supabase.rpc("is_admin", {
      user_id: user.id
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
    const {
      data,
      error
    } = await supabase.from("template_categories").select("*").eq("is_active", true).order("display_order");
    if (error) {
      toast.error("Failed to fetch categories");
      return;
    }
    setCategories(data || []);
  };
  const fetchRanks = async () => {
    const {
      data,
      error
    } = await supabase.from("ranks").select("*").eq("is_active", true).order("display_order");
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
    return <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AdminLayout>;
  }

  // Category selection view
  if (!selectedCategory) {
    return <AdminLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
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
            {categories.map(category => {
            const Icon = getCategoryIcon(category.slug);
            return <Card key={category.id} className="p-6 cursor-pointer hover:bg-accent transition-colors" onClick={() => setSelectedCategory(category.id)}>
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
                </Card>;
          })}
          </div>
        </div>
      </AdminLayout>;
  }
  const selectedCategoryData = categories.find(c => c.id === selectedCategory);
  const selectedRankData = ranks.find(r => r.id === selectedRank);

  // Category detail view with banner preview
  return <AdminLayout>
      <div className="flex flex-col h-screen max-w-[480px] mx-auto bg-background">
        {/* Fixed Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 px-2">
          <Button variant="ghost" size="icon" onClick={() => {
          setSelectedCategory(null);
          setSelectedRank(null);
          setActiveSticker(null);
        }} className="rounded-2xl border-2 border-border/40">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg font-bold text-muted-foreground tracking-wider">
            BANNER PREVIEW
          </h1>
          
          <Button onClick={() => setIsStickersModalOpen(true)} variant="ghost" size="icon" className="rounded-2xl border-2 border-primary/60">
            <Sparkles className="h-5 w-5 text-primary" />
          </Button>
          
          <Button onClick={() => setIsLargePreviewOpen(true)} variant="ghost" size="icon" className="rounded-2xl border-2 border-primary/60 ml-2" title="View Large Preview">
            <Maximize2 className="h-5 w-5 text-primary" />
          </Button>
        </div>

        {/* Fixed Banner Preview */}
        <div className="flex-shrink-0 px-4 mb-4">
          <div className="border-4 border-primary rounded-3xl overflow-hidden shadow-2xl">
          <div ref={bannerRef} className="preview-banner border-4 border-primary relative w-full" style={{
            aspectRatio: '1 / 1',
            width: '100%',
            height: 'auto',
            background: selectedRankData?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}>
            <div className="absolute inset-0">
              {/* Top-Left Logo */}
              <div className="absolute z-30" style={{
                top: '3%',
                left: '3%',
                width: '15%',
                height: '8%'
              }}>
                <div className="w-full h-full bg-muted-foreground/20 rounded-lg" />
              </div>

              {/* Top-Right Logo */}
              <div className="absolute z-30" style={{
                top: '3%',
                right: '3%',
                width: '15%',
                height: '8%'
              }}>
                <div className="w-full h-full rounded-full bg-black/40 border-2 border-primary/60" />
              </div>

              {/* Top - Small circular upline avatars */}
              <div className="absolute top-[1.8%] left-1/2 -translate-x-1/2 flex gap-1.5 z-20" style={{
                transform: 'translateX(-50%) scale(1.1)'
              }}>
                <div className="w-7 h-7 rounded-full border-2 border-white overflow-hidden shadow-lg bg-muted">
                  <div className="w-full h-full bg-muted-foreground/20" />
                </div>
                <div className="w-7 h-7 rounded-full border-2 border-white overflow-hidden shadow-lg bg-muted">
                  <div className="w-full h-full bg-muted-foreground/20" />
                </div>
              </div>

              {/* LEFT - Main Achiever Photo */}
              <div className="absolute overflow-hidden rounded-2xl" style={{
                left: '3%',
                top: '12%',
                width: '40%',
                height: '63.75%'
              }}>
                <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center">
                  <span className="text-xs text-white/60">Achiever</span>
                </div>
                {/* Bottom feather fade overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              </div>

              {/* RIGHT TOP - Name Display (moved higher + rightward) */}
              <div className="absolute z-20" style={{
                top: '20%',
                right: '5%',
                width: '48%'
              }}>
                <p className="text-white font-bold tracking-widest text-center" style={{
                  fontSize: 'clamp(10px, 1.2vw, 14px)',
                  lineHeight: '1.2',
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}>
                  {selectedRankData?.name || "XCVB"}
                </p>
              </div>

              {/* RIGHT BOTTOM - Profile Photo (Mentor/User) */}
              <div className="absolute overflow-hidden rounded-2xl cursor-pointer transition-transform duration-500 ease-in-out" style={{
                bottom: '24px',
                right: '24px',
                width: '28%',
                height: '36%'
              }}>
                <div className="w-full h-full bg-muted-foreground/20 object-cover object-top flex items-center justify-center">
                  <span className="text-xs text-white/60">Profile</span>
                </div>
                {/* Bottom feather fade */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              </div>

              {/* BOTTOM LEFT - Contact Section */}
              <div className="absolute z-20" style={{
                bottom: '3.5%',
                left: '3.5%',
                width: '45%'
              }}>
                <p className="text-[8px] text-white/80 font-medium uppercase tracking-wider mb-0.5">
                  CALL FOR MENTORSHIP
                </p>
                <p className="text-white font-bold" style={{
                  fontSize: 'clamp(11px, 1.3vw, 16px)',
                  lineHeight: '1.1',
                  textShadow: '0 2px 8px rgba(0,0,0,0.6)'
                }}>
                  +91 7734990035
                </p>
              </div>

              {/* BOTTOM CENTER - User Name & Rank (10% leftward, 15% less gap) */}
              <div className="absolute bottom-[6%] left-1/2 z-20 text-center" style={{
                transform: 'translateX(-60%)',
                width: '45%'
              }}>
                <h2 className="text-white font-bold uppercase tracking-wide mb-0.5" style={{
                  fontSize: 'clamp(10px, 1.2vw, 14px)',
                  lineHeight: '1.2',
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  DILIP SINGH RATHORE
                </h2>
                <p className="text-primary font-bold uppercase tracking-widest" style={{
                  fontSize: '7px',
                  lineHeight: '1.2',
                  textShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  marginTop: '-2px'
                }}>
                  ROYAL AMBASSADOR
                </p>
              </div>
            </div>

          {/* Sticker Overlay - Positioned absolutely on banner */}
          {selectedAchievementStickers.length > 0 && selectedAchievementStickers.map(stickerId => {
              const sticker = allStickers.find(s => s.id === stickerId);
              if (!sticker) return null;

              // Get transform data from the sticker or use defaults
              const posX = sticker.position_x || 50;
              const posY = sticker.position_y || 50;
              const scale = sticker.scale || 1;
              const rotation = sticker.rotation || 0;
              return <div key={stickerId} className="absolute z-20 pointer-events-none" style={{
                left: `${posX}%`,
                top: `${posY}%`,
                transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}>
                <img src={sticker.image_url} alt={sticker.name} className="w-20 h-20 object-contain drop-shadow-lg" style={{
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
                }} />
              </div>;
            })}

          {/* Active Slot Sticker - Show the sticker from the currently selected slot */}
          {activeSticker && <div onMouseDown={handleDragStart} style={{
              left: `${activeSticker.position_x || 50}%`,
              top: `${activeSticker.position_y || 50}%`,
              transform: `translate(-50%, -50%) scale(${activeSticker.scale || 1}) rotate(${activeSticker.rotation || 0}deg)`,
              transformOrigin: 'center center'
            }} className="absolute z-30 cursor-move px-0 py-0 mx-[157px] my-[71px]">
              <img src={activeSticker.image_url} alt={activeSticker.name} className="w-24 h-24 object-contain drop-shadow-2xl pointer-events-none" style={{
                filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.4))'
              }} />
              
              {/* Selection Border */}
              <div className="absolute inset-0 border-2 border-primary border-dashed animate-pulse pointer-events-none" />
              
              {/* Rotation Handle - Top Center */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-500 border-2 border-white rounded-full cursor-grab hover:scale-125 transition-transform shadow-lg flex items-center justify-center" onMouseDown={handleRotateStart} style={{
                touchAction: 'none'
              }} title="Drag to rotate">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              
              {/* Resize Handles - 4 Corners */}
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-primary border-2 border-white rounded-full cursor-nwse-resize hover:scale-125 transition-transform shadow-lg" onMouseDown={e => handleResizeStart(e, 'tl')} style={{
                touchAction: 'none'
              }} />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary border-2 border-white rounded-full cursor-nesw-resize hover:scale-125 transition-transform shadow-lg" onMouseDown={e => handleResizeStart(e, 'tr')} style={{
                touchAction: 'none'
              }} />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-primary border-2 border-white rounded-full cursor-nesw-resize hover:scale-125 transition-transform shadow-lg" onMouseDown={e => handleResizeStart(e, 'bl')} style={{
                touchAction: 'none'
              }} />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary border-2 border-white rounded-full cursor-nwse-resize hover:scale-125 transition-transform shadow-lg" onMouseDown={e => handleResizeStart(e, 'br')} style={{
                touchAction: 'none'
              }} />
            </div>}
          </div>
        </div>
        </div>

        {/* Scrollable Slots & Controls Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {/* Template Backgrounds Grid (16 Slots) */}
          <div className="bg-card/50 rounded-3xl p-4 border border-border/40">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Background Slots (1-16)</h3>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({
              length: 16
            }, (_, i) => i + 1).map(slotNum => {
              const isSelected = selectedSlot === slotNum;
              const slotSticker = stickers?.find(s => s.slot_number === slotNum);
              const bgColors = ['bg-gradient-to-br from-orange-400 to-pink-400', 'bg-gradient-to-br from-blue-900 to-blue-700', 'bg-gradient-to-br from-blue-600 to-indigo-700', 'bg-gradient-to-br from-red-900 to-orange-800', 'bg-gradient-to-br from-teal-700 to-teal-900', 'bg-gradient-to-br from-purple-600 to-pink-600', 'bg-gradient-to-br from-blue-800 to-blue-950', 'bg-gradient-to-br from-amber-700 to-orange-900', 'bg-gradient-to-br from-purple-800 to-indigo-900', 'bg-gradient-to-br from-red-800 to-red-950', 'bg-gradient-to-br from-purple-700 to-purple-900', 'bg-gradient-to-br from-green-700 to-green-900', 'bg-gradient-to-br from-orange-800 to-red-900', 'bg-gradient-to-br from-blue-900 to-indigo-950', 'bg-gradient-to-br from-pink-700 to-rose-900', 'bg-gradient-to-br from-gray-800 to-gray-950'];
              return <button key={slotNum} onClick={() => setSelectedSlot(slotNum)} className={`relative aspect-square rounded-2xl ${bgColors[slotNum - 1]} flex items-center justify-center text-white transition-all ${isSelected ? 'ring-4 ring-primary scale-95 shadow-lg shadow-primary/30' : 'hover:ring-2 hover:ring-primary/50'}`}>
                    {slotSticker ? <div className="w-full h-full rounded-2xl overflow-hidden p-1">
                        <img src={slotSticker.image_url} alt={`Slot ${slotNum}`} className="w-full h-full object-contain" />
                      </div> : <span className="text-2xl font-bold">{slotNum}</span>}
                    {isSelected && <div className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full border-2 border-white" />}
                  </button>;
            })}
            </div>
          </div>

          {/* Rank & Slot Selector */}
          <Card className="p-4 space-y-4">
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
                  {ranks.map(rank => <SelectItem key={rank.id} value={rank.id}>
                      {rank.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-2 block text-muted-foreground">
                Slot
              </label>
              <Select value={selectedSlot.toString()} onValueChange={val => setSelectedSlot(parseInt(val))}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({
                    length: 16
                  }, (_, i) => i + 1).map(slot => <SelectItem key={slot} value={slot.toString()}>
                      Slot {slot}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Stickers Preview */}
          {selectedAchievementStickers.length > 0 && <div className="pt-3 border-t border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Selected Stickers ({selectedAchievementStickers.length}/6):
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {selectedAchievementStickers.map(stickerId => {
                const sticker = allStickers.find(s => s.id === stickerId);
                if (!sticker) return null;
                return <div key={stickerId} className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-primary/50 shadow-sm" title={sticker.name}>
                      <img src={sticker.image_url} alt={sticker.name} className="w-full h-full object-cover" />
                    </div>;
              })}
              </div>
            </div>}
        </Card>

          {/* Precise Transform Controls */}
          {activeSticker && <StickerPreciseControls position={{
          x: activeSticker.position_x || 0,
          y: activeSticker.position_y || 0
        }} scale={activeSticker.scale || 1} rotation={activeSticker.rotation || 0} onPositionChange={async (x, y) => {
          if (!activeSticker?.id) {
            toast.error("No sticker selected. Please upload a sticker for this slot first.");
            return;
          }
          try {
            const {
              error
            } = await supabase.from("stickers").update({
              position_x: x,
              position_y: y
            }).eq("id", activeSticker.id);
            if (error) throw error;
            setActiveSticker({
              ...activeSticker,
              position_x: x,
              position_y: y
            });
          } catch (error) {
            console.error("Error updating position:", error);
            toast.error("Failed to update position");
          }
        }} onScaleChange={async scale => {
          if (!activeSticker?.id) {
            toast.error("No sticker selected. Please upload a sticker for this slot first.");
            return;
          }
          try {
            const {
              error
            } = await supabase.from("stickers").update({
              scale
            }).eq("id", activeSticker.id);
            if (error) throw error;
            setActiveSticker({
              ...activeSticker,
              scale
            });
          } catch (error) {
            console.error("Error updating scale:", error);
            toast.error("Failed to update scale");
          }
        }} onRotationChange={async rotation => {
          if (!activeSticker?.id) {
            toast.error("No sticker selected. Please upload a sticker for this slot first.");
            return;
          }
          try {
            const {
              error
            } = await supabase.from("stickers").update({
              rotation
            }).eq("id", activeSticker.id);
            if (error) throw error;
            setActiveSticker({
              ...activeSticker,
              rotation
            });
          } catch (error) {
            console.error("Error updating rotation:", error);
            toast.error("Failed to update rotation");
          }
        }} onSave={handleSaveChanges} onReset={handleResetChanges} isSaving={isSaving} />}
        </div>

        {/* Rank Stickers Selection Modal */}
        {selectedRank && <RanksStickersPanel isOpen={isStickersModalOpen} onClose={() => setIsStickersModalOpen(false)} currentSlot={selectedSlot} rankName={ranks.find(r => r.id === selectedRank)?.name || ""} selectedStickers={selectedAchievementStickers} onStickersChange={setSelectedAchievementStickers} />}

        {/* Large Preview Modal */}
        <BannerLargePreviewModal isOpen={isLargePreviewOpen} onClose={() => setIsLargePreviewOpen(false)} bannerContent={<div className="relative w-[480px] aspect-[3/4] rounded-3xl overflow-hidden border-4 border-primary/80 shadow-2xl" style={{
        background: selectedRankData?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
              {/* Duplicate banner preview content for modal */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                <div className="w-14 h-14 rounded-full border-3 border-white overflow-hidden bg-muted">
                  <div className="w-full h-full bg-muted-foreground/20" />
                </div>
                <div className="w-14 h-14 rounded-full border-3 border-white overflow-hidden bg-muted">
                  <div className="w-full h-full bg-muted-foreground/20" />
                </div>
              </div>

              <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/40 border-2 border-primary/60 z-10" />

              <div className="absolute top-20 left-4 w-32 h-40 rounded-2xl bg-black/40 border-3 border-white/60 overflow-hidden">
                <div className="w-full h-full bg-muted-foreground/20" />
              </div>

              <div className="absolute bottom-24 right-4 w-24 h-28 rounded-2xl bg-black/40 border-3 border-white/60 overflow-hidden">
                <div className="w-full h-full bg-muted-foreground/20" />
              </div>

              {activeSticker && <div className="absolute pointer-events-none" style={{
          left: `${activeSticker.position_x || 50}%`,
          top: `${activeSticker.position_y || 50}%`,
          transform: `translate(-50%, -50%) scale(${activeSticker.scale || 1}) rotate(${activeSticker.rotation || 0}deg)`,
          width: '120px',
          height: '120px'
        }}>
                  <img src={activeSticker.image_url} alt={activeSticker.name} className="w-full h-full object-contain" />
                </div>}

              <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-3 flex items-center justify-between z-10">
                <div className="text-left">
                  <p className="text-[10px] text-white/80">CALL FOR MENTORSHIP</p>
                  <p className="text-sm font-bold text-white">+91 7734990035</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">FULL SIZE PREVIEW</p>
                  <p className="text-xs text-primary font-semibold">{selectedRankData?.name || "RANK"}</p>
                </div>
              </div>
            </div>} onDownload={handleDownloadBanner} />
      </div>
    </AdminLayout>;
}