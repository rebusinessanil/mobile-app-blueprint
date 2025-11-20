import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { useRankStickers } from "@/hooks/useRankStickers";
import { Skeleton } from "@/components/ui/skeleton";

interface RankStickerSelectorProps {
  rankId: string;
  selectedStickers: string[];
  onStickerToggle: (stickerId: string) => void;
  maxStickers?: number;
}

export default function RankStickerSelector({
  rankId,
  selectedStickers,
  onStickerToggle,
  maxStickers = 6,
}: RankStickerSelectorProps) {
  const { stickers, loading } = useRankStickers(rankId);

  const handleStickerClick = (stickerId: string) => {
    const isSelected = selectedStickers.includes(stickerId);
    
    if (isSelected) {
      onStickerToggle(stickerId);
    } else if (selectedStickers.length < maxStickers) {
      onStickerToggle(stickerId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 16 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const activeStickers = stickers.filter(s => s.is_active && s.image_url);

  return (
    <div className="space-y-4 bg-secondary/20 rounded-2xl p-4 border border-border/30">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Select Achievement Stickers
        </h3>
        <Badge variant="outline" className="border-primary text-primary px-3 py-1.5 text-sm">
          {selectedStickers.length}/{maxStickers}
        </Badge>
      </div>

      {activeStickers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No stickers available for this rank yet
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2.5">
          {stickers.map((sticker) => {
            if (!sticker.is_active || !sticker.image_url) return null;

            const isSelected = selectedStickers.includes(sticker.id);
            const isDisabled = !isSelected && selectedStickers.length >= maxStickers;

            return (
              <button
                key={sticker.id}
                onClick={() => handleStickerClick(sticker.id)}
                disabled={isDisabled}
                className={`
                  relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                  ${isSelected 
                    ? 'border-primary shadow-lg shadow-primary/30 scale-95' 
                    : 'border-border hover:border-primary/60 hover:scale-105'
                  }
                  ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <img
                  src={sticker.image_url}
                  alt={sticker.name}
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/25 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                  <p className="text-[9px] text-white text-center font-medium truncate leading-tight">
                    {sticker.name}
                  </p>
                </div>
                <div className="absolute top-1 right-1 bg-black/60 rounded px-1.5 py-0.5">
                  <span className="text-[8px] text-white font-bold">
                    {sticker.slot_number}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-2">
        Select up to {maxStickers} stickers to showcase your achievements
      </p>
    </div>
  );
}
