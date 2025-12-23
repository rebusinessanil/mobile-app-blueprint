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
  X
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminGuard } from "@/components/AdminGuard";
import { cn } from "@/lib/utils";

interface Rank {
  id: string;
  name: string;
  display_order: number;
}

interface StickerCategory {
  id: string;
  name: string;
  description: string | null;
}

interface Sticker {
  id: string;
  name: string;
  image_url: string;
  rank_id: string | null;
  category_id: string | null;
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
  const [selectedRank, setSelectedRank] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [slotStates, setSlotStates] = useState<Record<number, SlotState>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs for file inputs per slot
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  
  // Transform controls for selected slot
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [scale, setScale] = useState(2.5);
  const [rotation, setRotation] = useState(0);

  // Fetch categories
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

  // Fetch ranks
  const { data: ranks = [] } = useQuery<Rank[]>({
    queryKey: ['ranks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch all stickers for selected category + rank
  const { data: stickers = [], refetch: refetchStickers } = useQuery<Sticker[]>({
    queryKey: ['stickers-all', selectedCategory, selectedRank],
    queryFn: async () => {
      if (!selectedCategory || !selectedRank) return [];

      const { data, error } = await supabase
        .from('stickers')
        .select('*')
        .eq('category_id', selectedCategory)
        .eq('rank_id', selectedRank)
        .order('slot_number');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCategory && !!selectedRank
  });

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
    // If no sticker and no pending upload, open file picker
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
    if (!slotState?.pendingFile || !selectedCategory || !selectedRank) {
      toast.error("No file to upload or missing selection");
      return;
    }

    setSlotStates(prev => ({
      ...prev,
      [slotNumber]: { ...prev[slotNumber], isUploading: true }
    }));

    try {
      // Upload to storage
      const fileExt = slotState.pendingFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedCategory}/${selectedRank}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stickers')
        .upload(filePath, slotState.pendingFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stickers')
        .getPublicUrl(filePath);

      // Check if sticker already exists for this slot
      const existingSticker = slotState.sticker;
      
      if (existingSticker) {
        // Update existing sticker
        const { error: updateError } = await supabase
          .from('stickers')
          .update({
            name: slotState.pendingName || `Sticker ${slotNumber}`,
            image_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSticker.id);

        if (updateError) throw updateError;

        // Delete old file from storage
        const oldPath = existingSticker.image_url.split('/stickers/')[1];
        if (oldPath) {
          await supabase.storage.from('stickers').remove([oldPath]);
        }
      } else {
        // Insert new sticker (is_active = false by default, not auto-selected)
        const { error: insertError } = await supabase
          .from('stickers')
          .insert({
            name: slotState.pendingName || `Sticker ${slotNumber}`,
            image_url: publicUrl,
            category_id: selectedCategory,
            rank_id: selectedRank,
            slot_number: slotNumber,
            position_x: 50,
            position_y: 50,
            scale: 2.5,
            rotation: 0,
            is_active: false, // Not auto-activated
          });

        if (insertError) throw insertError;
      }

      toast.success(`Sticker uploaded to Slot ${slotNumber}!`);
      
      // Cleanup preview URL
      if (slotState.pendingPreview) {
        URL.revokeObjectURL(slotState.pendingPreview);
      }
      
      // Clear pending state
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
      
      // Refetch stickers
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

  // Activate/deactivate sticker (separate from upload)
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
      // Delete from storage
      const urlPath = slotState.sticker.image_url.split('/stickers/')[1];
      if (urlPath) {
        await supabase.storage.from('stickers').remove([urlPath]);
      }

      // Delete from database
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

  // Upload button click - opens file picker for selected slot
  const handleUploadButtonClick = (slotNumber: number) => {
    fileInputRefs.current[slotNumber]?.click();
  };

  const currentSlotState = selectedSlot !== null ? slotStates[selectedSlot] : null;
  const currentSticker = currentSlotState?.sticker;
  const hasPending = currentSlotState?.pendingFile;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Sticker Library</h1>
              <p className="text-muted-foreground mt-2">
                Click any slot to upload. Confirm to save. Toggle "Select Sticker" to activate.
              </p>
            </div>
          </div>

          {/* Selection Controls */}
          <Card className="bg-card border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={(val) => {
                    setSelectedCategory(val);
                    setSelectedSlot(null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Rank</Label>
                  <Select value={selectedRank} onValueChange={(val) => {
                    setSelectedRank(val);
                    setSelectedSlot(null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rank" />
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
              </div>
            </CardContent>
          </Card>

          {selectedCategory && selectedRank && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Slots Grid */}
              <div className="lg:col-span-2">
                <Card className="bg-card border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-primary">Sticker Slots (1-16)</CardTitle>
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

                            {/* Image Preview - Square, Centered */}
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

                            {/* Hidden File Input per slot */}
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
                        <div className="space-y-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                          <p className="text-sm font-medium text-yellow-500">Pending Upload</p>
                          
                          {/* Preview */}
                          <div className="w-full aspect-square bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                              src={currentSlotState?.pendingPreview!}
                              alt="Preview"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          
                          <Input
                            value={currentSlotState?.pendingName || ''}
                            onChange={(e) => setSlotStates(prev => ({
                              ...prev,
                              [selectedSlot]: { ...prev[selectedSlot], pendingName: e.target.value }
                            }))}
                            placeholder="Sticker name"
                            className="bg-background"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleConfirmUpload(selectedSlot)}
                              disabled={currentSlotState?.isUploading}
                              className="flex-1"
                              size="sm"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              {currentSlotState?.isUploading ? "Uploading..." : "Confirm Upload"}
                            </Button>
                            <Button
                              onClick={() => handleCancelUpload(selectedSlot)}
                              variant="outline"
                              size="sm"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Current Sticker Info */}
                      {currentSticker && !hasPending && (
                        <>
                          <div className="p-3 bg-primary/5 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-medium">{currentSticker.name}</p>
                              </div>
                              <Button
                                onClick={() => handleUploadButtonClick(selectedSlot)}
                                variant="outline"
                                size="sm"
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Replace
                              </Button>
                            </div>
                          </div>

                          {/* Select/Activate Button - Separate from Upload */}
                          <Button
                            onClick={() => handleToggleActive(selectedSlot)}
                            variant={currentSticker.is_active ? "default" : "outline"}
                            className="w-full"
                            size="sm"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            {currentSticker.is_active ? "Sticker Active (Click to Deactivate)" : "Select Sticker (Activate)"}
                          </Button>

                          {/* Transform Controls */}
                          <div className="space-y-4 pt-2">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm">Scale</Label>
                                <span className="text-sm text-primary font-bold">
                                  {Math.round(scale * 100)}%
                                </span>
                              </div>
                              <Slider
                                value={[scale]}
                                onValueChange={(val) => setScale(val[0])}
                                min={0.5}
                                max={5}
                                step={0.1}
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm">Position X</Label>
                                <span className="text-sm text-primary font-bold">{position.x}%</span>
                              </div>
                              <Slider
                                value={[position.x]}
                                onValueChange={(val) => setPosition(prev => ({ ...prev, x: val[0] }))}
                                min={0}
                                max={100}
                                step={1}
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm">Position Y</Label>
                                <span className="text-sm text-primary font-bold">{position.y}%</span>
                              </div>
                              <Slider
                                value={[position.y]}
                                onValueChange={(val) => setPosition(prev => ({ ...prev, y: val[0] }))}
                                min={0}
                                max={100}
                                step={1}
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm">Rotation</Label>
                                <span className="text-sm text-primary font-bold">{rotation}°</span>
                              </div>
                              <Slider
                                value={[rotation]}
                                onValueChange={(val) => setRotation(val[0])}
                                min={0}
                                max={360}
                                step={1}
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveTransform}
                                disabled={isSaving}
                                className="flex-1"
                                size="sm"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? "Saving..." : "Save Position"}
                              </Button>
                              <Button
                                onClick={handleReset}
                                variant="outline"
                                size="sm"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleDelete(selectedSlot)}
                            variant="destructive"
                            size="sm"
                            className="w-full"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Sticker
                          </Button>
                        </>
                      )}

                      {/* Empty Slot - Show upload button */}
                      {!currentSticker && !hasPending && (
                        <div className="text-center py-6 text-muted-foreground">
                          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm mb-3">No sticker in Slot {selectedSlot}</p>
                          <Button 
                            onClick={() => handleUploadButtonClick(selectedSlot)}
                            variant="outline"
                            className="w-full"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload to Slot {selectedSlot}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card border-2 border-dashed border-muted-foreground/30">
                    <CardContent className="py-12 text-center">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground text-sm">Click a slot to manage it</p>
                    </CardContent>
                  </Card>
                )}

                {/* Live Preview - only for existing stickers */}
                {currentSticker && !hasPending && (
                  <Card className="bg-card border-2 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-primary text-sm">Live Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative w-full aspect-square bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
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
          )}

          {/* No Selection Message */}
          {(!selectedCategory || !selectedRank) && (
            <Card className="bg-card border-2 border-dashed border-muted-foreground/30">
              <CardContent className="py-16 text-center">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Select a category and rank to manage stickers</p>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
