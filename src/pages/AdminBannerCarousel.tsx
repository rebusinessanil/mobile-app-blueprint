import { useState, useRef } from 'react';
import { motion, Reorder } from 'framer-motion';
import { ArrowLeft, Upload, Trash2, GripVertical, Eye, EyeOff, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useBannerCarouselAdmin, CarouselImage } from '@/hooks/useBannerCarousel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminGuard } from '@/components/AdminGuard';

const AdminBannerCarousel = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { images, isLoading, addImage, deleteImage, reorderImages, toggleActive } = useBannerCarouselAdmin();
  const [uploading, setUploading] = useState(false);
  const [orderedImages, setOrderedImages] = useState<CarouselImage[]>([]);

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
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      deleteImage.mutate(id);
    }
  };

  const activeCount = orderedImages.filter(img => img.is_active).length;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/30">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin')}
                className="text-foreground/70"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Banner Carousel</h1>
                <p className="text-xs text-muted-foreground">
                  {activeCount}/5 active images shown
                </p>
              </div>
            </div>
            <Button
              onClick={saveOrder}
              disabled={reorderImages.isPending}
              className="bg-primary text-primary-foreground"
            >
              {reorderImages.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save Order
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Upload Card */}
          <Card className="p-4 border-dashed border-2 border-border/50 bg-card/50">
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
              className="w-full flex flex-col items-center gap-2 py-6 text-muted-foreground hover:text-primary transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              ) : (
                <Upload className="w-8 h-8" />
              )}
              <span className="text-sm">
                {uploading ? 'Uploading...' : 'Click to upload image'}
              </span>
              <span className="text-xs text-muted-foreground/60">
                Max 5MB, JPG/PNG/WebP
              </span>
            </button>
          </Card>

          {/* Info */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-primary">
            <p>Only the first <strong>5 active</strong> images (by order) will be displayed in the carousel.</p>
          </div>

          {/* Images List */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : orderedImages.length === 0 ? (
            <Card className="p-8 text-center bg-card/50">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No carousel images yet</p>
              <p className="text-sm text-muted-foreground/60">Upload images to get started</p>
            </Card>
          ) : (
            <Reorder.Group
              axis="y"
              values={orderedImages}
              onReorder={handleReorder}
              className="space-y-3"
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
                    <Card className={`p-3 bg-card/80 border-border/30 ${!image.is_active ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                        
                        <div className="w-20 h-14 rounded-lg overflow-hidden bg-background/50 flex-shrink-0">
                          <img
                            src={image.image_url}
                            alt={`Carousel ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            Image {index + 1}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Order: {image.display_order}
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
                            onClick={() => handleDelete(image.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>
      </div>
    </AdminGuard>
  );
};

export default AdminBannerCarousel;
