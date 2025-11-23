import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Upload, Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useTemplateBackgrounds, uploadTemplateBackground, removeTemplateBackground, toggleBackgroundActive } from '@/hooks/useTemplateBackgrounds';
import { trips } from '@/data/trips';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminTripBackgrounds() {
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState<string>('');
  const [selectedTrip, setSelectedTrip] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Fetch Bonanza Trips category ID
  useEffect(() => {
    const fetchCategoryId = async () => {
      const { data } = await supabase
        .from('template_categories')
        .select('id')
        .eq('slug', 'bonanza-trips')
        .single();
      
      if (data) setCategoryId(data.id);
    };
    fetchCategoryId();
  }, []);

  // Fetch trip templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['trip-templates', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!categoryId,
  });

  // Fetch backgrounds for selected template
  const { backgrounds, loading: backgroundsLoading } = useTemplateBackgrounds(selectedTemplateId);

  const handleTripChange = (tripId: string) => {
    setSelectedTrip(tripId);
    const template = templates?.find(t => t.name === trips.find(tr => tr.id === tripId)?.name);
    if (template) {
      setSelectedTemplateId(template.id);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTemplateId) return;

    if (backgrounds.length >= 16) {
      toast.error('Maximum 16 backgrounds per trip');
      return;
    }

    // Find next available slot (1-16)
    const usedSlots = backgrounds.map(bg => bg.slot_number);
    const nextSlot = Array.from({ length: 16 }, (_, i) => i + 1).find(i => !usedSlots.includes(i)) ?? (backgrounds.length + 1);

    setUploading(true);
    try {
      const { url, error } = await uploadTemplateBackground(
        selectedTemplateId,
        file,
        nextSlot
      );

      if (error) {
        toast.error('Failed to upload background');
        console.error(error);
      } else {
        toast.success(`Background uploaded to slot ${nextSlot}`);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trip Backgrounds Management</h1>
            <p className="text-muted-foreground">Upload and manage backgrounds for Bonanza Trips (16 slots per trip)</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Trip</CardTitle>
            <CardDescription>Choose a trip destination to manage its backgrounds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Trip Destination</Label>
              <Select value={selectedTrip} onValueChange={handleTripChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a trip" />
                </SelectTrigger>
                <SelectContent>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.icon} {trip.name} - {trip.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplateId && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Backgrounds ({backgrounds.length}/16)</h3>
                    <p className="text-sm text-muted-foreground">Upload up to 16 backgrounds for this trip</p>
                  </div>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      disabled={uploading || backgrounds.length >= 16}
                      className="w-auto"
                    />
                    {uploading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                    )}
                  </div>
                </div>

                {backgroundsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : backgrounds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No backgrounds uploaded yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {backgrounds.map((background) => (
                      <Card key={background.id} className="overflow-hidden">
                        <div className="relative aspect-square">
                          <img
                            src={background.background_image_url}
                            alt={`Slot ${background.slot_number}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                            Slot {background.slot_number}
                          </div>
                        </div>
                        <div className="p-2 flex gap-2">
                          <Button
                            size="sm"
                            variant={background.is_active ? "default" : "outline"}
                            onClick={() => handleToggleActive(background.id, background.is_active)}
                            className="flex-1"
                          >
                            {background.is_active ? (
                              <><Eye className="h-3 w-3 mr-1" /> Active</>
                            ) : (
                              <><EyeOff className="h-3 w-3 mr-1" /> Inactive</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemove(background.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!selectedTrip && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Please select a trip to manage backgrounds</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
