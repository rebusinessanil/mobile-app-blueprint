import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Cutoff date - users created before this are considered "old users" and bypass gate
const UPDATE_RELEASE_DATE = new Date('2024-12-01T00:00:00Z');

export interface ProfileCompletionStatus {
  isComplete: boolean;
  isBonusCredited: boolean;
  canAccessDashboard: boolean;
  missingFields: string[];
  completionPercentage: number;
  loading: boolean;
  isOldUser: boolean;
}

export const useProfileCompletion = (userId?: string) => {
  const [status, setStatus] = useState<ProfileCompletionStatus>({
    isComplete: false,
    isBonusCredited: false,
    canAccessDashboard: false,
    missingFields: [],
    completionPercentage: 0,
    loading: true,
    isOldUser: false,
  });

  const checkProfileCompletion = useCallback(async () => {
    if (!userId) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Fetch profile data - server-side source of truth
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, profile_completed, welcome_bonus_given, created_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        logger.error('Error fetching profile:', profileError);
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      // Check if this is an OLD user (created before update release)
      const profileCreatedAt = profile?.created_at ? new Date(profile.created_at) : null;
      const isOldUser = profileCreatedAt ? profileCreatedAt < UPDATE_RELEASE_DATE : false;

      // For OLD users - grant full access immediately
      if (isOldUser) {
        logger.log('Old user detected, granting full access');
        setStatus({
          isComplete: true,
          isBonusCredited: true,
          canAccessDashboard: true,
          missingFields: [],
          completionPercentage: 100,
          loading: false,
          isOldUser: true,
        });
        return;
      }

      // Fetch profile photos count
      const { data: photos } = await supabase
        .from('profile_photos')
        .select('id')
        .eq('user_id', userId);

      const missingFields: string[] = [];
      let completedFields = 0;
      const totalFields = 4; // name, mobile, role, profile_photo

      // Check name
      if (!profile?.name || profile.name.trim() === '' || profile.name === 'User' || profile.name === 'New User') {
        missingFields.push('Name');
      } else {
        completedFields++;
      }

      // Check mobile - extract digits and validate 10-digit format
      const rawMobile = profile?.mobile || '';
      const mobileDigits = rawMobile.replace(/\D/g, '').slice(-10);
      const isPlaceholder = rawMobile === '+000000000000' || mobileDigits === '0000000000' || /^0+$/.test(mobileDigits);
      if (!mobileDigits || mobileDigits.length !== 10 || isPlaceholder) {
        missingFields.push('Mobile Number');
      } else {
        completedFields++;
      }

      // Check role
      if (!profile?.role || profile.role.trim() === '') {
        missingFields.push('Role');
      } else {
        completedFields++;
      }

      // Check profile photo (at least 1)
      if (!photos || photos.length === 0) {
        missingFields.push('Profile Image');
      } else {
        completedFields++;
      }

      const completionPercentage = Math.round((completedFields / totalFields) * 100);
      const fieldsComplete = missingFields.length === 0;

      // Server-side flags are source of truth
      const isProfileCompleteDB = profile?.profile_completed === true;
      const isBonusCredited = profile?.welcome_bonus_given === true;

      // Can only access dashboard if BOTH conditions are met:
      // 1. Profile is 100% complete (verified by DB flag)
      // 2. Welcome bonus has been credited
      const canAccessDashboard = isProfileCompleteDB && isBonusCredited;

      setStatus({
        isComplete: fieldsComplete || isProfileCompleteDB,
        isBonusCredited,
        canAccessDashboard,
        missingFields,
        completionPercentage,
        loading: false,
        isOldUser: false,
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
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

  return { ...status, refetch: checkProfileCompletion };
};
