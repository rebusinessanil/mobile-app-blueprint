import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Upload, Trash2, Eye, EyeOff, Move } from 'lucide-react';
import { useStickerSlots, uploadStickerSlot, removeStickerSlot, toggleStickerSlotActive } from '@/hooks/useStickerSlots';
import { Badge } from '@/components/ui/badge';

export default function AdminStickerManagement() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  // Fetch template categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['template-categories-stickers'],
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

  const selectedCategorySlug = categories?.find(c => c.id === selectedCategory)?.slug;

  // Fetch templates/entities based on category
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates-for-stickers', selectedCategory],
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

  // Fetch ranks for rank-promotion category
  const { data: ranks, isLoading: ranksLoading } = useQuery({
    queryKey: ['ranks-for-stickers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: selectedCategorySlug === 'rank-promotion',
  });

  // Fetch bonanza trips
  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['trips-for-stickers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bonanza_trips')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: selectedCategorySlug === 'bonanza',
  });

  // Fetch birthdays
  const { data: birthdays, isLoading: birthdaysLoading } = useQuery({
    queryKey: ['birthdays-for-stickers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Birthday')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: selectedCategorySlug === 'birthday',
  });

  // Fetch anniversaries
  const { data: anniversaries, isLoading: anniversariesLoading } = useQuery({
    queryKey: ['anniversaries-for-stickers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Anniversary')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: selectedCategorySlug === 'anniversary',
  });

  // Fetch motivational banners
  const { data: motivationals, isLoading: motivationalsLoading } = useQuery({
    queryKey: ['motivationals-for-stickers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Motivational Banner')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: selectedCategorySlug === 'motivational',
  });

  // Determine sticker slot options based on selection
  const getStickerSlotOptions = () => {
    if (selectedCategorySlug === 'rank-promotion' && selectedEntity) {
      return { rankId: selectedEntity.id };
    }
    if (selectedCategorySlug === 'bonanza' && selectedEntity) {
      return { tripId: selectedEntity.id, bannerCategory: 'bonanza' };
    }
    if (selectedCategorySlug === 'birthday' && selectedEntity) {
      return { birthdayId: selectedEntity.id, bannerCategory: 'birthday' };
    }
    if (selectedCategorySlug === 'anniversary' && selectedEntity) {
      return { anniversaryId: selectedEntity.id, bannerCategory: 'anniversary' };
    }
    if (selectedCategorySlug === 'motivational' && selectedEntity) {
      return { motivationalBannerId: selectedEntity.id, bannerCategory: 'motivational' };
    }
    if (selectedCategory && selectedCategorySlug) {
      return { bannerCategory: selectedCategorySlug };
    }
    return {};
  };

  const slotOptions = getStickerSlotOptions();
  const hasValidSelection = Object.keys(slotOptions).length > 0;

  // Fetch sticker slots
  const { slots, loading: slotsLoading, refetch } = useStickerSlots(slotOptions);

  // Get entity list based on category
  const getEntityList = () => {
    if (selectedCategorySlug === 'rank-promotion') return ranks || [];
    if (selectedCategorySlug === 'bonanza') return trips || [];
    if (selectedCategorySlug === 'birthday') return birthdays || [];
    if (selectedCategorySlug === 'anniversary') return anniversaries || [];
    if (selectedCategorySlug === 'motivational') return motivationals || [];
    return templates || [];
  };

  const entityList = getEntityList();
  const isEntityLoading = ranksLoading || tripsLoading || birthdaysLoading || anniversariesLoading || motivationalsLoading || templatesLoading;

  // Get entity display info
  const getEntityDisplay = (entity: any) => {
    if (selectedCategorySlug === 'rank-promotion') {
      return { title: entity.name, image: entity.icon, subtitle: entity.color };
    }
    if (selectedCategorySlug === 'bonanza') {
      return { title: entity.title, image: entity.trip_image_url, subtitle: entity.short_title };
    }
    if (selectedCategorySlug === 'birthday') {
      return { title: entity.title, image: entity.Birthday_image_url, subtitle: entity.short_title };
    }
    if (selectedCategorySlug === 'anniversary') {
      return { title: entity.title, image: entity.Anniversary_image_url, subtitle: entity.short_title };
    }
    if (selectedCategorySlug === 'motivational') {
      return { title: entity.title, image: entity.Motivational_image_url, subtitle: entity.short_title };
    }
    return { title: entity.name, image: entity.cover_thumbnail_url, subtitle: entity.description };
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, slotNumber: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { error } = await uploadStickerSlot(file, slotNumber, slotOptions);

      if (error) {
        toast.error('Failed to upload sticker');
        console.error(error);
      } else {
        toast.success(`Sticker uploaded to slot ${slotNumber}`);
        refetch();
      }
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesToUpload = Array.from(files).slice(0, 16);
    const usedSlots = slots.map(s => s.slot_number);
    const availableSlots = Array.from({ length: 16 }, (_, i) => i + 1).filter(i => !usedSlots.includes(i));

    if (availableSlots.length === 0) {
      toast.error('All 16 slots are filled. Delete some stickers first.');
      return;
    }

    if (filesToUpload.length > availableSlots.length) {
      toast.warning(`Only ${availableSlots.length} slots available.`);
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
        const { error } = await uploadStickerSlot(file, slot, slotOptions);
        if (error) {
          failCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        failCount++;
      }
    }

    setBulkUploading(false);
    setUploadProgress(null);
    event.target.value = '';
    refetch();

    if (successCount > 0 && failCount === 0) {
      toast.success(`Successfully uploaded ${successCount} stickers!`);
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`Uploaded ${successCount} stickers. ${failCount} failed.`);
    } else {
      toast.error('Failed to upload stickers');
    }
  };

  const handleRemove = async (stickerId: string, slotNumber: number) => {
    if (!confirm(`Remove sticker from slot ${slotNumber}?`)) return;

    const { error } = await removeStickerSlot(stickerId);
    if (error) {
      toast.error('Failed to remove sticker');
    } else {
      toast.success('Sticker removed');
      refetch();
    }
  };

  const handleToggleActive = async (stickerId: string, isActive: boolean, slotNumber: number) => {
    const { error } = await toggleStickerSlotActive(stickerId, !isActive);
    if (error) {
      toast.error('Failed to update sticker status');
    } else {
      toast.success(`Slot ${slotNumber} ${!isActive ? 'activated' : 'deactivated'}`);
      refetch();
    }
  };

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Sticker Slot Management</h1>
        <p className="text-muted-foreground">Manage sticker overlays for banner templates (16 slots per entity)</p>
      </div>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Category</CardTitle>
          <CardDescription>Choose a banner category to manage stickers</CardDescription>
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
                  setSelectedEntity(null);
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

      {/* Entity Selection */}
      {selectedCategory && (
        <Card>
          <CardHeader>
            <CardTitle>
              Select {selectedCategorySlug === 'rank-promotion' ? 'Rank' : 
                     selectedCategorySlug === 'bonanza' ? 'Trip' :
                     selectedCategorySlug === 'birthday' ? 'Birthday Template' :
                     selectedCategorySlug === 'anniversary' ? 'Anniversary Template' :
                     selectedCategorySlug === 'motivational' ? 'Motivational Banner' : 'Template'}
              {' '}({entityList.length} available)
            </CardTitle>
            <CardDescription>Choose an entity to manage its 16 sticker slots</CardDescription>
          </CardHeader>
          <CardContent>
            {isEntityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : entityList.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No items found for this category</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {entityList.map((entity: any) => {
                  const display = getEntityDisplay(entity);
                  const isRank = selectedCategorySlug === 'rank-promotion';
                  
                  return (
                    <Button
                      key={entity.id}
                      variant={selectedEntity?.id === entity.id ? 'default' : 'outline'}
                      onClick={() => setSelectedEntity(entity)}
                      className={`h-auto p-4 flex flex-col items-center gap-2 ${
                        selectedEntity?.id === entity.id 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-card hover:bg-card/80 border-primary/30'
                      }`}
                    >
                      {isRank ? (
                        <span className="text-4xl">{display.image}</span>
                      ) : (
                        <div className="w-full aspect-square bg-secondary rounded-lg overflow-hidden">
                          <img
                            src={display.image}
                            alt={display.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="w-full space-y-1">
                        <span className="text-sm font-medium truncate block text-center">{display.title}</span>
                        {display.subtitle && (
                          <span className="text-xs opacity-75 truncate block text-center">{display.subtitle}</span>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sticker Slot Management */}
      {hasValidSelection && selectedEntity && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sticker Slots (16 Slots)</CardTitle>
                <CardDescription>
                  Upload and manage sticker overlays for each slot
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleBulkUpload}
                  className="hidden"
                  id="bulk-sticker-upload"
                  disabled={bulkUploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('bulk-sticker-upload')?.click()}
                  disabled={bulkUploading || slots.length >= 16}
                >
                  {bulkUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {uploadProgress && `${uploadProgress.current}/${uploadProgress.total}`}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg border border-primary/20">
              <h3 className="font-semibold text-sm mb-2">Selected: {getEntityDisplay(selectedEntity).title}</h3>
              <p className="text-sm text-muted-foreground">
                {slots.length} of 16 slots filled
                {slots.length >= 16 && ' (Maximum reached)'}
              </p>
            </div>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 16 }, (_, index) => {
                  const slotNumber = index + 1;
                  const slot = slots.find(s => s.slot_number === slotNumber);
                  
                  return (
                    <Card key={slotNumber} className={slot ? (slot.is_active ? '' : 'opacity-50') : 'border-dashed'}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Slot {slotNumber}
                          </span>
                          {slot && (
                            <Badge variant={slot.is_active ? 'default' : 'secondary'} className="text-[10px]">
                              {slot.is_active ? 'Active' : 'Hidden'}
                            </Badge>
                          )}
                        </div>
                        
                        {slot ? (
                          <>
                            <div className="relative aspect-square bg-secondary rounded-lg overflow-hidden">
                              <img
                                src={slot.image_url}
                                alt={`Sticker ${slotNumber}`}
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute bottom-1 right-1 bg-background/80 rounded px-1.5 py-0.5">
                                <Move className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleActive(slot.id, slot.is_active, slotNumber)}
                                className="flex-1"
                              >
                                {slot.is_active ? (
                                  <><EyeOff className="h-4 w-4 mr-1" /> Hide</>
                                ) : (
                                  <><Eye className="h-4 w-4 mr-1" /> Show</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemove(slot.id, slotNumber)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-full aspect-square flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/10">
                              <Upload className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUpload(e, slotNumber)}
                              className="hidden"
                              id={`sticker-slot-${slotNumber}`}
                              disabled={uploading}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => document.getElementById(`sticker-slot-${slotNumber}`)?.click()}
                              disabled={uploading}
                            >
                              {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload
                                </>
                              )}
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
}
