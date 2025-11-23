import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Save, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCategoryStickers, CategorySticker } from "@/hooks/useCategoryStickers";

const categories = [
  { value: 'bonanza', label: 'Bonanza Promotion', icon: '🎁' },
  { value: 'birthday', label: 'Birthday', icon: '🎂' },
  { value: 'anniversary', label: 'Anniversary', icon: '💞' },
  { value: 'meeting', label: 'Meeting', icon: '📊' },
  { value: 'festival', label: 'Festival', icon: '🎉' },
  { value: 'motivational', label: 'Motivational', icon: '⚡' },
];

export default function AdminCategoryStickers() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('bonanza');
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [uploading, setUploading] = useState(false);
  const [stickerName, setStickerName] = useState("");
  const { stickers, refetch } = useCategoryStickers(selectedCategory);

  const currentSticker = stickers.find(s => s.slot_number === selectedSlot);

  useEffect(() => {
    if (currentSticker) {
      setStickerName(currentSticker.name);
    } else {
      setStickerName(`${selectedCategory} Sticker ${selectedSlot}`);
    }
  }, [currentSticker, selectedCategory, selectedSlot]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedCategory}-slot-${selectedSlot}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stickers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stickers')
        .getPublicUrl(filePath);

      // Update or insert sticker record
      const { error: upsertError } = await supabase
        .from('stickers')
        .upsert({
          banner_category: selectedCategory,
          slot_number: selectedSlot,
          name: stickerName || `${selectedCategory} Sticker ${selectedSlot}`,
          image_url: publicUrl,
          is_active: true,
          position_x: 50,
          position_y: 50,
          scale: 1.0,
          rotation: 0,
          display_order: selectedSlot
        }, {
          onConflict: 'banner_category,slot_number'
        });

      if (upsertError) throw upsertError;

      toast.success('Sticker uploaded successfully!');
      refetch();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload sticker');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!currentSticker) return;

    try {
      const { error } = await supabase
        .from('stickers')
        .update({ is_active: !currentSticker.is_active })
        .eq('id', currentSticker.id);

      if (error) throw error;

      toast.success(currentSticker.is_active ? 'Sticker deactivated' : 'Sticker activated');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle sticker');
    }
  };

  const handleDelete = async () => {
    if (!currentSticker) return;
    if (!confirm('Are you sure you want to delete this sticker?')) return;

    try {
      const { error } = await supabase
        .from('stickers')
        .delete()
        .eq('id', currentSticker.id);

      if (error) throw error;

      toast.success('Sticker deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete sticker');
    }
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate("/admin")} 
            className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <h1 className="text-xl font-bold text-primary">Category Stickers Management</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Category and Slot Selection */}
        <Card className="p-6 gold-border bg-card">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Select Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="gold-border bg-secondary text-foreground h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary">
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-foreground">
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Select Slot (1-16)</Label>
              <Select value={selectedSlot.toString()} onValueChange={(v) => setSelectedSlot(Number(v))}>
                <SelectTrigger className="gold-border bg-secondary text-foreground h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary">
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((slot) => (
                    <SelectItem key={slot} value={slot.toString()} className="text-foreground">
                      Slot {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Current Sticker Preview */}
        <Card className="p-6 gold-border bg-card">
          <h3 className="text-lg font-bold text-primary mb-4">
            Current Sticker - Slot {selectedSlot}
          </h3>
          
          {currentSticker && currentSticker.is_active ? (
            <div className="space-y-4">
              <div className="w-full h-64 bg-secondary rounded-xl flex items-center justify-center p-4">
                <img 
                  src={currentSticker.image_url} 
                  alt={currentSticker.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/200x200?text=Sticker';
                  }}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleToggleActive}
                  variant="outline"
                  className="flex-1 border-2 border-primary text-foreground"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {currentSticker.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button 
                  onClick={handleDelete}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-64 bg-secondary rounded-xl flex items-center justify-center">
              <p className="text-muted-foreground">No sticker uploaded for this slot</p>
            </div>
          )}
        </Card>

        {/* Upload Section */}
        <Card className="p-6 gold-border bg-card">
          <h3 className="text-lg font-bold text-primary mb-4">
            Upload New Sticker
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Sticker Name</Label>
              <Input 
                value={stickerName}
                onChange={(e) => setStickerName(e.target.value)}
                placeholder="Enter sticker name"
                className="gold-border bg-secondary text-foreground h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Upload Image (PNG, JPG, SVG)</Label>
              <div className="flex gap-3">
                <Input 
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="gold-border bg-secondary text-foreground h-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: 500x500px transparent PNG. Max 5MB.
              </p>
            </div>

            {uploading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
              </div>
            )}
          </div>
        </Card>

        {/* Sticker Grid Preview */}
        <Card className="p-6 gold-border bg-card">
          <h3 className="text-lg font-bold text-primary mb-4">
            All Stickers for {categories.find(c => c.value === selectedCategory)?.label}
          </h3>
          
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 16 }, (_, i) => {
              const slot = i + 1;
              const sticker = stickers.find(s => s.slot_number === slot && s.is_active);
              const isSelected = slot === selectedSlot;
              
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`
                    gold-border rounded-xl p-3 transition-all
                    ${isSelected 
                      ? 'bg-primary/20 ring-2 ring-primary' 
                      : 'bg-secondary hover:bg-secondary/80'
                    }
                  `}
                >
                  <div className="aspect-square flex items-center justify-center mb-2 bg-navy-dark/50 rounded-lg">
                    {sticker ? (
                      <img 
                        src={sticker.image_url} 
                        alt={sticker.name}
                        className="max-w-full max-h-full object-contain p-2"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/80x80?text=Slot+' + slot;
                        }}
                      />
                    ) : (
                      <span className="text-4xl text-muted-foreground">{slot}</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground text-center">
                    Slot {slot}
                  </p>
                  {sticker && (
                    <p className="text-xs text-primary text-center">Active</p>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
