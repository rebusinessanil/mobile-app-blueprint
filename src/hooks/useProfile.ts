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
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            name: updates.name || 'User',
            mobile: updates.mobile || null,
            whatsapp: updates.whatsapp || null,
            rank: updates.rank || null,
            role: updates.role || null,
            profile_photo: updates.profile_photo || null,
          })
          .select()
          .single();

        if (error) throw error;
        setProfile(data);
        return { data, error: null };
      }

      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Profile update error:', error);
      return { data: null, error };
    }
  };

  return { profile, loading, error, updateProfile };
};
