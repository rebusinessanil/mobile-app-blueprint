import { useState, useEffect } from 'react';
import { Upload, X, Loader2, Trash2, Eye, EyeOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  const [selectedBannerCategory, setSelectedBannerCategory] = useState<string>('');
  const [selectedStickerCategory, setSelectedStickerCategory] = useState<string>();
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

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
    setPreviewUrl(null);
    setUploadFile(null);
    setUploadName('');
  };

  const handleStickerCategoryChange = (categoryId: string) => {
    setSelectedStickerCategory(categoryId);
    setPreviewUrl(null);
    setUploadFile(null);
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

  const uploadStickerToSlot = async (file: File, slotNumber: number, name?: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `category-${selectedBannerCategory}-${selectedStickerCategory}-slot-${slotNumber}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('stickers')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('stickers')
      .getPublicUrl(fileName);

    const stickerName = name || `Slot ${slotNumber}`;

    const { error } = await supabase
      .from('stickers')
      .upsert({
        banner_category: selectedBannerCategory,
        category_id: selectedStickerCategory,
        slot_number: slotNumber,
        name: stickerName,
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
    return { slot: slotNumber, url: publicUrl };
  };

  const handleUpload = async (slotNumber: number) => {
    if (!selectedBannerCategory || !selectedStickerCategory || !uploadFile) {
      toast.error('Please select category, sticker type, and upload file');
      return;
    }

    setUploading(true);
    try {
      await uploadStickerToSlot(uploadFile, slotNumber, uploadName);
      toast.success(`Sticker uploaded to Slot ${slotNumber}`);
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

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedBannerCategory || !selectedStickerCategory) return;

    const filesToUpload = Array.from(files).slice(0, 16);
    const usedSlots = stickers?.map(s => s.slot_number) || [];
    const availableSlots = Array.from({ length: 16 }, (_, i) => i + 1).filter(i => !usedSlots.includes(i));

    if (availableSlots.length === 0) {
      toast.error('All 16 slots are filled. Delete some stickers first.');
      return;
    }

    if (filesToUpload.length > availableSlots.length) {
      toast.warning(`Only ${availableSlots.length} slots available. Uploading first ${availableSlots.length} images.`);
    }

    setBulkUploading(true);
    setUploadProgress({ current: 0, total: Math.min(filesToUpload.length, availableSlots.length) });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < Math.min(filesToUpload.length, availableSlots.length); i++) {
      const file = filesToUpload[i];
      const slot = availableSlots[i];

      setUploadProgress({ current: i + 1, total: Math.min(filesToUpload.length, availableSlots.length) });

      try {
        await uploadStickerToSlot(file, slot);
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Error uploading to slot ${slot}:`, err);
      }
    }

    setBulkUploading(false);
    setUploadProgress(null);
    event.target.value = '';
    refetchStickers();

    if (successCount > 0 && failCount === 0) {
      toast.success(`Successfully uploaded ${successCount} stickers!`);
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`Uploaded ${successCount} stickers. ${failCount} failed.`);
    } else {
      toast.error('Failed to upload stickers');
    }
  };

  const handleDelete = async (slotNumber: number, imageUrl: string) => {
    if (!window.confirm(`Delete sticker from Slot ${slotNumber}?`)) return;

    try {
      if (imageUrl) {
        const filePath = imageUrl.split('/stickers/')[1];
        if (filePath) {
          await supabase.storage.from('stickers').remove([filePath]);
        }
      }

      const { error } = await supabase
        .from('stickers')
        .delete()
        .eq('banner_category', selectedBannerCategory)
        .eq('category_id', selectedStickerCategory)
        .eq('slot_number', slotNumber);

      if (error) throw error;

      toast.success(`Sticker removed from Slot ${slotNumber}`);
      refetchStickers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete sticker');
    }
  };

  const handleToggleActive = async (stickerId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('stickers')
        .update({ is_active: !isActive })
        .eq('id', stickerId);

      if (error) throw error;
      toast.success(`Sticker ${!isActive ? 'activated' : 'deactivated'}`);
      refetchStickers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update sticker status');
    }
  };

  const selectedBannerCategoryData = bannerCategories?.find(c => c.id === selectedBannerCategory);
  const selectedStickerCategoryData = stickerCategories.find(c => c.id === selectedStickerCategory);

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Category Stickers</h1>
        <p className="text-muted-foreground">Manage stickers for each banner category</p>
      </div>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Category</CardTitle>
          <CardDescription>Choose a banner category to manage its stickers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bannerCategories?.map((category) => (
              <Button
                key={category.id}
                variant={selectedBannerCategory === category.id ? 'default' : 'outline'}
                onClick={() => handleBannerCategoryChange(category.id)}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sticker Type Selection */}
      {selectedBannerCategory && (
        <Card>
          <CardHeader>
            <CardTitle>Select Sticker Type</CardTitle>
            <CardDescription>Choose a sticker category to manage</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedStickerCategory} onValueChange={handleStickerCategoryChange}>
              <TabsList className="grid w-full grid-cols-4 mb-4">
                {stickerCategories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {stickerCategories.map((category) => (
                <TabsContent key={category.id} value={category.id}>
                  <div className="p-4 bg-muted/50 rounded-lg border border-primary/20">
                    <h3 className="font-semibold text-sm mb-1">{category.name} Stickers</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Stickers Management (16 Slots) */}
      {selectedBannerCategory && selectedStickerCategory && (
        <Card>
          <CardHeader>
            <CardTitle>Stickers (16 Slots)</CardTitle>
            <CardDescription>
              Each category supports up to 16 stickers. Users will only see stickers for the category they select.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-sticker-upload">Bulk Upload Stickers (Up to 16)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="bulk-sticker-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBulkUpload}
                    disabled={uploading || bulkUploading || (stickers?.length || 0) >= 16}
                    className="flex-1"
                  />
                  {bulkUploading && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-gold" />
                      {uploadProgress && (
                        <span className="text-sm text-muted-foreground">
                          {uploadProgress.current} / {uploadProgress.total}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Select multiple images to upload. They will be assigned to available slots automatically.
                </p>
              </div>

              <p className="text-sm text-muted-foreground font-medium">
                {stickers?.length || 0} of 16 slots filled
                {(stickers?.length || 0) >= 16 && " (Maximum reached)"}
              </p>
            </div>

            {/* 16-Slot Grid */}
            {stickersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {Array.from({ length: 16 }, (_, index) => {
                  const slotNumber = index + 1;
                  const sticker = stickers?.find(s => s.slot_number === slotNumber);
                  
                  return (
                    <Card key={slotNumber} className={sticker ? (sticker.is_active ? '' : 'opacity-50') : 'border-dashed'}>
                      <CardContent className="p-4 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Slot {slotNumber}
                        </div>
                        {sticker ? (
                          <>
                            <img
                              src={sticker.image_url}
                              alt={sticker.name}
                              className="w-full h-32 object-contain rounded bg-muted/20"
                            />
                            <p className="text-xs text-center truncate">{sticker.name}</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleActive(sticker.id, sticker.is_active)}
                                className="flex-1"
                              >
                                {sticker.is_active ? (
                                  <><EyeOff className="h-4 w-4 mr-1" /> Hide</>
                                ) : (
                                  <><Eye className="h-4 w-4 mr-1" /> Show</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(slotNumber, sticker.image_url)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-full h-32 flex items-center justify-center border-2 border-dashed rounded bg-muted/10">
                              <Upload className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setUploadFile(file);
                                  handleUpload(slotNumber);
                                }
                                e.target.value = '';
                              }}
                              className="hidden"
                              id={`slot-upload-${slotNumber}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => document.getElementById(`slot-upload-${slotNumber}`)?.click()}
                              disabled={uploading}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminCategoryStickers;
