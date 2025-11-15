import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProfilePhoto {
  id: string;
  user_id: string;
  photo_url: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfilePhotos = (userId?: string) => {
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchPhotos = async () => {
      try {
        const { data, error } = await supabase
          .from('profile_photos')
          .select('*')
          .eq('user_id', userId)
          .order('display_order', { ascending: true })
          .limit(6);

        if (error) throw error;
        setPhotos(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();

    // Set up real-time subscription
    const channel = supabase
      .channel('profile-photos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_photos',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchPhotos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { photos, loading, error };
};
