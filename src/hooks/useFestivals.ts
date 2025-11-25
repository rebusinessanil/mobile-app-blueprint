import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFestivals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stories_festivals')
        .select('*')
        .eq('is_active', true)
        .order('festival_date', { ascending: true });

      if (error) throw error;
      setFestivals(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching festivals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFestivals();

    // Real-time subscription for instant updates
    const channel = supabase
      .channel(`festivals-changes-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories_festivals',
        },
        (payload) => {
          console.log('📡 Festival update received:', payload);
          fetchFestivals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { festivals, loading, error, refetch: fetchFestivals };
};

export const useFestival = (festivalId?: string) => {
  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!festivalId) {
      setFestival(null);
      setLoading(false);
      return;
    }

    const fetchFestival = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('stories_festivals')
          .select('*')
          .eq('id', festivalId)
          .single();

        if (error) throw error;
        setFestival(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching festival:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFestival();

    // Real-time subscription
    const channel = supabase
      .channel(`festival-${festivalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories_festivals',
          filter: `id=eq.${festivalId}`,
        },
        (payload) => {
          console.log('📡 Festival update received:', payload);
          fetchFestival();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [festivalId]);

  return { festival, loading, error };
};
