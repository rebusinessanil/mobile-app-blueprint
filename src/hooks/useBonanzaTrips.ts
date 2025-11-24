import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [trips, setTrips] = useState<BonanzaTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bonanza_trips')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTrips(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching bonanza trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();

    // Real-time subscription for instant updates
    const channel = supabase
      .channel(`bonanza-trips-changes-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bonanza_trips',
        },
        (payload) => {
          console.log('📡 Bonanza trip update received:', payload);
          fetchTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { trips, loading, error, refetch: fetchTrips };
};

export const useBonanzaTrip = (tripId?: string) => {
  const [trip, setTrip] = useState<BonanzaTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tripId) {
      setTrip(null);
      setLoading(false);
      return;
    }

    const fetchTrip = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bonanza_trips')
          .select('*')
          .eq('id', tripId)
          .single();

        if (error) throw error;
        setTrip(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching bonanza trip:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();

    // Real-time subscription
    const channel = supabase
      .channel(`bonanza-trip-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bonanza_trips',
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          console.log('📡 Bonanza trip update received:', payload);
          fetchTrip();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  return { trip, loading, error };
};
