import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Upload,
  Save,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  Check,
  X,
  Trophy,
  Gift,
  Calendar,
  Star,
  Zap,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminGuard } from "@/components/AdminGuard";
import { cn } from "@/lib/utils";

// Icon mapping for template categories
const categoryIcons: Record<string, React.ReactNode> = {
  'Trophy': <Trophy className="w-4 h-4" />,
  'Gift': <Gift className="w-4 h-4" />,
  'Calendar': <Calendar className="w-4 h-4" />,
  'Star': <Star className="w-4 h-4" />,
  'Zap': <Zap className="w-4 h-4" />,
};

interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  display_order: number;
}

interface StickerCategory {
  id: string;
  name: string;
  description: string | null;
}

interface CategoryItem {
  id: string;
  name: string;
  image_url?: string;
}

interface Sticker {
  id: string;
  name: string;
  image_url: string;
  rank_id: string | null;
  trip_id: string | null;
  birthday_id: string | null;
  anniversary_id: string | null;
  motivational_banner_id: string | null;
  category_id: string | null;
  banner_category: string | null;
  slot_number: number | null;
  position_x: number;
  position_y: number;
  scale: number;
  rotation: number;
  is_active: boolean;
}

interface SlotState {
  sticker: Sticker | null;
  pendingFile: File | null;
  pendingPreview: string | null;
  pendingName: string;
  isUploading: boolean;
}

