import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useBonanzaTrips = (categoryId?: string) => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('bonanza_trips')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (err) throw err;
        setTrips(data || []);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();

    const channel = supabase
      .channel(`bonanza-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bonanza_trips' }, fetchTrips)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [categoryId]);

  return { trips, loading, error };
};
