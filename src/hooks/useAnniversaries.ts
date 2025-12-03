import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

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
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAnniversaries = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('Anniversary')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        setAnniversaries(data || []);
        setError(null);
      } catch (err) {
        setError(err as Error);
        logger.error('Error fetching anniversaries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnniversaries();

    // Set up real-time subscription
    const channel = supabase
      .channel('anniversaries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Anniversary',
        },
        (payload) => {
          logger.log('Anniversary changed:', payload);
          fetchAnniversaries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { anniversaries, loading, error };
};

export const useAnniversary = (anniversaryId?: string) => {
  const [anniversary, setAnniversary] = useState<Anniversary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!anniversaryId) {
      setLoading(false);
      return;
    }

    const fetchAnniversary = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('Anniversary')
          .select('*')
          .eq('id', anniversaryId)
          .single();

        if (error) throw error;

        setAnniversary(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        logger.error('Error fetching anniversary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnniversary();

    // Set up real-time subscription
    const channel = supabase
      .channel(`anniversary-${anniversaryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Anniversary',
          filter: `id=eq.${anniversaryId}`,
        },
        (payload) => {
          logger.log('Anniversary changed:', payload);
          fetchAnniversary();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [anniversaryId]);

  return { anniversary, loading, error };
};
