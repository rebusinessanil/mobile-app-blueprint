import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useRankStickers } from '@/hooks/useRankStickers';
import { trips } from '@/data/trips';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminTripStickers = () => {
  const navigate = useNavigate();
  const [selectedTrip, setSelectedTrip] = useState<string>();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [categoryId, setCategoryId] = useState<string>('');

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

  const { stickers, loading, uploadSticker, deleteSticker } = useRankStickers(selectedTrip, categoryId);

  const handleTripChange = (tripId: string) => {
    setSelectedTrip(tripId);
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
    if (!selectedTrip || !categoryId || selectedSlot === null || !uploadFile) {
      toast.error('Please select trip, slot, and upload file');
      return;
    }

    setUploading(true);
    try {
      await uploadSticker(uploadFile, selectedSlot, uploadName || `Trip Sticker ${selectedSlot}`);
      setUploadFile(null);
      setPreviewUrl(null);
      setUploadName('');
      toast.success('Sticker uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload sticker');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (slotNum: number) => {
    if (!confirm('Are you sure you want to delete this sticker?')) return;

    const sticker = stickers.find(s => s.slot_number === slotNum);
    if (!sticker?.image_url) return;

    try {
      await deleteSticker(slotNum, sticker.image_url);
      toast.success('Sticker deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete sticker');
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
            <h1 className="text-3xl font-bold text-foreground">Trip Stickers Management</h1>
            <p className="text-muted-foreground">Upload and manage stickers for Bonanza Trips (16 slots per trip)</p>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          {/* Trip Selection */}
          <div className="space-y-2">
            <Label>Select Trip</Label>
            <Select value={selectedTrip} onValueChange={handleTripChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a trip destination" />
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

          {selectedTrip && (
            <>
              {/* Slot Grid */}
              <div className="space-y-2">
                <Label>Select Slot (1-16)</Label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((slotNum) => {
                    const sticker = stickers.find(s => s.slot_number === slotNum);
                    const isSelected = selectedSlot === slotNum;
                    
                    return (
                      <div
                        key={slotNum}
                        onClick={() => handleSlotSelect(slotNum)}
                        className={`relative aspect-square rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : sticker
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-border bg-muted hover:border-primary'
                        }`}
                      >
                        {sticker?.image_url ? (
                          <>
                            <img
                              src={sticker.image_url}
                              alt={`Slot ${slotNum}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(slotNum);
                              }}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-muted-foreground">
                            {slotNum}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedSlot !== null && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Upload Sticker for Slot {selectedSlot}</h3>
                    <Badge variant="outline">Slot {selectedSlot}</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Sticker Name (Optional)</Label>
                    <Input
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder={`Trip Sticker ${selectedSlot}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                  </div>

                  {previewUrl && (
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="border border-border rounded-lg p-4 bg-background">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-40 mx-auto rounded"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleUpload}
                    disabled={!uploadFile || uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Sticker
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {!selectedTrip && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Please select a trip to manage stickers</p>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminTripStickers;
