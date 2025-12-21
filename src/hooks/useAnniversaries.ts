import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface Anniversary {
  id: string;
  title: string;
  short_title?: string;
  description?: string;
  Anniversary_image_url: string;
  category_id?: string;
  is_active: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export const useAnniversaries = () => {
  const queryClient = useQueryClient();

  const { data: anniversaries, isLoading, error, refetch } = useQuery({
    queryKey: ['anniversaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Anniversary')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Anniversary[];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const channel = supabase
      .channel('anniversaries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Anniversary',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['anniversaries'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { 
    anniversaries: anniversaries || [], 
    loading: isLoading, 
    error 
  };
};

export const useAnniversary = (anniversaryId?: string) => {
  const { data: anniversary, isLoading, error } = useQuery({
    queryKey: ['anniversary', anniversaryId],
    queryFn: async () => {
      if (!anniversaryId) return null;

      const { data, error } = await supabase
        .from('Anniversary')
        .select('*')
        .eq('id', anniversaryId)
        .single();

      if (error) throw error;
      return data as Anniversary;
    },
    enabled: !!anniversaryId,
  });

  return { 
    anniversary: anniversary || null, 
    loading: isLoading, 
    error 
  };
};
