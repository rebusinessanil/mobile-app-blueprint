import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { useStickerCategories } from '@/hooks/useStickers';

interface CategorySticker {
  id: string;
  slot_number: number;
  image_url: string;
  name: string;
  is_active: boolean;
  banner_category: string | null;
  category_id: string | null;
}

const AdminCategoryStickers = () => {
  const navigate = useNavigate();
  const [selectedBannerCategory, setSelectedBannerCategory] = useState<string>('');
  const [selectedStickerCategory, setSelectedStickerCategory] = useState<string>();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { categories: stickerCategories } = useStickerCategories();

  // Fetch banner categories
  const { data: bannerCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['template-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Set first sticker category as default
  useEffect(() => {
    if (stickerCategories.length > 0 && !selectedStickerCategory) {
      setSelectedStickerCategory(stickerCategories[0].id);
    }
  }, [stickerCategories, selectedStickerCategory]);

  // Fetch stickers for selected banner category and sticker category
  const { data: stickers, isLoading: stickersLoading, refetch: refetchStickers } = useQuery({
    queryKey: ['category-stickers', selectedBannerCategory, selectedStickerCategory],
    queryFn: async () => {
      if (!selectedBannerCategory || !selectedStickerCategory) return [];
      
      const { data, error } = await supabase
        .from('stickers')
        .select('*')
        .eq('banner_category', selectedBannerCategory)
        .eq('category_id', selectedStickerCategory)
        .order('slot_number', { ascending: true });

      if (error) throw error;
      return data as CategorySticker[];
    },
    enabled: !!selectedBannerCategory && !!selectedStickerCategory,
  });

  const handleBannerCategoryChange = (categoryId: string) => {
    setSelectedBannerCategory(categoryId);
    setSelectedSlot(null);
    setPreviewUrl(null);
    setUploadFile(null);
    setUploadName('');
  };

  const handleStickerCategoryChange = (categoryId: string) => {
    setSelectedStickerCategory(categoryId);
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
    if (!selectedBannerCategory || !selectedStickerCategory || selectedSlot === null || !uploadFile) {
      toast.error('Please select category, sticker type, slot, and upload file');
      return;
    }

    setUploading(true);
    try {
      // Upload image to storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `category-${selectedBannerCategory}-${selectedStickerCategory}-slot-${selectedSlot}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('stickers')
        .upload(fileName, uploadFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stickers')
        .getPublicUrl(fileName);

      const name = uploadName || `Slot ${selectedSlot}`;

      // Upsert sticker record
      const { error } = await supabase
        .from('stickers')
        .upsert({
          banner_category: selectedBannerCategory,
          category_id: selectedStickerCategory,
          slot_number: selectedSlot,
          name,
          image_url: publicUrl,
          is_active: true,
          position_x: 50,
          position_y: 50,
          scale: 1.0,
          rotation: 0,
        }, {
          onConflict: 'banner_category,slot_number,category_id'
        });

      if (error) throw error;

      toast.success(`Sticker uploaded to Slot ${selectedSlot}`);
      refetchStickers();
      setUploadFile(null);
      setPreviewUrl(null);
      setUploadName('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload sticker');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (slotNumber: number, imageUrl: string) => {
    if (!window.confirm(`Delete sticker from Slot ${slotNumber}?`)) return;

    try {
      // Delete from storage if URL exists
      if (imageUrl) {
        const filePath = imageUrl.split('/stickers/')[1];
        if (filePath) {
          await supabase.storage.from('stickers').remove([filePath]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('stickers')
        .delete()
        .eq('banner_category', selectedBannerCategory)
        .eq('category_id', selectedStickerCategory)
        .eq('slot_number', slotNumber);

      if (error) throw error;

      toast.success(`Sticker removed from Slot ${slotNumber}`);
      refetchStickers();
      if (selectedSlot === slotNumber) {
        setSelectedSlot(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete sticker');
    }
  };

  const selectedBannerCategoryData = bannerCategories?.find(c => c.id === selectedBannerCategory);
  const selectedStickerCategoryData = stickerCategories.find(c => c.id === selectedStickerCategory);
  const currentSlotSticker = stickers?.find(s => s.slot_number === selectedSlot);

  if (categoriesLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0a1e2e] via-[#0b1622] to-black relative overflow-hidden">
        {/* Radial glow overlays for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.06)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,40,60,0.4)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,30,46,0.3)_0%,transparent_70%)]" />
        
        {/* Subtle grain/noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        <div className="relative z-10 container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Category Stickers Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload and manage stickers for each banner category
            </p>
          </div>
        </div>

        {/* Editing Context Badge */}
        {selectedBannerCategoryData && selectedStickerCategoryData && (
          <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="default" className="text-sm px-3 py-1">Currently Editing</Badge>
              <span className="text-lg font-semibold">
                {selectedBannerCategoryData.name} - {selectedStickerCategoryData.name}
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

        {/* Banner Category Selection - Dropdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Banner Category</CardTitle>
            <CardDescription>Choose a banner category to manage its stickers</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedBannerCategory} onValueChange={handleBannerCategoryChange}>
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {bannerCategories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedBannerCategory && (
          <>
            {/* Sticker Category Tabs */}
            <Card className="p-6 mb-6">
              <Tabs value={selectedStickerCategory} onValueChange={handleStickerCategoryChange}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  {stickerCategories.map((category) => (
                    <TabsTrigger key={category.id} value={category.id}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {stickerCategories.map((category) => (
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

            {/* 16 Slot Grid */}
            {selectedStickerCategory && (
              <Card className="p-6 mb-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Select Slot (1-16)</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a slot to upload or manage sticker
                  </p>
                </div>

                {stickersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((slotNum) => {
                      const slotSticker = stickers?.find(s => s.slot_number === slotNum);
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
                )}
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
                    <Label htmlFor="sticker-name" className="text-muted-foreground text-sm">Sticker Name (Optional)</Label>
                    <Input
                      id="sticker-name"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="e.g., Trophy Gold, Achievement Badge..."
                      className="mt-1 bg-background/50 border-0 border-b-2 border-muted-foreground/20 rounded-none focus:border-primary focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors placeholder:text-muted-foreground/40"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sticker-file" className="text-muted-foreground text-sm">Upload Image</Label>
                    <div className="mt-1">
                      <Input
                        id="sticker-file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="cursor-pointer bg-background/50 border-0 border-b-2 border-muted-foreground/20 rounded-none focus:border-primary focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors file:bg-primary/10 file:text-primary file:border-0 file:rounded file:px-3 file:py-1 file:mr-3"
                      />
                      <p className="text-xs text-muted-foreground/60 mt-2">
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

        {!selectedBannerCategory && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Please select a banner category to begin managing stickers</p>
          </Card>
        )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCategoryStickers;
