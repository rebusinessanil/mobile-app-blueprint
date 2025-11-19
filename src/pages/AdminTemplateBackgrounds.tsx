import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Upload, Trash2, Eye, EyeOff } from 'lucide-react';
import { useTemplateBackgrounds, uploadTemplateBackground, removeTemplateBackground, toggleBackgroundActive } from '@/hooks/useTemplateBackgrounds';

export default function AdminTemplateBackgrounds() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [uploading, setUploading] = useState(false);

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

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTemplate) return;

    if (backgrounds.length >= 16) {
      toast.error('Maximum 16 backgrounds per template');
      return;
    }

    // Find next available slot (1-16)
    const usedSlots = backgrounds.map(bg => bg.display_order);
    const nextSlot = Array.from({ length: 16 }, (_, i) => i + 1).find(i => !usedSlots.includes(i)) ?? (backgrounds.length + 1);

    setUploading(true);
    try {
      const { url, error } = await uploadTemplateBackground(
        selectedTemplate,
        file,
        nextSlot
      );

      if (error) {
        toast.error('Failed to upload background');
        console.error(error);
      } else {
        toast.success(`Background uploaded to slot ${nextSlot} - Updates will sync instantly`);
      }
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemove = async (backgroundId: string) => {
    if (!confirm('Are you sure you want to remove this background?')) return;

    const { error } = await removeTemplateBackground(backgroundId);
    if (error) {
      toast.error('Failed to remove background');
    } else {
      toast.success('Background removed');
    }
  };

  const handleToggleActive = async (backgroundId: string, isActive: boolean) => {
    const { error } = await toggleBackgroundActive(backgroundId, !isActive);
    if (error) {
      toast.error('Failed to update background status');
    } else {
      toast.success(`Background ${!isActive ? 'activated' : 'deactivated'}`);
    }
  };

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
        <h1 className="text-3xl font-bold text-foreground mb-2">Template Backgrounds</h1>
        <p className="text-muted-foreground">Manage background images for banner templates</p>
      </div>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Category</CardTitle>
          <CardDescription>Choose a banner category to manage templates</CardDescription>
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

      {/* Template Selection with Rank Display */}
      {selectedCategory && (
        <Card>
          <CardHeader>
            <CardTitle>Select Template ({templates?.length || 0} available)</CardTitle>
            <CardDescription>Choose a template to manage its 16 backgrounds</CardDescription>
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
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Background Management */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Template Backgrounds (16 Slots)</CardTitle>
            <CardDescription>
              Each template supports up to 16 background images. Users will only see backgrounds for the template they select.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="background-upload">Upload New Background</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="background-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleUpload}
                  disabled={uploading || backgrounds.length >= 16}
                  className="flex-1"
                />
                {uploading && <Loader2 className="h-5 w-5 animate-spin text-gold" />}
              </div>
              <p className="text-sm text-muted-foreground">
                {backgrounds.length} of 16 slots filled
                {backgrounds.length >= 16 && " (Maximum reached)"}
              </p>
            </div>

            {/* 16-Slot Grid */}
            {backgroundsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {Array.from({ length: 16 }, (_, index) => {
                  const slotNumber = index + 1; // Slots are 1-16
                  const bg = backgrounds.find(b => b.display_order === slotNumber);
                  return (
                    <Card key={slotNumber} className={bg ? (bg.is_active ? '' : 'opacity-50') : 'border-dashed'}>
                      <CardContent className="p-4 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Slot {slotNumber}
                        </div>
                        {bg ? (
                          <>
                            <img
                              src={bg.background_image_url}
                              alt={`Background ${slotNumber}`}
                              className="w-full h-32 object-cover rounded"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleActive(bg.id, bg.is_active)}
                                className="flex-1"
                              >
                                {bg.is_active ? (
                                  <><EyeOff className="h-4 w-4 mr-1" /> Hide</>
                                ) : (
                                  <><Eye className="h-4 w-4 mr-1" /> Show</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemove(bg.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-32 flex items-center justify-center border-2 border-dashed rounded bg-muted/10">
                            <Upload className="h-8 w-8 text-muted-foreground/50" />
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
    </div>
  );
}
