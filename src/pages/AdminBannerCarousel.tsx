import { useState, useRef } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Upload, Trash2, GripVertical, Eye, EyeOff, Image as ImageIcon, Loader2, Save, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useBannerCarouselAdmin, CarouselImage } from '@/hooks/useBannerCarousel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminStatsCard from '@/components/admin/AdminStatsCard';
import PremiumGlobalLoader from '@/components/PremiumGlobalLoader';

const AdminBannerCarousel = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { images, isLoading, addImage, deleteImage, reorderImages, toggleActive } = useBannerCarouselAdmin();
  const [uploading, setUploading] = useState(false);
  const [orderedImages, setOrderedImages] = useState<CarouselImage[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Sync orderedImages with fetched images
  useState(() => {
    if (images.length > 0 && orderedImages.length === 0) {
      setOrderedImages(images);
    }
  });

  // Update orderedImages when images change
  if (images.length !== orderedImages.length || images.some((img, i) => img.id !== orderedImages[i]?.id)) {
    setOrderedImages(images);
  }

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `carousel-${Date.now()}.${fileExt}`;
      const filePath = `banner-carousel/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('template-covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('template-covers')
        .getPublicUrl(filePath);

      await addImage.mutateAsync(publicUrl);
      toast.success('Image uploaded');
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReorder = (newOrder: CarouselImage[]) => {
    setOrderedImages(newOrder);
  };

  const saveOrder = () => {
    const updates = orderedImages.map((img, index) => ({
      id: img.id,
      display_order: index,
    }));
    reorderImages.mutate(updates);
    toast.success('Order saved');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this image?')) {
      deleteImage.mutate(id);
    }
  };

  const activeCount = orderedImages.filter(img => img.is_active).length;
  const totalCount = orderedImages.length;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <PremiumGlobalLoader size="lg" message="Loading carousel..." fullScreen={false} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminHeader 
        title="Banner Carousel" 
        subtitle={`${activeCount}/5 active shown`} 
        onRefresh={handleRefresh} 
        isRefreshing={refreshing} 
      />

      <div className="p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <AdminStatsCard icon={<ImageIcon className="w-5 h-5" />} value={totalCount} label="Total Images" />
          <AdminStatsCard icon={<Eye className="w-5 h-5" />} value={activeCount} label="Active" iconColor="text-green-500" />
          <AdminStatsCard icon={<EyeOff className="w-5 h-5" />} value={totalCount - activeCount} label="Inactive" iconColor="text-muted-foreground" />
          <AdminStatsCard icon={<LayoutGrid className="w-5 h-5" />} value={5} label="Max Shown" iconColor="text-primary" />
        </div>

        {/* Upload Card */}
        <div className="bg-card border-2 border-dashed border-primary/30 rounded-2xl p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
            <span className="text-sm font-medium">
              {uploading ? 'Uploading...' : 'Click to upload image'}
            </span>
            <span className="text-xs text-muted-foreground/60">
              Max 5MB, JPG/PNG/WebP
            </span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
          <p className="text-sm text-primary">
            Only the first <strong>5 active</strong> images (by order) will be displayed in the carousel.
          </p>
        </div>

        {/* Save Order Button */}
        {orderedImages.length > 0 && (
          <Button
            onClick={saveOrder}
            disabled={reorderImages.isPending}
            className="w-full bg-[#E5B80B] hover:bg-[#E5B80B]/90 text-black font-semibold"
          >
            {reorderImages.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Order
          </Button>
        )}

        {/* Images List */}
        {orderedImages.length === 0 ? (
          <div className="bg-card border border-primary/20 rounded-2xl p-8 text-center">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No carousel images yet</p>
            <p className="text-sm text-muted-foreground/60">Upload images to get started</p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={orderedImages}
            onReorder={handleReorder}
            className="space-y-2"
          >
            {orderedImages.map((image, index) => (
              <Reorder.Item
                key={image.id}
                value={image}
                className="cursor-grab active:cursor-grabbing"
              >
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className={`bg-card border border-primary/20 rounded-2xl p-3 hover:border-primary/40 transition-all ${!image.is_active ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                      
                      <div className="w-16 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={image.image_url}
                          alt={`Carousel ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          Image {index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Position: {image.display_order}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          {image.is_active ? (
                            <Eye className="w-4 h-4 text-green-500" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                          <Switch
                            checked={image.is_active}
                            onCheckedChange={(checked) => 
                              toggleActive.mutate({ id: image.id, is_active: checked })
                            }
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(image.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBannerCarousel;
