import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Trash2, Eye, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useRankStickers } from '@/hooks/useRankStickers';
import { useStickerCategories } from '@/hooks/useStickers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StickerTransformControls from '@/components/admin/StickerTransformControls';

interface Rank {
  id: string;
  name: string;
  color: string;
  gradient: string;
}

const AdminRankStickers = () => {
  const navigate = useNavigate();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [selectedRank, setSelectedRank] = useState<string>();
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewSticker, setPreviewSticker] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingSticker, setEditingSticker] = useState<any | null>(null);

  const { categories } = useStickerCategories();
  const { stickers, loading, uploadSticker, deleteSticker } = useRankStickers(selectedRank, selectedCategory);

  // Load ranks on mount and set first category as default
  useEffect(() => {
    const loadRanks = async () => {
      const { data } = await supabase
        .from('ranks')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (data) setRanks(data);
    };
    loadRanks();
  }, []);

  // Set first category as default when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const handleRankChange = (rankId: string) => {
    setSelectedRank(rankId);
    setSelectedSlot(null);
    setPreviewSticker(null);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSlot(null);
    setPreviewSticker(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewSticker(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedRank || !selectedCategory || selectedSlot === null || !uploadFile) {
      toast.error('Please select rank, category, slot, and upload file');
      return;
    }

    setUploading(true);
    const name = uploadName || `Slot ${selectedSlot}`;
    await uploadSticker(uploadFile, selectedSlot, name);
    setUploading(false);
    
    // Reset form
    setSelectedSlot(null);
    setUploadName('');
    setUploadFile(null);
    setPreviewSticker(null);
  };

  const handleDelete = async (slotNumber: number, imageUrl: string) => {
    if (window.confirm(`Delete sticker from Slot ${slotNumber}?`)) {
      await deleteSticker(slotNumber, imageUrl);
    }
  };

  const selectedRankData = ranks.find(r => r.id === selectedRank);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin')}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rank Stickers Management</h1>
          <p className="text-sm text-muted-foreground">Upload and manage 16 stickers per rank per category</p>
          {selectedRank && selectedCategory && (
            <Badge variant="outline" className="mt-2 border-primary text-primary">
              Currently editing: {ranks.find(r => r.id === selectedRank)?.name} - {categories.find(c => c.id === selectedCategory)?.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Rank & Category Selectors */}
      <Card className="p-6 mb-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label className="text-base font-semibold mb-2 block">Select Rank</Label>
            <Select value={selectedRank} onValueChange={handleRankChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a rank" />
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
            <Label className="text-base font-semibold mb-2 block">Select Category</Label>
            <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-secondary">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </Card>

      {/* Stickers Grid */}
      {selectedRank && selectedCategory && (
        <>
          {/* Upload Section */}
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Upload Sticker</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Slot Number</Label>
                <Select 
                  value={selectedSlot?.toString()} 
                  onValueChange={(val) => setSelectedSlot(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select slot" />
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
              
              <div>
                <Label>Sticker Name (Optional)</Label>
                <Input
                  placeholder={selectedSlot ? `Slot ${selectedSlot}` : 'Enter name'}
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                />
              </div>

              <div>
                <Label>Upload Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedSlot || !uploadFile || uploading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>

            {/* Preview */}
            {previewSticker && selectedRankData && (
              <div className="mt-6">
                <Label className="block mb-2">Banner Preview</Label>
                <div 
                  className="relative w-full max-w-2xl mx-auto aspect-[4/5] rounded-xl overflow-hidden"
                  style={{ 
                    background: selectedRankData.gradient 
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img 
                      src={previewSticker} 
                      alt="Preview" 
                      className="max-h-[60%] max-w-[60%] object-contain"
                    />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <p className="text-white text-sm font-semibold">
                      {selectedRankData.name} - Slot {selectedSlot}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Stickers Grid */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">All 16 Slots - {categories.find(c => c.id === selectedCategory)?.name}</h2>
              <Badge variant="secondary">
                {stickers.filter(s => s.is_active).length}/16 Uploaded
              </Badge>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading stickers...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {stickers.map((sticker) => (
                  <div 
                    key={sticker.id} 
                    className="relative group"
                  >
                    <div 
                      className={`
                        aspect-square rounded-lg border-2 overflow-hidden
                        ${sticker.is_active 
                          ? 'border-primary bg-card' 
                          : 'border-dashed border-muted-foreground/20 bg-muted/10'
                        }
                      `}
                    >
                      {sticker.is_active && sticker.image_url ? (
                        <img 
                          src={sticker.image_url} 
                          alt={sticker.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          Empty
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-1 text-center">
                      <p className="text-xs font-medium text-foreground">
                        Slot {sticker.slot_number}
                      </p>
                    </div>

                    {sticker.is_active && sticker.image_url && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="icon" 
                              variant="secondary"
                              className="h-6 w-6"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Slot {sticker.slot_number} Preview</DialogTitle>
                            </DialogHeader>
                            <div 
                              className="relative w-full aspect-[4/5] rounded-xl overflow-hidden"
                              style={{ background: selectedRankData?.gradient }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center">
                                <img 
                                  src={sticker.image_url} 
                                  alt={sticker.name}
                                  className="max-h-[60%] max-w-[60%] object-contain"
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          size="icon" 
                          variant="secondary"
                          className="h-6 w-6"
                          onClick={() => setEditingSticker(sticker)}
                          title="Edit Position & Transform"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>

                        <Button 
                          size="icon" 
                          variant="destructive"
                          className="h-6 w-6"
                          onClick={() => handleDelete(sticker.slot_number, sticker.image_url)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {(!selectedRank || !selectedCategory) && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">
            Please select a rank and category to manage sticker slots
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Each rank-category combination has 16 independent slots
          </p>
        </Card>
      )}

      {/* Edit Transform Dialog */}
      <Dialog open={!!editingSticker} onOpenChange={() => setEditingSticker(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {editingSticker && selectedRank && selectedCategory && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{editingSticker.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Rank: {ranks.find(r => r.id === selectedRank)?.name} | Category: {categories.find(c => c.id === selectedCategory)?.name} | Slot: {editingSticker.slot_number}
                </p>
              </DialogHeader>
              <StickerTransformControls
                stickerId={editingSticker.id}
                rankId={selectedRank}
                categoryId={selectedCategory}
                slotNumber={editingSticker.slot_number}
                imageUrl={editingSticker.image_url}
                initialTransform={{
                  position_x: editingSticker.position_x,
                  position_y: editingSticker.position_y,
                  scale: editingSticker.scale,
                  rotation: editingSticker.rotation,
                }}
                onTransformChange={(transform) => {
                  setEditingSticker({ ...editingSticker, ...transform });
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRankStickers;
