import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sticker, Check } from "lucide-react";
import { useCategoryStickers } from "@/hooks/useCategoryStickers";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryStickerSelectorProps {
  category: string;
  selectedStickers: string[]; // Array of sticker IDs
  onSelectSticker: (stickerId: string) => void;
  maxStickers?: number;
}

export default function CategoryStickerSelector({
  category,
  selectedStickers,
  onSelectSticker,
  maxStickers = 5
}: CategoryStickerSelectorProps) {
  const [open, setOpen] = useState(false);
  const { stickers, isLoading } = useCategoryStickers(category);

  const isSelected = (stickerId: string) => selectedStickers.includes(stickerId);
  const canAddMore = selectedStickers.length < maxStickers;

  const handleStickerClick = (stickerId: string) => {
    if (isSelected(stickerId)) {
      // Remove sticker
      onSelectSticker(stickerId);
    } else if (canAddMore) {
      // Add sticker
      onSelectSticker(stickerId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full h-12 border-2 border-primary text-foreground hover:bg-primary/10"
        >
          <Sticker className="w-5 h-5 mr-2" />
          Add Stickers ({selectedStickers.length}/{maxStickers})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-navy-dark border-2 border-primary">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            Choose Stickers for Your Banner
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select up to {maxStickers} stickers to enhance your banner
          </p>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-32 rounded-xl" />
              ))}
            </div>
          ) : stickers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Sticker className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground">No Stickers Available</p>
              <p className="text-sm text-muted-foreground mt-2">
                Admin hasn't added stickers for this category yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {stickers.map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => handleStickerClick(sticker.id)}
                  disabled={!isSelected(sticker.id) && !canAddMore}
                  className={`
                    relative gold-border rounded-xl p-3 transition-all
                    ${isSelected(sticker.id) 
                      ? 'bg-primary/20 ring-2 ring-primary' 
                      : 'bg-card hover:bg-card/80'
                    }
                    ${!isSelected(sticker.id) && !canAddMore 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:gold-glow cursor-pointer'
                    }
                  `}
                >
                  <div className="aspect-square flex items-center justify-center mb-2">
                    <img 
                      src={sticker.image_url} 
                      alt={sticker.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/100x100?text=Sticker';
                      }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-foreground text-center truncate">
                    Slot {sticker.slot_number}
                  </p>
                  
                  {isSelected(sticker.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-3 pt-4 border-t border-primary/20">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="flex-1 border-2 border-primary text-foreground"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => setOpen(false)}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Done ({selectedStickers.length} selected)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
