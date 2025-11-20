import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import StickerSelector from "@/components/StickerSelector";
import { Badge } from "@/components/ui/badge";

interface RankSlot {
  slot_number: number;
  rank_name: string;
  selectedStickers: string[];
}

interface RanksStickersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlot: number;
  rankName: string;
  selectedStickers: string[];
  onStickersChange: (stickers: string[]) => void;
}

export default function RanksStickersPanel({
  isOpen,
  onClose,
  currentSlot,
  rankName,
  selectedStickers,
  onStickersChange,
}: RanksStickersPanelProps) {
  const handleStickerToggle = (stickerId: string) => {
    // Strict slot isolation: only modify stickers for current slot
    if (selectedStickers.includes(stickerId)) {
      onStickersChange(selectedStickers.filter((id) => id !== stickerId));
    } else {
      onStickersChange([...selectedStickers, stickerId]);
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
            <StickerSelector
              selectedStickers={selectedStickers}
              onStickerToggle={handleStickerToggle}
              maxStickers={6}
              currentSlot={currentSlot}
            />
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
