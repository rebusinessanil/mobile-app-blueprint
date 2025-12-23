import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Upload, Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useTemplateStickers, uploadTemplateSticker, removeTemplateSticker, toggleStickerActive } from '@/hooks/useTemplateStickers';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/AdminGuard';
import { useNavigate } from 'react-router-dom';

export default function AdminStickerLibrary() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  
  // Refs for slot-specific file inputs
  const slotInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
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

  // Fetch templates for selected category with rank info
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates-with-ranks', selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      const { data, error } = await supabase
        .from('templates')
        .select('*, ranks(id, name, color, icon, gradient)')
        .eq('category_id', selectedCategory)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCategory,
  });

  // Fetch stickers for selected template
  const { stickers, loading: stickersLoading } = useTemplateStickers(selectedTemplate);

  // Handle slot click - open file picker for that specific slot
  const handleSlotClick = (slotNumber: number) => {
    const input = slotInputRefs.current[slotNumber];
    if (input) {
      input.click();
    }
  };

  // Handle file selection for a specific slot
  const handleSlotUpload = async (slotNumber: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTemplate) return;

    setUploadingSlot(slotNumber);
    try {
      const { url, error } = await uploadTemplateSticker(
        selectedTemplate,
        file,
        slotNumber
      );

      if (error) {
        toast.error(`Failed to upload sticker to slot ${slotNumber}`);
        console.error(error);
      } else {
        toast.success(`Sticker uploaded to slot ${slotNumber}`);
      }
    } finally {
      setUploadingSlot(null);
      event.target.value = '';
    }
  };

  // Handle bulk upload - assigns to available slots
  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedTemplate) return;

    const filesToUpload = Array.from(files).slice(0, 16);
    const usedSlots = stickers.map(s => s.slot_number);
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
        const { error } = await uploadTemplateSticker(selectedTemplate, file, slot);
        if (error) {
          failCount++;
          console.error(`Failed to upload to slot ${slot}:`, error);
        } else {
          successCount++;
        }
      } catch (err) {
        failCount++;
        console.error(`Error uploading to slot ${slot}:`, err);
      }
    }

    setBulkUploading(false);
    setUploadProgress(null);
    event.target.value = '';

    if (successCount > 0 && failCount === 0) {
      toast.success(`Successfully uploaded ${successCount} stickers!`);
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`Uploaded ${successCount} stickers. ${failCount} failed.`);
    } else {
      toast.error('Failed to upload stickers');
    }
  };

  const handleRemove = async (stickerId: string, slotNumber: number) => {
    if (!confirm(`Are you sure you want to remove the sticker from slot ${slotNumber}?`)) return;

    const { error } = await removeTemplateSticker(stickerId);
    if (error) {
      toast.error('Failed to remove sticker');
    } else {
      toast.success('Sticker removed');
    }
  };

  const handleToggleActive = async (stickerId: string, isActive: boolean) => {
    const { error } = await toggleStickerActive(stickerId, !isActive);
    if (error) {
      toast.error('Failed to update sticker status');
    } else {
      toast.success(`Sticker ${!isActive ? 'activated' : 'deactivated'}`);
    }
  };

  if (categoriesLoading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sticker Library</h1>
              <p className="text-muted-foreground">Manage stickers for banner templates (16 slots per template)</p>
            </div>
          </div>

          {/* Category Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Category</CardTitle>
              <CardDescription>Choose a banner category to manage its template stickers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories?.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedTemplate('');
                    }}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          {selectedCategory && (
            <Card>
              <CardHeader>
                <CardTitle>Select Template ({templates?.length || 0} available)</CardTitle>
                <CardDescription>Choose a template to manage its 16 sticker slots</CardDescription>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                  </div>
                ) : !templates || templates.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No templates found for this category</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {templates.map((template: any) => (
                      <Button
                        key={template.id}
                        variant={selectedTemplate === template.id ? 'default' : 'outline'}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`h-auto p-4 flex flex-col items-center gap-2 ${
                          selectedTemplate === template.id 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'bg-card hover:bg-card/80 border-primary/30'
                        }`}
                      >
                        <div className="w-full aspect-square bg-secondary rounded-lg overflow-hidden">
                          <img
                            src={template.cover_thumbnail_url}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="w-full space-y-1">
                          <span className="text-sm font-medium truncate block">{template.name}</span>
                          {template.ranks && (
                            <div className="flex items-center gap-1.5 justify-center">
                              <span className="text-lg">{template.ranks.icon}</span>
                              <span className="text-xs opacity-75 truncate">{template.ranks.name}</span>
                            </div>
                          )}
                          {!template.ranks && template.description && (
                            <span className="text-xs opacity-75 truncate block text-center">{template.description}</span>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sticker Slot Management - 16 Fixed Slots */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Template Stickers (16 Slots)</CardTitle>
                <CardDescription>
                  Click on any empty slot to upload a sticker. Click on a filled slot to replace it. Each template supports up to 16 stickers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bulk Upload Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-sticker-upload">Bulk Upload Stickers (Up to 16)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="bulk-sticker-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        multiple
                        onChange={handleBulkUpload}
                        disabled={uploadingSlot !== null || bulkUploading || stickers.length >= 16}
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
                      Select multiple images to upload. They will be assigned to available slots automatically. PNG with transparent background recommended.
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground font-medium">
                    {stickers.length} of 16 slots filled
                    {stickers.length >= 16 && " (Maximum reached)"}
                  </p>
                </div>

                {/* 16-Slot Grid */}
                {stickersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 16 }, (_, index) => {
                      const slotNumber = index + 1;
                      const sticker = stickers.find(s => s.slot_number === slotNumber);
                      const isUploading = uploadingSlot === slotNumber;

                      return (
                        <Card 
                          key={slotNumber} 
                          className={`${sticker ? (sticker.is_active ? '' : 'opacity-50') : 'border-dashed'}`}
                        >
                          <CardContent className="p-4 space-y-2">
                            {/* Hidden file input for this slot */}
                            <input
                              ref={(el) => (slotInputRefs.current[slotNumber] = el)}
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              onChange={(e) => handleSlotUpload(slotNumber, e)}
                              className="hidden"
                            />
                            
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              Slot {slotNumber}
                            </div>
                            
                            {sticker ? (
                              <>
                                {/* Square preview container - clickable for replacement */}
                                <div 
                                  onClick={() => !isUploading && handleSlotClick(slotNumber)}
                                  className="w-full aspect-square bg-secondary/30 rounded flex items-center justify-center overflow-hidden cursor-pointer hover:bg-secondary/50 transition-colors group"
                                  title="Click to replace sticker"
                                >
                                  <img
                                    src={sticker.image_url}
                                    alt={`Sticker ${slotNumber}`}
                                    className="max-w-full max-h-full object-contain group-hover:opacity-80 transition-opacity"
                                  />
                                  {isUploading && (
                                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                      <Loader2 className="h-6 w-6 animate-spin text-gold" />
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{sticker.name}</p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleActive(sticker.id, sticker.is_active ?? true)}
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
                                    onClick={() => handleRemove(sticker.id, slotNumber)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div 
                                onClick={() => !isUploading && handleSlotClick(slotNumber)}
                                className="w-full aspect-square flex items-center justify-center border-2 border-dashed rounded bg-muted/10 cursor-pointer hover:bg-muted/20 hover:border-primary/40 transition-colors"
                              >
                                {isUploading ? (
                                  <Loader2 className="h-8 w-8 animate-spin text-gold" />
                                ) : (
                                  <Upload className="h-8 w-8 text-muted-foreground/50" />
                                )}
                              </div>
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

          {/* No Selection Message */}
          {!selectedCategory && (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Select a category to manage stickers</p>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