export default function AdminStickerLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBannerCategory, setSelectedBannerCategory] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<CategoryItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [slotStates, setSlotStates] = useState<Record<number, SlotState>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs for file inputs per slot
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  
  // Transform controls for selected slot
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [scale, setScale] = useState(2.5);
  const [rotation, setRotation] = useState(0);

  // Fetch sticker categories
  const { data: categories = [] } = useQuery<StickerCategory[]>({
    queryKey: ['sticker-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sticker_categories')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch banner categories (template categories)
  const { data: bannerCategories = [] } = useQuery<TemplateCategory[]>({
    queryKey: ['template-categories-for-stickers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_categories')
        .select('id, name, slug, icon_name, display_order')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch items based on selected banner category
  const { data: categoryItems = [] } = useQuery<CategoryItem[]>({
    queryKey: ['category-items', selectedBannerCategory],
    queryFn: async () => {
      if (!selectedBannerCategory) return [];

      switch (selectedBannerCategory) {
        case 'rank-promotion': {
          const { data, error } = await supabase
            .from('ranks')
            .select('id, name, icon')
            .eq('is_active', true)
            .order('display_order');
          if (error) throw error;
          return (data || []).map(r => ({ id: r.id, name: r.name, image_url: r.icon }));
        }
        case 'bonanza-promotion': {
          const { data, error } = await supabase
            .from('bonanza_trips')
            .select('id, title, trip_image_url')
            .eq('is_active', true)
            .order('display_order');
          if (error) throw error;
          return (data || []).map(t => ({ id: t.id, name: t.title, image_url: t.trip_image_url }));
        }
        case 'birthday': {
          const { data, error } = await supabase
            .from('Birthday')
            .select('id, title, Birthday_image_url')
            .eq('is_active', true)
            .order('display_order');
          if (error) throw error;
          return (data || []).map(b => ({ id: b.id, name: b.title, image_url: b.Birthday_image_url }));
        }
        case 'anniversary': {
          const { data, error } = await supabase
            .from('Anniversary')
            .select('id, title, Anniversary_image_url')
            .eq('is_active', true)
            .order('display_order');
          if (error) throw error;
          return (data || []).map(a => ({ id: a.id, name: a.title, image_url: a.Anniversary_image_url }));
        }
        case 'motivational': {
          const { data, error } = await supabase
            .from('Motivational Banner')
            .select('id, title, Motivational_image_url')
            .eq('is_active', true)
            .order('display_order');
          if (error) throw error;
          return (data || []).map(m => ({ id: m.id, name: m.title, image_url: m.Motivational_image_url }));
        }
        default:
          return [];
      }
    },
    enabled: !!selectedBannerCategory
  });

  // Clear selected item when banner category changes
  useEffect(() => {
    setSelectedItem(null);
    setSelectedSlot(null);
  }, [selectedBannerCategory]);

  // Helper function to get the correct ID column based on banner category
  const getItemIdColumn = (bannerCategory: string): string => {
    switch (bannerCategory) {
      case 'rank-promotion': return 'rank_id';
      case 'bonanza-promotion': return 'trip_id';
      case 'birthday': return 'birthday_id';
      case 'anniversary': return 'anniversary_id';
      case 'motivational': return 'motivational_banner_id';
      default: return 'rank_id';
    }
  };

  // Helper function to build insert data with correct ID column
  const getItemIdData = (bannerCategory: string, itemId: string): Record<string, string | null> => {
    const columns = {
      rank_id: null as string | null,
      trip_id: null as string | null,
      birthday_id: null as string | null,
      anniversary_id: null as string | null,
      motivational_banner_id: null as string | null,
    };
    
    switch (bannerCategory) {
      case 'rank-promotion': columns.rank_id = itemId; break;
      case 'bonanza-promotion': columns.trip_id = itemId; break;
      case 'birthday': columns.birthday_id = itemId; break;
      case 'anniversary': columns.anniversary_id = itemId; break;
      case 'motivational': columns.motivational_banner_id = itemId; break;
    }
    
    return columns;
  };

  // Fetch all stickers for selected category + banner category + item
  const { data: stickers = [], refetch: refetchStickers } = useQuery<Sticker[]>({
    queryKey: ['stickers-all', selectedCategory, selectedBannerCategory, selectedItem?.id],
    queryFn: async () => {
      if (!selectedCategory || !selectedBannerCategory || !selectedItem) return [];

      let query = supabase
        .from('stickers')
        .select('*')
        .eq('category_id', selectedCategory)
        .eq('banner_category', selectedBannerCategory);
      
      // Apply the correct filter based on banner category
      switch (selectedBannerCategory) {
        case 'rank-promotion':
          query = query.eq('rank_id', selectedItem.id);
          break;
        case 'bonanza-promotion':
          query = query.eq('trip_id', selectedItem.id);
          break;
        case 'birthday':
          query = query.eq('birthday_id', selectedItem.id);
          break;
        case 'anniversary':
          query = query.eq('anniversary_id', selectedItem.id);
          break;
        case 'motivational':
          query = query.eq('motivational_banner_id', selectedItem.id);
          break;
      }
      
      const { data, error } = await query.order('slot_number');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCategory && !!selectedBannerCategory && !!selectedItem
  });

  // Real-time subscription for stickers
  useEffect(() => {
    if (!selectedCategory || !selectedBannerCategory || !selectedItem) return;

    const channel = supabase
      .channel(`stickers-library-${selectedItem.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stickers',
        },
        (payload) => {
          console.log('Sticker changed:', payload);
          refetchStickers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategory, selectedBannerCategory, selectedItem?.id, refetchStickers]);

  // Initialize slot states when stickers load
  useEffect(() => {
    const newSlotStates: Record<number, SlotState> = {};
    for (let i = 1; i <= 16; i++) {
      const existingSticker = stickers.find(s => s.slot_number === i);
      newSlotStates[i] = {
        sticker: existingSticker || null,
        pendingFile: null,
        pendingPreview: null,
        pendingName: '',
        isUploading: false
      };
    }
    setSlotStates(newSlotStates);
  }, [stickers]);

  // Update transform controls when selected slot changes
  useEffect(() => {
    if (selectedSlot === null) return;
    const slotState = slotStates[selectedSlot];
    if (slotState?.sticker) {
      setPosition({ x: slotState.sticker.position_x, y: slotState.sticker.position_y });
      setScale(slotState.sticker.scale);
      setRotation(slotState.sticker.rotation);
    } else {
      setPosition({ x: 50, y: 50 });
      setScale(2.5);
      setRotation(0);
    }
  }, [selectedSlot, slotStates]);

  // Handle slot click - opens file picker immediately
  const handleSlotClick = (slotNum: number) => {
    setSelectedSlot(slotNum);
    const slotState = slotStates[slotNum];
    if (!slotState?.sticker && !slotState?.pendingFile) {
      fileInputRefs.current[slotNum]?.click();
    }
  };

  // Handle file selection for a specific slot
  const handleFileSelect = (slotNumber: number, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    const name = file.name.replace(/\.[^/.]+$/, "");
    
    setSlotStates(prev => ({
      ...prev,
      [slotNumber]: {
        ...prev[slotNumber],
        pendingFile: file,
        pendingPreview: previewUrl,
        pendingName: name
      }
    }));
    
    setSelectedSlot(slotNumber);
    toast.info(`File ready for Slot ${slotNumber}. Click "Confirm Upload" to save.`);
  };

  // Confirm upload for a specific slot
  const handleConfirmUpload = async (slotNumber: number) => {
    const slotState = slotStates[slotNumber];
    if (!slotState?.pendingFile || !selectedCategory || !selectedBannerCategory || !selectedItem) {
      toast.error("No file to upload or missing selection");
      return;
    }

    setSlotStates(prev => ({
      ...prev,
      [slotNumber]: { ...prev[slotNumber], isUploading: true }
    }));

    try {
      const fileExt = slotState.pendingFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedCategory}/${selectedBannerCategory}/${selectedItem.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stickers')
        .upload(filePath, slotState.pendingFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('stickers')
        .getPublicUrl(filePath);

      const existingSticker = slotState.sticker;
      
      if (existingSticker) {
        const { error: updateError } = await supabase
          .from('stickers')
          .update({
            name: slotState.pendingName || `Sticker ${slotNumber}`,
            image_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSticker.id);

        if (updateError) throw updateError;

        const oldPath = existingSticker.image_url.split('/stickers/')[1];
        if (oldPath) {
          await supabase.storage.from('stickers').remove([oldPath]);
        }
      } else {
        const itemIdData = getItemIdData(selectedBannerCategory, selectedItem.id);
        
        const { error: insertError } = await supabase
          .from('stickers')
          .insert({
            name: slotState.pendingName || `Sticker ${slotNumber}`,
            image_url: publicUrl,
            category_id: selectedCategory,
            banner_category: selectedBannerCategory,
            ...itemIdData,
            slot_number: slotNumber,
            position_x: 50,
            position_y: 50,
            scale: 2.5,
            rotation: 0,
            is_active: false,
          });

        if (insertError) throw insertError;
      }

      toast.success(`Sticker uploaded to Slot ${slotNumber}!`);
      
      if (slotState.pendingPreview) {
        URL.revokeObjectURL(slotState.pendingPreview);
      }
      
      setSlotStates(prev => ({
        ...prev,
        [slotNumber]: {
          ...prev[slotNumber],
          pendingFile: null,
          pendingPreview: null,
          pendingName: '',
          isUploading: false
        }
      }));
      
      refetchStickers();
      
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Slot ${slotNumber}: ${error?.message || 'Failed to upload sticker'}`);
      setSlotStates(prev => ({
        ...prev,
        [slotNumber]: { ...prev[slotNumber], isUploading: false }
      }));
    }
  };

  // Cancel pending upload
  const handleCancelUpload = (slotNumber: number) => {
    const slotState = slotStates[slotNumber];
    if (slotState?.pendingPreview) {
      URL.revokeObjectURL(slotState.pendingPreview);
    }
    
    setSlotStates(prev => ({
      ...prev,
      [slotNumber]: {
        ...prev[slotNumber],
        pendingFile: null,
        pendingPreview: null,
        pendingName: ''
      }
    }));
    toast.info("Upload cancelled");
  };

  // Activate/deactivate sticker
  const handleToggleActive = async (slotNumber: number) => {
    const slotState = slotStates[slotNumber];
    if (!slotState?.sticker) return;

    try {
      const newActiveState = !slotState.sticker.is_active;
      const { error } = await supabase
        .from('stickers')
        .update({ is_active: newActiveState })
        .eq('id', slotState.sticker.id);

      if (error) throw error;

      toast.success(`Sticker ${newActiveState ? 'activated' : 'deactivated'}`);
      refetchStickers();
    } catch (error) {
      console.error("Toggle error:", error);
      toast.error("Failed to update sticker status");
    }
  };

  // Save transform settings
  const handleSaveTransform = async () => {
    if (selectedSlot === null) return;
    const slotState = slotStates[selectedSlot];
    if (!slotState?.sticker) {
      toast.error("No sticker to save");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('stickers')
        .update({
          position_x: position.x,
          position_y: position.y,
          scale: scale,
          rotation: rotation,
        })
        .eq('id', slotState.sticker.id);

      if (error) throw error;

      toast.success("Sticker position saved!");
      refetchStickers();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save sticker position");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete sticker
  const handleDelete = async (slotNumber: number) => {
    const slotState = slotStates[slotNumber];
    if (!slotState?.sticker) return;

    if (!confirm("Are you sure you want to delete this sticker?")) return;

    try {
      const urlPath = slotState.sticker.image_url.split('/stickers/')[1];
      if (urlPath) {
        await supabase.storage.from('stickers').remove([urlPath]);
      }

      const { error } = await supabase
        .from('stickers')
        .delete()
        .eq('id', slotState.sticker.id);

      if (error) throw error;

      toast.success("Sticker deleted!");
      refetchStickers();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete sticker");
    }
  };

  // Reset transform to saved values
  const handleReset = () => {
    if (selectedSlot === null) return;
    const slotState = slotStates[selectedSlot];
    if (slotState?.sticker) {
      setPosition({ x: slotState.sticker.position_x, y: slotState.sticker.position_y });
      setScale(slotState.sticker.scale);
      setRotation(slotState.sticker.rotation);
      toast.info("Reset to saved values");
    }
  };

  const currentSlotState = selectedSlot !== null ? slotStates[selectedSlot] : null;
  const currentSticker = currentSlotState?.sticker;
  const hasPending = currentSlotState?.pendingFile;

  const getBannerCategoryLabel = () => {
    switch (selectedBannerCategory) {
      case 'rank-promotion': return 'Ranks';
      case 'bonanza-promotion': return 'Trips';
      case 'birthday': return 'Birthday Templates';
      case 'anniversary': return 'Anniversary Templates';
      case 'motivational': return 'Motivational Templates';
      default: return 'Items';
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Sticker Library</h1>
              <p className="text-muted-foreground mt-2">
                Select a category, then choose a template to manage its stickers
              </p>
            </div>
          </div>

          {/* Selection Controls */}
          <Card className="bg-card border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Sticker Category</Label>
                  <Select value={selectedCategory} onValueChange={(val) => {
                    setSelectedCategory(val);
                    setSelectedSlot(null);
                  }}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Banner Category</Label>
                  <Select value={selectedBannerCategory} onValueChange={(val) => {
                    setSelectedBannerCategory(val);
                    setSelectedSlot(null);
                  }}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border">
                      {bannerCategories.map((cat) => (
                        <SelectItem key={cat.slug} value={cat.slug}>
                          <div className="flex items-center gap-2">
                            {cat.icon_name && categoryIcons[cat.icon_name]}
                            <span>{cat.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Show item grid when banner category selected but no item selected */}
          {selectedCategory && selectedBannerCategory && !selectedItem && (
            <Card className="bg-card border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  {selectedBannerCategory && categoryIcons[bannerCategories.find(c => c.slug === selectedBannerCategory)?.icon_name || '']}
                  Select {getBannerCategoryLabel()}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click on any box to manage stickers for that template
                </p>
              </CardHeader>
              <CardContent>
                {categoryItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No items found for this category</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="group cursor-pointer rounded-xl border-2 border-primary/20 hover:border-primary/60 bg-gradient-to-br from-background to-muted/30 p-3 transition-all hover:shadow-lg hover:shadow-primary/10"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted/50 mb-2 flex items-center justify-center">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <Trophy className="w-10 h-10 text-primary/40" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-center truncate text-foreground">
                          {item.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Show sticker slots when item is selected */}
          {selectedCategory && selectedBannerCategory && selectedItem && (
            <>
              {/* Back Button */}
              <Button 
                variant="outline" 
                onClick={() => setSelectedItem(null)}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to {getBannerCategoryLabel()}
              </Button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Slots Grid */}
                <div className="lg:col-span-2">
                  <Card className="bg-card border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-primary flex items-center gap-3">
                        {selectedItem.image_url && (
                          <img src={selectedItem.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        {selectedItem.name} - Sticker Slots (1-16)
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Click any slot to upload a sticker to that specific slot
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-3">
                        {Array.from({ length: 16 }, (_, i) => i + 1).map((slotNum) => {
                          const slotState = slotStates[slotNum];
                          const hasSticker = !!slotState?.sticker;
                          const hasPendingUpload = !!slotState?.pendingFile;
                          const isSelected = selectedSlot === slotNum;
                          const isUploading = slotState?.isUploading;
                          const isActive = slotState?.sticker?.is_active;

                          const imageUrl = hasPendingUpload 
                            ? slotState.pendingPreview 
                            : slotState?.sticker?.image_url;

                          return (
                            <div
                              key={slotNum}
                              className={cn(
                                "relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer transition-all group",
                                isSelected 
                                  ? "border-primary ring-2 ring-primary/50" 
                                  : hasSticker || hasPendingUpload
                                    ? "border-primary/40 hover:border-primary/60"
                                    : "border-dashed border-muted-foreground/30 hover:border-primary/40",
                                hasPendingUpload && "ring-2 ring-yellow-500/50",
                                hasSticker && isActive && "ring-2 ring-green-500/30"
                              )}
                              onClick={() => handleSlotClick(slotNum)}
                            >
                              {/* Slot Number Badge */}
                              <div className="absolute top-1 left-1 z-10 bg-background/90 px-1.5 py-0.5 rounded text-xs font-bold">
                                {slotNum}
                              </div>

                              {/* Status Badge */}
                              {hasPendingUpload && (
                                <div className="absolute top-1 right-1 z-10 bg-yellow-500 px-1.5 py-0.5 rounded text-xs font-bold text-black">
                                  Pending
                                </div>
                              )}
                              {hasSticker && !hasPendingUpload && (
                                <div className={cn(
                                  "absolute top-1 right-1 z-10 px-1.5 py-0.5 rounded text-xs font-bold",
                                  isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                                )}>
                                  {isActive ? 'Active' : 'Inactive'}
                                </div>
                              )}

                              {/* Image Preview */}
                              {imageUrl ? (
                                <div className="absolute inset-0 flex items-center justify-center p-2 bg-gradient-to-br from-gray-900/50 to-gray-800/50">
                                  <img
                                    src={imageUrl}
                                    alt={`Slot ${slotNum}`}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 group-hover:bg-primary/5 transition-colors">
                                  <Upload className="w-6 h-6 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                                  <span className="text-xs text-muted-foreground/50 group-hover:text-primary/60">Click</span>
                                </div>
                              )}

                              {/* Hidden File Input */}
                              <input
                                ref={(el) => { fileInputRefs.current[slotNum] = el; }}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleFileSelect(slotNum, e.target.files[0]);
                                  }
                                  e.target.value = '';
                                }}
                                disabled={isUploading}
                              />

                              {/* Loading Overlay */}
                              {isUploading && (
                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-30">
                                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Controls Panel */}
                <div className="lg:col-span-1 space-y-4">
                  {selectedSlot !== null ? (
                    <Card className="bg-card border-2 border-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-primary">Slot {selectedSlot}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Pending Upload Actions */}
                        {hasPending && (
                          <div className="space-y-3">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted/50">
                              <img 
                                src={currentSlotState?.pendingPreview || ''} 
                                alt="Preview" 
                                className="w-full h-full object-contain" 
                              />
                            </div>
                            <Input
                              placeholder="Sticker name"
                              value={currentSlotState?.pendingName || ''}
                              onChange={(e) => {
                                setSlotStates(prev => ({
                                  ...prev,
                                  [selectedSlot]: { ...prev[selectedSlot], pendingName: e.target.value }
                                }));
                              }}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleConfirmUpload(selectedSlot)}
                                disabled={currentSlotState?.isUploading}
                                className="flex-1"
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Confirm
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleCancelUpload(selectedSlot)}
                                disabled={currentSlotState?.isUploading}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Existing Sticker Controls */}
                        {currentSticker && !hasPending && (
                          <div className="space-y-4">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted/50">
                              <img 
                                src={currentSticker.image_url} 
                                alt={currentSticker.name} 
                                className="w-full h-full object-contain" 
                              />
                            </div>
                            
                            <p className="text-sm font-medium">{currentSticker.name}</p>

                            {/* Activate/Deactivate */}
                            <Button
                              variant={currentSticker.is_active ? "destructive" : "default"}
                              onClick={() => handleToggleActive(selectedSlot)}
                              className="w-full"
                            >
                              {currentSticker.is_active ? 'Deactivate Sticker' : 'Activate Sticker'}
                            </Button>

                            {/* Transform Controls */}
                            <div className="space-y-3 pt-2 border-t border-border">
                              <Label className="text-xs text-muted-foreground">Position X: {position.x}%</Label>
                              <Slider
                                value={[position.x]}
                                onValueChange={([val]) => setPosition(p => ({ ...p, x: val }))}
                                min={0}
                                max={100}
                                step={1}
                              />
                              <Label className="text-xs text-muted-foreground">Position Y: {position.y}%</Label>
                              <Slider
                                value={[position.y]}
                                onValueChange={([val]) => setPosition(p => ({ ...p, y: val }))}
                                min={0}
                                max={100}
                                step={1}
                              />
                              <Label className="text-xs text-muted-foreground">Scale: {scale.toFixed(1)}x</Label>
                              <Slider
                                value={[scale]}
                                onValueChange={([val]) => setScale(val)}
                                min={0.5}
                                max={5}
                                step={0.1}
                              />
                              <Label className="text-xs text-muted-foreground">Rotation: {rotation}°</Label>
                              <Slider
                                value={[rotation]}
                                onValueChange={([val]) => setRotation(val)}
                                min={-180}
                                max={180}
                                step={1}
                              />
                            </div>

                            {/* Save/Reset/Delete */}
                            <div className="flex gap-2">
                              <Button onClick={handleSaveTransform} disabled={isSaving} className="flex-1">
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </Button>
                              <Button variant="outline" onClick={handleReset}>
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button variant="destructive" onClick={() => handleDelete(selectedSlot)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Replace Sticker */}
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => fileInputRefs.current[selectedSlot]?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Replace Sticker
                            </Button>
                          </div>
                        )}

                        {/* Empty Slot */}
                        {!currentSticker && !hasPending && (
                          <div className="text-center py-6 text-muted-foreground">
                            <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Click the slot or upload a sticker</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-card border-2 border-dashed border-muted-foreground/30">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <p>Select a slot to manage</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Preview on Template */}
                  {currentSticker && (
                    <Card className="bg-card border-2 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-primary">Preview Position</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 border border-border">
                          <img
                            src={currentSticker.image_url}
                            alt="Preview"
                            className="absolute"
                            style={{
                              left: `${position.x}%`,
                              top: `${position.y}%`,
                              transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
                              transformOrigin: 'center',
                              maxWidth: '100px',
                              maxHeight: '100px',
                              objectFit: 'contain',
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}

          {/* No Selection Message */}
          {(!selectedCategory || !selectedBannerCategory) && (
            <Card className="bg-card border-2 border-dashed border-muted-foreground/30">
              <CardContent className="py-16 text-center">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Select a sticker category and banner category to manage stickers</p>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
