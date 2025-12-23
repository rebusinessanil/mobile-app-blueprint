import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  mobile: string; // Now required, not nullable
  whatsapp: string | null;
  rank: string | null;
  role: string | null;
  profile_photo: string | null;
  profile_completed: boolean | null;
  welcome_bonus_given: boolean | null;
  profile_completion_bonus_given: boolean | null;
  welcome_popup_seen: boolean | null;
  created_at: string;
  updated_at: string;
  balance?: number; // Wallet balance from user_credits
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

    // Fetch initial profile with credit balance
    const fetchProfile = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError) throw profileError;

        // Fetch credit balance (may not exist yet for brand new users)
        const { data: creditsData, error: creditsError } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('user_id', userId)
          .maybeSingle();

        if (creditsError) throw creditsError;

        setProfile({
          ...profileData,
          balance: creditsData?.balance ?? 0,
        });
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Set up real-time subscriptions for both profile and credits with instant sync
    const channel = supabase
      .channel(`profile-credits-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setProfile(prev => ({
            ...(payload.new as Profile),
            balance: prev?.balance || 0,
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Immediately update balance from payload for instant sync
          if (payload.new && 'balance' in payload.new) {
            setProfile(prev => prev ? {
              ...prev,
              balance: (payload.new as any).balance ?? prev.balance ?? 0,
            } : null);
          }
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
            mobile: updates.mobile || '+000000000000', // Required field
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
      return { data: null, error };
    }
  };

  return { profile, loading, error, updateProfile };
};
