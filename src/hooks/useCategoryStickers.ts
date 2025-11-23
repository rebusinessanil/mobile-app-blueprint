import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";

export interface CategorySticker {
  id: string;
  name: string;
  banner_category: string;
  slot_number: number;
  image_url: string;
  is_active: boolean;
  position_x: number;
  position_y: number;
  scale: number;
  rotation: number;
  display_order: number;
}

export const useCategoryStickers = (category: string) => {
  const { data: stickers, isLoading, error, refetch } = useQuery({
    queryKey: ['category-stickers', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stickers')
        .select('*')
        .eq('banner_category', category)
        .eq('is_active', true)
        .order('slot_number', { ascending: true });

      if (error) throw error;
      return data as CategorySticker[];
    },
    enabled: !!category,
  });

  // Real-time subscription for sticker updates
  useEffect(() => {
    if (!category) return;

    const channel = supabase
      .channel(`category-stickers-${category}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stickers',
          filter: `banner_category=eq.${category}`
        },
        (payload) => {
          console.log('Category stickers updated:', payload);
          refetch();
          toast.success('Stickers updated');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category, refetch]);

  return {
    stickers: stickers || [],
    isLoading,
    error,
    refetch
  };
};
