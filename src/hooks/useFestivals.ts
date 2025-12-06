import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface Festival {
  id: string;
  festival_name: string;
  festival_date: string;
  poster_url: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useFestivals = () => {
  const queryClient = useQueryClient();

  const { data: festivals, isLoading, error, refetch } = useQuery({
    queryKey: ['festivals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories_festivals')
        .select('*')
        .eq('is_active', true)
        .order('festival_date', { ascending: true });

      if (error) throw error;
      return data as Festival[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`festivals-changes-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories_festivals',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['festivals'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { 
    festivals: festivals || [], 
    loading: isLoading, 
    error, 
    refetch 
  };
};

export const useFestival = (festivalId?: string) => {
  const { data: festival, isLoading, error } = useQuery({
    queryKey: ['festival', festivalId],
    queryFn: async () => {
      if (!festivalId) return null;

      const { data, error } = await supabase
        .from('stories_festivals')
        .select('*')
        .eq('id', festivalId)
        .single();

      if (error) throw error;
      return data as Festival;
    },
    enabled: !!festivalId,
  });

  return { 
    festival: festival || null, 
    loading: isLoading, 
    error 
  };
};
