import { useState } from 'react';
import { Upload, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useRankStickers } from '@/hooks/useRankStickers';

interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

interface RankCategoryStickerGridProps {
  rankId: string;
  rankName: string;
  category: TemplateCategory;
  defaultOpen?: boolean;
}

const RankCategoryStickerGrid = ({ 
  rankId, 
  rankName, 
  category, 
  defaultOpen = false 
}: RankCategoryStickerGridProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { stickers, loading, uploadSticker, deleteSticker } = useRankStickers(rankId, category.id);

  // Count filled slots
  const filledSlots = stickers.filter(s => s.image_url && s.is_active).length;

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
    if (selectedSlot === null || !uploadFile) return;

    setUploading(true);
    const name = uploadName || `Slot ${selectedSlot}`;
    await uploadSticker(uploadFile, selectedSlot, name);
    setUploading(false);
    
    setUploadFile(null);
    setPreviewUrl(null);
    setUploadName('');
  };

  const handleDelete = async (slotNumber: number, imageUrl: string) => {
    if (window.confirm(`Delete sticker from Slot ${slotNumber}?`)) {
      await deleteSticker(slotNumber, imageUrl);
      if (selectedSlot === slotNumber) {
        setSelectedSlot(null);
      }
    }
  };

  const currentSlotSticker = stickers.find(s => s.slot_number === selectedSlot);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{category.icon || '📁'}</span>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">{category.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {filledSlots}/16 stickers uploaded
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={filledSlots > 0 ? "default" : "secondary"} className="text-xs">
                {filledSlots} stickers
              </Badge>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 border-t">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* 16 Slot Grid */}
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Click a slot to upload or manage sticker for <span className="font-medium text-foreground">{rankName}</span>
                  </p>
                  <div className="grid grid-cols-8 gap-2">
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((slotNum) => {
                      const slotSticker = stickers.find(s => s.slot_number === slotNum);
                      const isSelected = selectedSlot === slotNum;
                      const hasSicker = slotSticker?.image_url && slotSticker?.is_active;
                      
                      return (
                        <button
                          key={slotNum}
                          onClick={() => handleSlotSelect(slotNum)}
                          className={`
                            relative aspect-square rounded-lg border-2 transition-all
                            ${isSelected 
                              ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30' 
                              : hasSicker
                                ? 'border-green-500/50 bg-green-500/5 hover:border-green-500'
                                : 'border-border hover:border-primary/50 bg-muted/20'
                            }
                          `}
                        >
                          {hasSicker ? (
                            <div className="absolute inset-0 p-0.5">
                              <img
                                src={slotSticker.image_url}
                                alt={slotSticker.name}
                                className="w-full h-full object-contain rounded"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(slotNum, slotSticker.image_url);
                                }}
                                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-lg hover:bg-destructive/90"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[10px] font-medium text-muted-foreground">{slotNum}</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Upload Form - Shows when slot is selected */}
                {selectedSlot !== null && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                    <h4 className="text-sm font-semibold mb-3">
                      Upload to Slot {selectedSlot}
                    </h4>

                    {currentSlotSticker?.image_url && currentSlotSticker?.is_active && (
                      <div className="mb-4 p-3 bg-background rounded-lg border flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded border p-1">
                          <img 
                            src={currentSlotSticker.image_url} 
                            alt={currentSlotSticker.name} 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{currentSlotSticker.name}</p>
                          <p className="text-xs text-muted-foreground">Current sticker</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`sticker-name-${category.id}-${selectedSlot}`} className="text-xs">
                          Name (Optional)
                        </Label>
                        <Input
                          id={`sticker-name-${category.id}-${selectedSlot}`}
                          value={uploadName}
                          onChange={(e) => setUploadName(e.target.value)}
                          placeholder="e.g., Trophy, Badge..."
                          className="mt-1 h-8 text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`sticker-file-${category.id}-${selectedSlot}`} className="text-xs">
                          Upload Image
                        </Label>
                        <Input
                          id={`sticker-file-${category.id}-${selectedSlot}`}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="mt-1 h-8 text-sm cursor-pointer"
                        />
                      </div>

                      {previewUrl && (
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-background rounded-lg border p-2">
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                          </div>
                          <span className="text-xs text-muted-foreground">Preview</span>
                        </div>
                      )}

                      <Button 
                        onClick={handleUpload} 
                        disabled={!uploadFile || uploading} 
                        size="sm"
                        className="w-full"
                      >
                        <Upload className="mr-2 h-3 w-3" />
                        {uploading ? 'Uploading...' : currentSlotSticker?.image_url ? 'Replace Sticker' : 'Upload Sticker'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default RankCategoryStickerGrid;
