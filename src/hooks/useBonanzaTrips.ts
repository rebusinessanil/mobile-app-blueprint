import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface BonanzaTrip {
  id: string;
  category_id: string | null;
  title: string;
  short_title: string | null;
  description: string | null;
  trip_image_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useBonanzaTrips = () => {
  const queryClient = useQueryClient();

  const { data: trips, isLoading, error, refetch } = useQuery({
    queryKey: ['bonanza-trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bonanza_trips')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as BonanzaTrip[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`bonanza-trips-changes-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bonanza_trips',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['bonanza-trips'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { 
    trips: trips || [], 
    loading: isLoading, 
    error, 
    refetch 
  };
};

export const useBonanzaTrip = (tripId?: string) => {
  const { data: trip, isLoading, error } = useQuery({
    queryKey: ['bonanza-trip', tripId],
    queryFn: async () => {
      if (!tripId) return null;

      const { data, error } = await supabase
        .from('bonanza_trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (error) throw error;
      return data as BonanzaTrip;
    },
    enabled: !!tripId,
  });

  return { 
    trip: trip || null, 
    loading: isLoading, 
    error 
  };
};
