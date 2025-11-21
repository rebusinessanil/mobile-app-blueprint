import { useState, useEffect } from "react";
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
  Maximize2,
  Move
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function AdminStickerLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedRank, setSelectedRank] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [stickerName, setStickerName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Transform controls
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

  // Fetch current sticker for selected slot
  const { data: currentSticker, refetch: refetchSticker } = useQuery<Sticker | null>({
    queryKey: ['sticker', selectedCategory, selectedRank, selectedSlot],
    queryFn: async () => {
      if (!selectedCategory || !selectedRank) return null;

      const { data, error } = await supabase
        .from('stickers')
        .select('*')
        .eq('category_id', selectedCategory)
        .eq('rank_id', selectedRank)
        .eq('slot_number', selectedSlot)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!selectedCategory && !!selectedRank
  });

  // Update local state when sticker loads
  useEffect(() => {
    if (currentSticker) {
      setPosition({ x: currentSticker.position_x, y: currentSticker.position_y });
      setScale(currentSticker.scale);
      setRotation(currentSticker.rotation);
      setStickerName(currentSticker.name);
    } else {
      // Reset to defaults
      setPosition({ x: 50, y: 50 });
      setScale(2.5);
      setRotation(0);
      setStickerName("");
    }
  }, [currentSticker]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      if (!stickerName) {
        setStickerName(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !stickerName || !selectedCategory || !selectedRank) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsUploading(true);
    try {
      // Upload to storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedCategory}/${selectedRank}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stickers')
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stickers')
        .getPublicUrl(filePath);

      // Upsert sticker record (update if exists, insert if not)
      const { error: upsertError } = await supabase
        .from('stickers')
        .upsert({
          name: stickerName,
          image_url: publicUrl,
          category_id: selectedCategory,
          rank_id: selectedRank,
          slot_number: selectedSlot,
          position_x: position.x,
          position_y: position.y,
          scale: scale,
          rotation: rotation,
          is_active: true,
        });

      if (upsertError) throw upsertError;

      toast.success("Sticker uploaded successfully!");
      setUploadFile(null);
      setStickerName("");
      refetchSticker();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload sticker");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveTransform = async () => {
    if (!currentSticker) {
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
        .eq('id', currentSticker.id);

      if (error) throw error;

      toast.success("Sticker defaults saved for all users!");
      refetchSticker();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save sticker defaults");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentSticker) return;

    if (!confirm("Are you sure you want to delete this sticker?")) return;

    try {
      // Delete from storage
      const urlPath = currentSticker.image_url.split('/stickers/')[1];
      if (urlPath) {
        await supabase.storage.from('stickers').remove([urlPath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('stickers')
        .delete()
        .eq('id', currentSticker.id);

      if (error) throw error;

      toast.success("Sticker deleted successfully!");
      refetchSticker();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete sticker");
    }
  };

  const handleReset = () => {
    if (currentSticker) {
      setPosition({ x: currentSticker.position_x, y: currentSticker.position_y });
      setScale(currentSticker.scale);
      setRotation(currentSticker.rotation);
      toast.info("Reset to last saved values");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Sticker Library</h1>
            <p className="text-muted-foreground mt-2">
              Upload, organize, and set default positions for stickers across all ranks and slots
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Selection Controls */}
            <Card className="bg-card border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Sticker Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                  <Select value={selectedRank} onValueChange={setSelectedRank}>
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

                <div>
                  <Label>Slot Number (1-16)</Label>
                  <Select 
                    value={selectedSlot.toString()} 
                    onValueChange={(val) => setSelectedSlot(parseInt(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          Slot {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Upload New Sticker */}
            <Card className="bg-card border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Upload Sticker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Sticker Name</Label>
                  <Input
                    value={stickerName}
                    onChange={(e) => setStickerName(e.target.value)}
                    placeholder="Enter sticker name"
                  />
                </div>

                <div>
                  <Label>Image File</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!uploadFile || !stickerName || !selectedCategory || !selectedRank || isUploading}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Sticker"}
                </Button>
              </CardContent>
            </Card>

            {/* Transform Controls */}
            {currentSticker && (
              <Card className="bg-card border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">Position & Size</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Scale</Label>
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
                      <Label>Position X</Label>
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
                      <Label>Position Y</Label>
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
                      <Label>Rotation</Label>
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
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Defaults"}
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Sticker
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-2 border-primary/20 h-full">
              <CardHeader>
                <CardTitle className="text-primary">Live Preview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {currentSticker 
                    ? `Viewing: ${currentSticker.name} (Slot ${selectedSlot})`
                    : "No sticker in this slot"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="relative w-full aspect-square bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
                  {currentSticker ? (
                    <img
                      src={currentSticker.image_url}
                      alt={currentSticker.name}
                      className="absolute"
                      style={{
                        left: `${position.x}%`,
                        top: `${position.y}%`,
                        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
                        transformOrigin: 'center',
                        maxWidth: '200px',
                        maxHeight: '200px',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>No sticker uploaded for this slot</p>
                        <p className="text-sm mt-2">Upload a sticker to see preview</p>
                      </div>
                    </div>
                  )}
                </div>

                {currentSticker && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold text-primary mb-2">Sticker Info</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <span className="ml-2 font-medium">{currentSticker.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Slot:</span>
                        <span className="ml-2 font-medium">{selectedSlot}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Position:</span>
                        <span className="ml-2 font-medium">X: {position.x}%, Y: {position.y}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Scale:</span>
                        <span className="ml-2 font-medium">{Math.round(scale * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
