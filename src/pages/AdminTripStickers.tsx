import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useStickerCategories } from '@/hooks/useStickers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';

const TRIP_CATEGORY_ID = 'bonanza-trips';

const AdminTripStickers = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stickers, setStickers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadType, setUploadType] = useState<'sticker' | 'background'>('sticker');

  const { categories } = useStickerCategories();

  // Set first category as default
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  // Load stickers/backgrounds for selected category and slot
  useEffect(() => {
    const loadAssets = async () => {
      if (!selectedCategory || selectedSlot === null) return;
      
      setLoading(true);
      try {
        if (uploadType === 'sticker') {
          const { data } = await supabase
            .from('stickers')
            .select('*')
            .eq('category_id', selectedCategory)
            .eq('slot_number', selectedSlot)
            .is('rank_id', null);
          
          setStickers(data || []);
        } else {
          const { data } = await supabase
            .from('template_backgrounds')
            .select('*')
            .eq('template_id', TRIP_CATEGORY_ID)
            .eq('slot_number', selectedSlot);
          
          setStickers(data || []);
        }
      } catch (error) {
        console.error('Error loading assets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, [selectedCategory, selectedSlot, uploadType]);

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
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      if (!uploadName) {
        setUploadName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !selectedCategory || selectedSlot === null || !uploadName.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    setUploading(true);
    try {
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${TRIP_CATEGORY_ID}-${selectedCategory}-slot${selectedSlot}-${Date.now()}.${fileExt}`;
      const bucketName = uploadType === 'sticker' ? 'stickers' : 'template-backgrounds';
      
      // Upload to storage
      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(fileName, uploadFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      // Insert/update database record
      if (uploadType === 'sticker') {
        const { error: dbError } = await supabase
          .from('stickers')
          .upsert({
            category_id: selectedCategory,
            slot_number: selectedSlot,
            rank_id: null,
            name: uploadName,
            image_url: publicUrl,
            is_active: true,
            display_order: selectedSlot
          }, {
            onConflict: 'category_id,slot_number',
            ignoreDuplicates: false
          });

        if (dbError) throw dbError;
      } else {
        const { error: dbError } = await supabase
          .from('template_backgrounds')
          .upsert({
            template_id: TRIP_CATEGORY_ID,
            slot_number: selectedSlot,
            background_image_url: publicUrl,
            is_active: true
          }, {
            onConflict: 'template_id,slot_number',
            ignoreDuplicates: false
          });

        if (dbError) throw dbError;
      }

      toast.success(`${uploadType === 'sticker' ? 'Sticker' : 'Background'} uploaded successfully`);
      
      // Reset form
      setUploadFile(null);
      setPreviewUrl(null);
      setUploadName('');
      
      // Reload assets
      const reloadEvent = new Event('reload');
      window.dispatchEvent(reloadEvent);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (assetId: string, imageUrl: string) => {
    if (!confirm(`Delete this ${uploadType}?`)) return;

    try {
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const bucketName = uploadType === 'sticker' ? 'stickers' : 'template-backgrounds';

      // Delete from storage
      await supabase.storage.from(bucketName).remove([fileName]);

      // Delete from database
      const tableName = uploadType === 'sticker' ? 'stickers' : 'template_backgrounds';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', assetId);

      if (error) throw error;

      toast.success(`${uploadType === 'sticker' ? 'Sticker' : 'Background'} deleted`);
      
      // Reload assets
      const reloadEvent = new Event('reload');
      window.dispatchEvent(reloadEvent);
      
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Delete failed');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Trip Assets Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage backgrounds and stickers for Bonanza Trips (16 slots)
            </p>
          </div>
        </div>

        {/* Asset Type Toggle */}
        <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as 'sticker' | 'background')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sticker">Stickers</TabsTrigger>
            <TabsTrigger value="background">Backgrounds</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category Selection */}
        <Card className="p-6">
          <Label>Select Category</Label>
          <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="mt-2">
            <TabsList>
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id}>
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </Card>

        {/* Slot Grid */}
        <Card className="p-6">
          <Label className="mb-4 block">Select Slot (1-16)</Label>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 16 }, (_, i) => i + 1).map((slotNum) => (
              <Button
                key={slotNum}
                variant={selectedSlot === slotNum ? 'default' : 'outline'}
                onClick={() => handleSlotSelect(slotNum)}
                className="h-16"
              >
                Slot {slotNum}
              </Button>
            ))}
          </div>
        </Card>

        {/* Upload Section */}
        {selectedSlot !== null && selectedCategory && (
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">
              Upload {uploadType === 'sticker' ? 'Sticker' : 'Background'} for Slot {selectedSlot}
            </h3>

            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder={`Enter ${uploadType} name`}
              />
            </div>

            <div>
              <Label>Upload Image</Label>
              <div className="mt-2">
                {!previewUrl ? (
                  <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary">
                    <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload {uploadType}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded-lg bg-muted"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setPreviewUrl(null);
                        setUploadFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || !uploadFile}
              className="w-full"
            >
              {uploading ? 'Uploading...' : `Upload ${uploadType === 'sticker' ? 'Sticker' : 'Background'}`}
            </Button>
          </Card>
        )}

        {/* Current Assets */}
        {selectedSlot !== null && stickers.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">
              Current {uploadType === 'sticker' ? 'Stickers' : 'Backgrounds'} in Slot {selectedSlot}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stickers.map((asset) => (
                <div key={asset.id} className="relative group">
                  <img
                    src={uploadType === 'sticker' ? asset.image_url : asset.background_image_url}
                    alt={asset.name || 'Asset'}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Badge className="absolute top-2 left-2">
                    {asset.name || `Slot ${selectedSlot}`}
                  </Badge>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(
                      asset.id,
                      uploadType === 'sticker' ? asset.image_url : asset.background_image_url
                    )}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTripStickers;
