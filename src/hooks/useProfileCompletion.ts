import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Update release date - users created before this are considered "old users"
const UPDATE_RELEASE_DATE = new Date('2024-12-01T00:00:00Z');

export interface ProfileCompletionStatus {
  isComplete: boolean;
  profileCompleted: boolean;
  missingFields: string[];
  completionPercentage: number;
  loading: boolean;
  isOldUser: boolean;
  refetch: () => Promise<void>;
}

export const useProfileCompletion = (userId?: string) => {
  const [status, setStatus] = useState<ProfileCompletionStatus>({
    isComplete: false,
    profileCompleted: false,
    missingFields: [],
    completionPercentage: 0,
    loading: true,
    isOldUser: false,
    refetch: async () => {},
  });

  const checkProfileCompletion = useCallback(async () => {
    if (!userId) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Fetch profile with profile_completed field
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, mobile, role, profile_photo, profile_completed, profile_completion_bonus_given, welcome_popup_seen, created_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        logger.error('Error fetching profile:', profileError);
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      // Check if this is an OLD user
      const profileCreatedAt = profile?.created_at ? new Date(profile.created_at) : null;
      const isOldUser = profileCreatedAt ? profileCreatedAt < UPDATE_RELEASE_DATE : false;

      // Use database profile_completed field as primary source of truth
      const profileCompleted = profile?.profile_completed === true;

      // OLD USER with profile_completion_bonus_given = true → always complete
      if (profile?.profile_completion_bonus_given === true) {
        if (isOldUser && !profile.welcome_popup_seen) {
          await supabase
            .from('profiles')
            .update({ welcome_popup_seen: true })
            .eq('user_id', userId);
        }
        
        setStatus({
          isComplete: true,
          profileCompleted: true,
          missingFields: [],
          completionPercentage: 100,
          loading: false,
          isOldUser,
          refetch: checkProfileCompletion,
        });
        return;
      }

      // Calculate missing fields for UI display
      const missingFields: string[] = [];
      if (!profile?.name || profile.name.trim() === '' || profile.name === 'User') {
        missingFields.push('Name');
      }
      
      const mobileDigits = profile?.mobile?.replace(/\D/g, '').slice(-10) || '';
      if (!mobileDigits || mobileDigits.length !== 10) {
        missingFields.push('Mobile Number');
      }

      if (!profile?.role || profile.role.trim() === '') {
        missingFields.push('Role');
      }

      if (!profile?.profile_photo || profile.profile_photo.trim() === '') {
        missingFields.push('Profile Image');
      }

      const totalFields = 4;
      const completedFields = totalFields - missingFields.length;
      const completionPercentage = Math.round((completedFields / totalFields) * 100);

      // For OLD users with 100% complete profile, auto-grant access
      if (isOldUser && profileCompleted) {
        logger.log('Old user with complete profile detected, granting full access');
        
        await supabase
          .from('profiles')
          .update({ 
            profile_completion_bonus_given: true,
            welcome_popup_seen: true 
          })
          .eq('user_id', userId);

        setStatus({
          isComplete: true,
          profileCompleted: true,
          missingFields: [],
          completionPercentage: 100,
          loading: false,
          isOldUser: true,
          refetch: checkProfileCompletion,
        });
        return;
      }

      setStatus({
        isComplete: profileCompleted,
        profileCompleted,
        missingFields,
        completionPercentage,
        loading: false,
        isOldUser,
        refetch: checkProfileCompletion,
      });
    } catch (error) {
      logger.error('Error checking profile completion:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  }, [userId]);

  useEffect(() => {
    checkProfileCompletion();

    if (!userId) return;

    // Set up real-time subscription to re-check on profile updates
    const channel = supabase
      .channel(`profile-completion-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          checkProfileCompletion();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_photos',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          checkProfileCompletion();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, checkProfileCompletion]);

  return status;
};
