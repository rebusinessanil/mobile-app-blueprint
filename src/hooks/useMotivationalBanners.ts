import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface MotivationalBanner {
  id: string;
  title: string;
  short_title: string | null;
  Motivational_image_url: string;
  description: string | null;
  category_id: string | null;
  is_active: boolean | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useMotivationalBanners = () => {
  const { data: motivationalBanners, isLoading, error, refetch } = useQuery({
    queryKey: ['motivational-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Motivational Banner')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as MotivationalBanner[];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const channel = supabase
      .channel('motivational-banners-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Motivational Banner'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return {
    motivationalBanners: motivationalBanners || [],
    loading: isLoading,
    error
  };
};

export const useMotivationalBanner = (motivationalBannerId?: string) => {
  const { data: motivationalBanner, isLoading, error } = useQuery({
    queryKey: ['motivational-banner', motivationalBannerId],
    queryFn: async () => {
      if (!motivationalBannerId) return null;

      const { data, error } = await supabase
        .from('Motivational Banner')
        .select('*')
        .eq('id', motivationalBannerId)
        .maybeSingle();

      if (error) throw error;
      return data as MotivationalBanner | null;
    },
    enabled: !!motivationalBannerId,
  });

  return {
    motivationalBanner,
    loading: isLoading,
    error
  };
};
