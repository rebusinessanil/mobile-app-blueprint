import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRankStickers } from "@/hooks/useStickers";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";

interface Rank {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
}

interface RankStickerSelectorProps {
  selectedRankId: string;
  selectedSlot: number | null;
  onSlotSelect: (slotNumber: number) => void;
  selectedStickers: Record<number, string>; // slot -> sticker_id mapping
  onStickerChange: (slotNumber: number, stickerId: string | null) => void;
}

export default function RankStickerSelector({
  selectedRankId,
  selectedSlot,
  onSlotSelect,
  selectedStickers,
  onStickerChange,
}: RankStickerSelectorProps) {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [currentRank, setCurrentRank] = useState(selectedRankId);
  const { stickers, loading } = useRankStickers(currentRank);

  // Fetch all ranks
  useEffect(() => {
    const fetchRanks = async () => {
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        setRanks(data);
      }
    };
    fetchRanks();
  }, []);

  const getStickerForSlot = (slotNumber: number) => {
    return stickers.find(s => s.slot_number === slotNumber);
  };

  const handleSlotClick = (slotNumber: number) => {
    onSlotSelect(slotNumber);
    const sticker = getStickerForSlot(slotNumber);
    if (sticker) {
      const currentValue = selectedStickers[slotNumber];
      onStickerChange(slotNumber, currentValue === sticker.id ? null : sticker.id);
    }
  };

  const isSlotSelected = (slotNumber: number): boolean => {
    return selectedSlot === slotNumber;
  };

  const isStickerSelected = (slotNumber: number): boolean => {
    const sticker = getStickerForSlot(slotNumber);
    return sticker ? selectedStickers[slotNumber] === sticker.id : false;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Select Achievement Stickers</h3>
        <Badge variant="outline" className="border-primary text-primary">
          {Object.keys(selectedStickers).length} / 16 Selected
        </Badge>
      </div>

      <Tabs value={currentRank} onValueChange={setCurrentRank} className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-secondary/30 p-1 rounded-xl mb-4">
          {ranks.slice(0, 6).map((rank) => (
            <TabsTrigger
              key={rank.id}
              value={rank.id}
              className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="mr-1">{rank.icon}</span>
              {rank.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="h-[400px]">
          {ranks.map((rank) => (
            <TabsContent key={rank.id} value={rank.id} className="mt-0">
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 16 }, (_, i) => i + 1).map((slotNumber) => {
                  const sticker = getStickerForSlot(slotNumber);
                  const selected = isSlotSelected(slotNumber);
                  const active = isStickerSelected(slotNumber);

                  return (
                    <button
                      key={slotNumber}
                      onClick={() => handleSlotClick(slotNumber)}
                      disabled={!sticker}
                      className={`
                        relative rounded-xl p-2 transition-all
                        ${selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                        ${active ? 'gold-border bg-primary/10' : 'border border-border bg-card'}
                        ${sticker ? 'cursor-pointer hover:border-primary' : 'cursor-not-allowed opacity-40'}
                      `}
                    >
                      <div className="text-xs font-medium text-center text-muted-foreground mb-2">
                        Slot {slotNumber}
                      </div>
                      <div className="aspect-square bg-secondary/20 rounded-lg overflow-hidden">
                        {sticker ? (
                          <img
                            src={sticker.image_url}
                            alt={`Slot ${slotNumber}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            Empty
                          </div>
                        )}
                      </div>
                      {active && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>
    </div>
  );
}
