import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useUserRankStickers } from "@/hooks/useUserRankStickers";

interface RanksStickersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlot: number;
  rankName: string;
  rankId: string;
  selectedStickers: string[];
  onStickersChange: (stickers: string[]) => void;
}

export default function RanksStickersPanel({
  isOpen,
  onClose,
  currentSlot,
  rankName,
  rankId,
  selectedStickers,
  onStickersChange,
}: RanksStickersPanelProps) {
  const { stickers, loading } = useUserRankStickers(rankId);

  const handleStickerToggle = (stickerId: string) => {
    if (selectedStickers.includes(stickerId)) {
      onStickersChange(selectedStickers.filter((id) => id !== stickerId));
    } else {
      // Limit to 6 stickers max
      if (selectedStickers.length < 6) {
        onStickersChange([...selectedStickers, stickerId]);
      }
    }
  };

  const handleDone = () => {
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] bg-gradient-to-b from-background to-secondary/20 border-t-2 border-primary/30"
      >
        <SheetHeader className="pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Rank Stickers
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-destructive/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3 pt-3">
            <Badge variant="outline" className="border-primary text-primary px-3 py-1">
              Slot {currentSlot}
            </Badge>
            <div className="text-sm text-muted-foreground">
              {rankName}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-180px)] mt-4">
          <div className="px-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Select Rank Stickers for {rankName}
                </h3>
                <Badge variant="outline" className="border-primary text-primary">
                  {selectedStickers.length}/6
                </Badge>
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading stickers...</div>
              ) : stickers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No stickers available for this rank yet.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {stickers.map((sticker) => {
                    const isSelected = selectedStickers.includes(sticker.id);
                    const isDisabled = !isSelected && selectedStickers.length >= 6;

                    return (
                      <button
                        key={sticker.id}
                        onClick={() => handleStickerToggle(sticker.id)}
                        disabled={isDisabled}
                        className={`
                          relative aspect-square rounded-xl overflow-hidden border-2 transition-all
                          ${isSelected 
                            ? 'border-primary shadow-lg shadow-primary/20 scale-95' 
                            : 'border-border hover:border-primary/50'
                          }
                          ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <img
                          src={sticker.image_url}
                          alt={sticker.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-primary-foreground font-bold">✓</span>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-1 right-1 bg-black/70 px-2 py-0.5 rounded-full">
                          <p className="text-[9px] text-white font-medium">
                            Slot {sticker.slot_number}
                          </p>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                          <p className="text-[10px] text-white text-center font-medium truncate">
                            {sticker.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border/40">
          <Button
            onClick={handleDone}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg rounded-xl"
          >
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
