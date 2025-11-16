import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBannerDefaults } from './useBannerDefaults';

export interface UserBannerSettings {
  id?: string;
  user_id: string;
  upline_avatars: Array<{ name: string; avatar_url: string }>;
  logo_left: string | null;
  logo_right: string | null;
  show_upline_names: boolean;
  show_contact_info: boolean;
  show_rank_badge: boolean;
  auto_share_to_feed: boolean;
}

export const useBannerSettings = (userId?: string) => {
  const { defaults } = useBannerDefaults();
  const [settings, setSettings] = useState<UserBannerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_banner_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setSettings(data as unknown as UserBannerSettings);
        } else if (defaults) {
          // Use defaults if user hasn't customized yet
          setSettings({
            user_id: userId,
            upline_avatars: defaults.upline_avatars,
            logo_left: defaults.logo_left,
            logo_right: defaults.logo_right,
            show_upline_names: true,
            show_contact_info: true,
            show_rank_badge: true,
            auto_share_to_feed: false,
          });
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Set up real-time subscription
    const channel = supabase
      .channel('user-banner-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_banner_settings',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, defaults]);

  const updateSettings = async (updates: Partial<UserBannerSettings>) => {
    if (!userId) return { data: null, error: new Error('No user ID') };

    try {
      const { data: existingData } = await supabase
        .from('user_banner_settings')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingData) {
        // Update existing
        const { data, error } = await supabase
          .from('user_banner_settings')
          .update(updates)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return { data, error: null };
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('user_banner_settings')
          .insert({ user_id: userId, ...updates })
          .select()
          .single();

        if (error) throw error;
        return { data, error: null };
      }
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  return { settings, loading, error, updateSettings };
};
