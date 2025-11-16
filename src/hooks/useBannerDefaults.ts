import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BannerDefaults {
  id: string;
  upline_avatars: Array<{ name: string; avatar_url: string }>;
  logo_left: string | null;
  logo_right: string | null;
}

export const useBannerDefaults = () => {
  const [defaults, setDefaults] = useState<BannerDefaults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDefaults = async () => {
      try {
        const { data, error } = await supabase
          .from('banner_defaults')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        setDefaults(data as unknown as BannerDefaults);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchDefaults();

    // Set up real-time subscription
    const channel = supabase
      .channel('banner-defaults-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'banner_defaults',
        },
        () => {
          fetchDefaults();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { defaults, loading, error };
};
