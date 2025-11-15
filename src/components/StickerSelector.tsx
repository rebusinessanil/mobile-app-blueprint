import { useState } from "react";
import { useStickers, useStickerCategories } from "@/hooks/useStickers";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface StickerSelectorProps {
  selectedStickers: string[];
  onStickerToggle: (stickerId: string) => void;
  maxStickers?: number;
}

export default function StickerSelector({
  selectedStickers,
  onStickerToggle,
  maxStickers = 3,
}: StickerSelectorProps) {
  const { categories } = useStickerCategories();
  const [activeCategory, setActiveCategory] = useState<string>("");
  const { stickers } = useStickers(activeCategory);

  const handleStickerClick = (stickerId: string) => {
    const isSelected = selectedStickers.includes(stickerId);
    
    if (isSelected) {
      onStickerToggle(stickerId);
    } else if (selectedStickers.length < maxStickers) {
      onStickerToggle(stickerId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Select Achievement Stickers
        </h3>
        <Badge variant="outline" className="border-primary text-primary">
          {selectedStickers.length}/{maxStickers}
        </Badge>
      </div>

      <Tabs defaultValue={categories[0]?.id} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4 bg-secondary">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-4">
            <div className="grid grid-cols-3 gap-3">
              {stickers.map((sticker) => {
                const isSelected = selectedStickers.includes(sticker.id);
                const isDisabled = !isSelected && selectedStickers.length >= maxStickers;

                return (
                  <button
                    key={sticker.id}
                    onClick={() => handleStickerClick(sticker.id)}
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
                          <Check className="w-5 h-5 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                      <p className="text-[10px] text-white text-center font-medium truncate">
                        {sticker.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
