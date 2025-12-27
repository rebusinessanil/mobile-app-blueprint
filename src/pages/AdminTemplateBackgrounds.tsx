import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload, Trash2, Eye, EyeOff, Loader2, Search, Image, Layers } from 'lucide-react';
import GoldCoinLoader from '@/components/GoldCoinLoader';
import { useTemplateBackgrounds, uploadTemplateBackground, removeTemplateBackground, toggleBackgroundActive } from '@/hooks/useTemplateBackgrounds';
import AdminLayout from "@/components/admin/AdminLayout";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsCard from "@/components/admin/AdminStatsCard";
import { useStoriesEvents, useStoriesFestivals } from '@/hooks/useAutoStories';
import { useStoryBackgroundSlots, uploadStoryBackgroundSlot, removeStoryBackgroundSlot, toggleStoryBackgroundSlotActive } from '@/hooks/useStoryBackgroundSlots';
import { Badge } from '@/components/ui/badge';

export default function AdminTemplateBackgrounds() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [storySlotUploadProgress, setStorySlotUploadProgress] = useState<Record<number, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Fetch stories for "Stories" category
  const { events, loading: eventsLoading, refetch: refetchEvents } = useStoriesEvents();
  const { festivals, loading: festivalsLoading, refetch: refetchFestivals } = useStoriesFestivals();
  const allStories = [...events.map(e => ({ ...e, type: 'event' })), ...festivals.map(f => ({ ...f, type: 'festival' }))];

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
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

  const isStoriesCategory = categories?.find(c => c.id === selectedCategory)?.slug === 'stories';

  // Fetch templates for selected category
  const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
    queryKey: ['templates', selectedCategory],
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

  // Fetch backgrounds for selected template
  const { backgrounds, loading: backgroundsLoading } = useTemplateBackgrounds(selectedTemplate);
  
  // Fetch story background slots
  const { slots: storySlots, loading: storySlotsLoading } = useStoryBackgroundSlots(
    isStoriesCategory && selectedStory ? selectedStory.id : undefined
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchTemplates(), refetchEvents(), refetchFestivals()]);
    setRefreshing(false);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTemplate) return;

    if (backgrounds.length >= 16) {
      toast.error('Maximum 16 backgrounds per template');
      return;
    }

    const usedSlots = backgrounds.map(bg => bg.slot_number);
    const nextSlot = Array.from({ length: 16 }, (_, i) => i + 1).find(i => !usedSlots.includes(i)) ?? (backgrounds.length + 1);

    setUploading(true);
    try {
      const { url, error } = await uploadTemplateBackground(selectedTemplate, file, nextSlot);
      if (error) {
        toast.error('Failed to upload background');
      } else {
        toast.success(`Background uploaded to slot ${nextSlot}`);
      }
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedTemplate) return;

    const filesToUpload = Array.from(files).slice(0, 16);
    const usedSlots = backgrounds.map(bg => bg.slot_number);
    const availableSlots = Array.from({ length: 16 }, (_, i) => i + 1).filter(i => !usedSlots.includes(i));

    if (availableSlots.length === 0) {
      toast.error('All 16 slots are filled');
      return;
    }

    setBulkUploading(true);
    setUploadProgress({ current: 0, total: Math.min(filesToUpload.length, availableSlots.length) });

    let successCount = 0;
    for (let i = 0; i < Math.min(filesToUpload.length, availableSlots.length); i++) {
      const file = filesToUpload[i];
      const slot = availableSlots[i];
      setUploadProgress({ current: i + 1, total: Math.min(filesToUpload.length, availableSlots.length) });
      try {
        const { error } = await uploadTemplateBackground(selectedTemplate, file, slot);
        if (!error) successCount++;
      } catch (err) {}
    }

    setBulkUploading(false);
    setUploadProgress(null);
    event.target.value = '';
    toast.success(`Uploaded ${successCount} backgrounds`);
  };

  const handleRemove = async (backgroundId: string) => {
    if (!confirm('Remove this background?')) return;
    const { error } = await removeTemplateBackground(backgroundId);
    if (error) toast.error('Failed to remove');
    else toast.success('Removed');
  };

  const handleToggleActive = async (backgroundId: string, isActive: boolean) => {
    const { error } = await toggleBackgroundActive(backgroundId, !isActive);
    if (error) toast.error('Failed to update');
    else toast.success(`${!isActive ? 'Activated' : 'Deactivated'}`);
  };

  const handleStorySlotUpload = async (file: File, slotNumber: number) => {
    if (!selectedStory) return;
    setStorySlotUploadProgress(prev => ({ ...prev, [slotNumber]: 0 }));
    const result = await uploadStoryBackgroundSlot(selectedStory.id, slotNumber, file);
    if (result.error) toast.error(`Failed to upload slot ${slotNumber}`);
    else toast.success(`Slot ${slotNumber} uploaded`);
    setStorySlotUploadProgress(prev => ({ ...prev, [slotNumber]: 100 }));
    setTimeout(() => {
      setStorySlotUploadProgress(prev => {
        const updated = { ...prev };
        delete updated[slotNumber];
        return updated;
      });
    }, 1000);
  };

  const handleStorySlotBulkUpload = async (files: FileList) => {
    if (!selectedStory) return;
    const filesArray = Array.from(files);
    const availableSlots = Array.from({ length: 16 }, (_, i) => i + 1).filter(
      slot => !storySlots.some(s => s.slot_number === slot)
    );
    if (filesArray.length > availableSlots.length) {
      toast.error(`Only ${availableSlots.length} slots available`);
      return;
    }
    for (let i = 0; i < filesArray.length; i++) {
      await handleStorySlotUpload(filesArray[i], availableSlots[i]);
    }
  };

  const totalBackgrounds = backgrounds.length;
  const activeBackgrounds = backgrounds.filter(b => b.is_active).length;

  if (categoriesLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <GoldCoinLoader size="lg" message="Loading..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminHeader 
        title="Template Backgrounds" 
        subtitle="Manage background images" 
        onRefresh={handleRefresh} 
        isRefreshing={refreshing} 
      />

      <div className="p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <AdminStatsCard icon={<Layers className="w-5 h-5" />} value={categories?.length || 0} label="Categories" />
          <AdminStatsCard icon={<Image className="w-5 h-5" />} value={templates?.length || 0} label="Templates" iconColor="text-blue-500" />
          <AdminStatsCard icon={<Upload className="w-5 h-5" />} value={totalBackgrounds} label="Backgrounds" iconColor="text-green-500" />
          <AdminStatsCard icon={<Eye className="w-5 h-5" />} value={activeBackgrounds} label="Active" iconColor="text-primary" />
        </div>

        {/* Category Selection */}
        <div className="bg-card border border-primary/20 rounded-2xl p-4">
          <h3 className="font-semibold text-foreground mb-3">Select Category</h3>
          <div className="grid grid-cols-3 gap-2">
            {categories?.map((category) => (
              <button
                key={category.id}
                onClick={() => { setSelectedCategory(category.id); setSelectedTemplate(''); setSelectedStory(null); }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedCategory === category.id 
                    ? 'bg-[#E5B80B] text-black border-[#E5B80B]' 
                    : 'bg-card border-primary/20 text-foreground hover:border-primary/40'
                }`}
              >
                <span className="text-lg block mb-1">{category.icon}</span>
                <span className="text-xs font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Story Selection for Stories Category */}
        {isStoriesCategory && (
          <div className="bg-card border border-primary/20 rounded-2xl p-4">
            <h3 className="font-semibold text-foreground mb-3">Select Story ({allStories.length})</h3>
            {eventsLoading || festivalsLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : allStories.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No stories found</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {allStories.map((story: any) => {
                  const isEvent = story.type === 'event';
                  const storyTitle = isEvent ? story.person_name : story.festival_name;
                  return (
                    <button
                      key={story.id}
                      onClick={() => setSelectedStory(story)}
                      className={`rounded-xl overflow-hidden border transition-all ${
                        selectedStory?.id === story.id ? 'border-primary shadow-lg' : 'border-primary/20 hover:border-primary/40'
                      }`}
                    >
                      <div className="aspect-square bg-muted">
                        <img src={story.poster_url} alt={storyTitle} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-1.5 bg-card">
                        <p className="text-[10px] font-medium truncate">{storyTitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Template Selection */}
        {selectedCategory && !isStoriesCategory && (
          <div className="bg-card border border-primary/20 rounded-2xl p-4">
            <h3 className="font-semibold text-foreground mb-3">Select Template ({templates?.length || 0})</h3>
            {templatesLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : !templates || templates.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No templates found</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {templates.map((template: any) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`rounded-xl overflow-hidden border transition-all ${
                      selectedTemplate === template.id ? 'border-primary shadow-lg' : 'border-primary/20 hover:border-primary/40'
                    }`}
                  >
                    <div className="aspect-square bg-muted">
                      <img src={template.cover_thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-1.5 bg-card">
                      <p className="text-[10px] font-medium truncate">{template.name}</p>
                      {template.ranks && (
                        <p className="text-[9px] text-muted-foreground truncate">{template.ranks.icon} {template.ranks.name}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Background Slots for Template */}
        {selectedTemplate && !isStoriesCategory && (
          <div className="bg-card border border-primary/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Backgrounds ({backgrounds.length}/16)</h3>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <Input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
                  <Button variant="outline" size="sm" className="border-primary/30" asChild disabled={uploading}>
                    <span>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}</span>
                  </Button>
                </label>
                <label className="cursor-pointer">
                  <Input type="file" accept="image/*" multiple onChange={handleBulkUpload} className="hidden" disabled={bulkUploading} />
                  <Button variant="outline" size="sm" className="border-primary/30" asChild disabled={bulkUploading}>
                    <span>Bulk</span>
                  </Button>
                </label>
              </div>
            </div>
            {uploadProgress && (
              <div className="text-xs text-muted-foreground text-center">
                Uploading {uploadProgress.current}/{uploadProgress.total}...
              </div>
            )}
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 16 }, (_, i) => i + 1).map(slotNum => {
                const bg = backgrounds.find(b => b.slot_number === slotNum);
                return (
                  <div key={slotNum} className={`aspect-square rounded-lg border-2 border-dashed ${bg ? 'border-primary/40' : 'border-primary/20'} overflow-hidden relative`}>
                    {bg ? (
                      <>
                        <img src={bg.background_image_url} alt={`Slot ${slotNum}`} className={`w-full h-full object-cover ${!bg.is_active ? 'opacity-50' : ''}`} />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleToggleActive(bg.id, bg.is_active ?? true)}>
                            {bg.is_active ? <Eye className="w-3 h-3 text-white" /> : <EyeOff className="w-3 h-3 text-white" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemove(bg.id)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">{slotNum}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Story Background Slots */}
        {isStoriesCategory && selectedStory && (
          <div className="bg-card border border-primary/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Story Backgrounds ({storySlots.length}/16)</h3>
                <p className="text-xs text-muted-foreground">{selectedStory.type === 'event' ? selectedStory.person_name : selectedStory.festival_name}</p>
              </div>
              <label className="cursor-pointer">
                <Input type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleStorySlotBulkUpload(e.target.files)} className="hidden" />
                <Button variant="outline" size="sm" className="border-primary/30" asChild>
                  <span><Upload className="w-4 h-4 mr-1" />Bulk</span>
                </Button>
              </label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 16 }, (_, i) => i + 1).map(slotNum => {
                const slot = storySlots.find(s => s.slot_number === slotNum);
                return (
                  <div key={slotNum} className={`aspect-square rounded-lg border-2 border-dashed ${slot ? 'border-primary/40' : 'border-primary/20'} overflow-hidden relative`}>
                    {slot ? (
                      <>
                        <img src={slot.image_url} alt={`Slot ${slotNum}`} className={`w-full h-full object-cover ${!slot.is_active ? 'opacity-50' : ''}`} />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleStoryBackgroundSlotActive(slot.id, !(slot.is_active ?? true))}>
                            {slot.is_active ? <Eye className="w-3 h-3 text-white" /> : <EyeOff className="w-3 h-3 text-white" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStoryBackgroundSlot(slot.id)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                        <Input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleStorySlotUpload(e.target.files[0], slotNum)} />
                        <span className="text-xs text-muted-foreground">{slotNum}</span>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
