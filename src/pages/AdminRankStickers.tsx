import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useRankStickers } from '@/hooks/useRankStickers';
import { useStickerCategories } from '@/hooks/useStickers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { categories } = useStickerCategories();
  const { stickers, loading, uploadSticker, deleteSticker } = useRankStickers(selectedRank, selectedCategory);

  // Load ranks on mount
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
    setPreviewUrl(null);
    setUploadFile(null);
    setUploadName('');
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSlot(null);
    setPreviewUrl(null);
    setUploadFile(null);
    setUploadName('');
  };

  const handleSlotSelect = (slotNum: number) => {
    setSelectedSlot(slotNum);
    setUploadFile(null);
    setPreviewUrl(null);
    setUploadName('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
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
    
    setUploadFile(null);
    setPreviewUrl(null);
    setUploadName('');
  };

  const handleDelete = async (slotNumber: number, imageUrl: string) => {
    if (window.confirm(`Delete sticker from Slot ${slotNumber}?`)) {
      await deleteSticker(slotNumber, imageUrl);
      if (selectedSlot === slotNumber) {
        setSelectedSlot(null);
      }
    }
  };

  const selectedRankData = ranks.find(r => r.id === selectedRank);
  const selectedCategoryData = categories.find(c => c.id === selectedCategory);
  const currentSlotSticker = stickers.find(s => s.slot_number === selectedSlot);

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Rank Stickers Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload and manage achievement stickers for each rank and category
            </p>
          </div>
        </div>

        {/* Editing Context Badge */}
        {selectedRankData && selectedCategoryData && (
          <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="text-sm px-3 py-1">Currently Editing</Badge>
              <span className="text-lg font-semibold">
                {selectedRankData.name} - {selectedCategoryData.name}
              </span>
              {selectedSlot !== null && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="secondary" className="text-sm">Slot {selectedSlot}</Badge>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Rank Selection */}
        <Card className="p-6 mb-6">
          <Label className="text-base font-semibold mb-3 block">Select Rank</Label>
          <Select value={selectedRank} onValueChange={handleRankChange}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose a rank..." />
            </SelectTrigger>
            <SelectContent>
              {ranks.map((rank) => (
                <SelectItem key={rank.id} value={rank.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: rank.gradient }} />
                    {rank.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {selectedRank && (
          <>
            {/* Category Tabs */}
            <Card className="p-6 mb-6">
              <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  {categories.map((category) => (
                    <TabsTrigger key={category.id} value={category.id}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map((category) => (
                  <TabsContent key={category.id} value={category.id}>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{category.name} Stickers</h3>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </Card>

            {/* Banner Preview with Stickers */}
            {selectedCategory && (
              <Card className="p-6 mb-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Banner Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Live preview showing all uploaded stickers on the banner
                  </p>
                </div>

                {/* Banner Preview Container */}
                <div className="relative w-full max-w-md mx-auto bg-gradient-to-br from-background to-muted/20 rounded-2xl overflow-hidden border-2 border-border shadow-2xl">
                  <div
                    className="relative w-full overflow-hidden"
                    style={{
                      aspectRatio: '9/16',
                      background: selectedRankData?.gradient || 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                    }}
                  >
                    <div className="absolute inset-0">
                      {/* Top-Left Logo Placeholder */}
                      <div className="absolute z-30" style={{ top: '3%', left: '3%', width: '15%', height: '8%' }}>
                        <div className="w-full h-full bg-muted-foreground/20 rounded-lg" />
                      </div>

                      {/* Top-Right Logo Placeholder */}
                      <div className="absolute z-30" style={{ top: '3%', right: '3%', width: '15%', height: '8%' }}>
                        <div className="w-full h-full rounded-full bg-black/40 border-2 border-primary/60" />
                      </div>

                      {/* Achiever Photo Placeholder */}
                      <div className="absolute overflow-hidden rounded-2xl" style={{
                        left: '3%',
                        top: '12%',
                        width: '40%',
                        height: '63.75%'
                      }}>
                        <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center">
                          <span className="text-xs text-white/60">Achiever</span>
                        </div>
                      </div>

                      {/* Profile Photo Placeholder */}
                      <div className="absolute overflow-hidden rounded-2xl" style={{
                        bottom: '24px',
                        right: '24px',
                        width: '28%',
                        height: '36%'
                      }}>
                        <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center">
                          <span className="text-xs text-white/60">Profile</span>
                        </div>
                      </div>

                      {/* All Stickers Overlay */}
                      {stickers.filter(s => s.is_active && s.image_url).map((sticker) => {
                        const posX = sticker.position_x || 50;
                        const posY = sticker.position_y || 50;
                        const scale = sticker.scale || 1;
                        const rotation = sticker.rotation || 0;

                        return (
                          <div
                            key={sticker.id}
                            className="absolute z-20 pointer-events-none"
                            style={{
                              left: `${posX}%`,
                              top: `${posY}%`,
                              transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
                              transformOrigin: 'center center',
                            }}
                          >
                            <img
                              src={sticker.image_url}
                              alt={sticker.name}
                              className="w-20 h-20 object-contain drop-shadow-lg"
                              style={{ 
                                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
                              }}
                            />
                            {/* Slot Number Badge */}
                            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
                              {sticker.slot_number}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sticker Count */}
                <div className="mt-4 text-center">
                  <p className="text-sm font-medium">
                    {stickers.filter(s => s.is_active && s.image_url).length} / 16 Stickers Uploaded
                  </p>
                </div>
              </Card>
            )}

            {/* 16 Slot Grid */}
            {selectedCategory && (
              <Card className="p-6 mb-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Select Slot (1-16)</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a slot to upload or manage sticker
                  </p>
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((slotNum) => {
                    const slotSticker = stickers.find(s => s.slot_number === slotNum);
                    const isSelected = selectedSlot === slotNum;
                    
                    return (
                      <button
                        key={slotNum}
                        onClick={() => handleSlotSelect(slotNum)}
                        className={`
                          relative aspect-square rounded-lg border-2 transition-all
                          ${isSelected 
                            ? 'border-primary bg-primary/10 shadow-lg' 
                            : 'border-border hover:border-primary/50 bg-muted/20'
                          }
                        `}
                      >
                        {slotSticker ? (
                          <div className="absolute inset-0 p-1">
                            <img
                              src={slotSticker.image_url}
                              alt={slotSticker.name}
                              className="w-full h-full object-contain rounded"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(slotNum, slotSticker.image_url);
                              }}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg hover:bg-destructive/90"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-semibold text-muted-foreground">{slotNum}</span>
                          </div>
                        )}
                        
                        {isSelected && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-lg" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Upload Form */}
            {selectedSlot !== null && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Upload Sticker for Slot {selectedSlot}
                </h3>

                {currentSlotSticker && (
                  <div className="mb-6 p-4 bg-secondary/20 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Current Sticker:</p>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-background rounded-lg border-2 border-border p-2">
                        <img src={currentSlotSticker.image_url} alt={currentSlotSticker.name} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <p className="font-medium">{currentSlotSticker.name}</p>
                        <Badge variant="outline" className="mt-1">Slot {selectedSlot}</Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sticker-name">Sticker Name (Optional)</Label>
                    <Input
                      id="sticker-name"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="e.g., Trophy Gold, Achievement Badge..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sticker-file">Upload Image</Label>
                    <div className="mt-1">
                      <Input
                        id="sticker-file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG or JPG recommended. Transparent backgrounds work best.
                      </p>
                    </div>
                  </div>

                  {previewUrl && (
                    <div>
                      <Label>Preview</Label>
                      <div className="mt-1 w-32 h-32 bg-secondary/20 rounded-lg border-2 border-dashed border-border p-4 flex items-center justify-center">
                        <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                      </div>
                    </div>
                  )}

                  <Button onClick={handleUpload} disabled={!uploadFile || uploading} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? 'Uploading...' : currentSlotSticker ? 'Replace Sticker' : 'Upload Sticker'}
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}

        {!selectedRank && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Please select a rank to begin managing stickers</p>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRankStickers;
