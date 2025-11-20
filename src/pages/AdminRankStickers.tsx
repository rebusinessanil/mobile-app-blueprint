import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRankStickers } from '@/hooks/useRankStickers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Rank {
  id: string;
  name: string;
  color: string;
  gradient: string;
}

const AdminRankStickers = () => {
  const navigate = useNavigate();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [selectedRank, setSelectedRank] = useState<string>();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewSticker, setPreviewSticker] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchUploading, setBatchUploading] = useState(false);

  const { stickers, loading, uploadSticker, deleteSticker, batchUploadStickers } = useRankStickers(selectedRank);

  // Load ranks on mount
  useEffect(() => {
    const loadRanks = async () => {
      const { data } = await supabase
        .from('ranks')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (data) setRanks(data);
    };
    loadRanks();
  }, []);

  const handleRankChange = (rankId: string) => {
    setSelectedRank(rankId);
    setSelectedSlot(null);
    setPreviewSticker(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewSticker(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedRank || selectedSlot === null || !uploadFile) {
      toast.error('Please select rank, slot, and upload file');
      return;
    }

    setUploading(true);
    const name = uploadName || `Slot ${selectedSlot}`;
    await uploadSticker(uploadFile, selectedSlot, name);
    setUploading(false);
    
    // Reset form
    setSelectedSlot(null);
    setUploadName('');
    setUploadFile(null);
    setPreviewSticker(null);
  };

  const handleDelete = async (slotNumber: number, imageUrl: string) => {
    if (window.confirm(`Delete sticker from Slot ${slotNumber}?`)) {
      await deleteSticker(slotNumber, imageUrl);
    }
  };

  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 16) {
      toast.error('Maximum 16 files allowed');
      setBatchFiles(files.slice(0, 16));
    } else {
      setBatchFiles(files);
    }
  };

  const handleBatchUpload = async () => {
    if (!selectedRank || batchFiles.length === 0) {
      toast.error('Please select rank and files');
      return;
    }

    setBatchUploading(true);
    await batchUploadStickers(batchFiles, 1);
    setBatchUploading(false);
    setBatchFiles([]);
    
    // Clear file input
    const fileInput = document.getElementById('batch-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const selectedRankData = ranks.find(r => r.id === selectedRank);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin')}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rank Stickers Management</h1>
          <p className="text-sm text-muted-foreground">Upload and manage 16 stickers for each rank</p>
        </div>
      </div>

      {/* Rank Selector */}
      <Card className="p-6 mb-8">
        <Label className="text-base font-semibold mb-2 block">Select Rank</Label>
        <Select value={selectedRank} onValueChange={handleRankChange}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Choose a rank" />
          </SelectTrigger>
          <SelectContent>
            {ranks.map((rank) => (
              <SelectItem key={rank.id} value={rank.id}>
                {rank.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Stickers Grid */}
      {selectedRank && (
        <>
          {/* Upload Section */}
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Upload Sticker</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Slot Number</Label>
                <Select 
                  value={selectedSlot?.toString()} 
                  onValueChange={(val) => setSelectedSlot(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        Slot {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Sticker Name (Optional)</Label>
                <Input
                  placeholder={selectedSlot ? `Slot ${selectedSlot}` : 'Enter name'}
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                />
              </div>

              <div>
                <Label>Upload Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedSlot || !uploadFile || uploading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>

            {/* Preview */}
            {previewSticker && selectedRankData && selectedSlot && (
              <div className="mt-6">
                <Label className="block mb-2">
                  Preview: Slot {selectedSlot} for {selectedRankData.name} Rank
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  This preview shows ONLY Slot {selectedSlot}. Other slots will not be affected.
                </p>
                <div 
                  className="relative w-full max-w-2xl mx-auto aspect-[4/5] rounded-xl overflow-hidden"
                  style={{ 
                    background: selectedRankData.gradient 
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img 
                      src={previewSticker} 
                      alt={`Slot ${selectedSlot} Preview`}
                      className="max-h-[60%] max-w-[60%] object-contain"
                    />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <p className="text-white text-sm font-semibold">
                      {selectedRankData.name} - Slot {selectedSlot} ONLY
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Batch Upload Section */}
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Batch Upload (Auto-Assign to Slots)</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Upload multiple stickers at once. They will be automatically assigned to Slots 1-16 in order.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Select Multiple Images (Max 16)</Label>
                <Input
                  id="batch-file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleBatchFileChange}
                  className="cursor-pointer"
                />
                {batchFiles.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {batchFiles.length} file(s) selected → Will assign to Slots 1-{batchFiles.length}
                  </p>
                )}
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleBatchUpload} 
                  disabled={batchFiles.length === 0 || batchUploading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {batchUploading ? `Uploading ${batchFiles.length} stickers...` : 'Batch Upload'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Stickers Grid */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">All 16 Slots</h2>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading stickers...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {stickers.map((sticker) => (
                  <div 
                    key={sticker.id} 
                    className="relative group"
                  >
                    <div 
                      className={`
                        aspect-square rounded-lg border-2 overflow-hidden
                        ${sticker.is_active 
                          ? 'border-primary bg-card' 
                          : 'border-dashed border-muted-foreground/20 bg-muted/10'
                        }
                      `}
                    >
                      {sticker.is_active && sticker.image_url ? (
                        <img 
                          src={sticker.image_url} 
                          alt={sticker.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          Empty
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-1 text-center">
                      <p className="text-xs font-medium text-foreground">
                        Slot {sticker.slot_number}
                      </p>
                    </div>

                    {sticker.is_active && sticker.image_url && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="icon" 
                              variant="secondary"
                              className="h-6 w-6"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Slot {sticker.slot_number} Preview</DialogTitle>
                            </DialogHeader>
                            <div 
                              className="relative w-full aspect-[4/5] rounded-xl overflow-hidden"
                              style={{ background: selectedRankData?.gradient }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center">
                                <img 
                                  src={sticker.image_url} 
                                  alt={sticker.name}
                                  className="max-h-[60%] max-w-[60%] object-contain"
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          size="icon" 
                          variant="destructive"
                          className="h-6 w-6"
                          onClick={() => handleDelete(sticker.slot_number, sticker.image_url)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {!selectedRank && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">
            Please select a rank to manage its 16 sticker slots
          </p>
        </Card>
      )}
    </div>
  );
};

export default AdminRankStickers;
