import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  mobile: string | null;
  whatsapp: string | null;
  rank: string | null;
  role: string | null;
  profile_photo: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = (userId?: string) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Fetch initial profile
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Set up real-time subscription
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) return { error: new Error('No user ID provided'), data: null };

    try {
      console.log('Updating profile for userId:', userId);
      console.log('Update data:', updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      console.log('Update response:', { data, error });

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No profile found for user_id:', userId);
        throw new Error('Profile not found. Please complete your profile setup.');
      }
      
      setProfile(data);
      return { data, error: null };
    } catch (err) {
      console.error('Profile update failed:', err);
      return { data: null, error: err as Error };
    }
  };

  return { profile, loading, error, updateProfile };
};
