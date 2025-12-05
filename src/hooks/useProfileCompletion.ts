import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Update release date - users created before this are considered "old users"
const UPDATE_RELEASE_DATE = new Date('2024-12-01T00:00:00Z');
const PROFILE_GATE_BYPASS_KEY = "rebusiness_profile_completed";

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
  loading: boolean;
  isOldUser: boolean;
}

export const useProfileCompletion = (userId?: string) => {
  const [status, setStatus] = useState<ProfileCompletionStatus>({
    isComplete: false,
    missingFields: [],
    completionPercentage: 0,
    loading: true,
    isOldUser: false,
  });

  useEffect(() => {
    if (!userId) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    const checkProfileCompletion = async () => {
      try {
        // Check localStorage bypass first
        try {
          if (localStorage.getItem(PROFILE_GATE_BYPASS_KEY) === "true") {
            setStatus({
              isComplete: true,
              missingFields: [],
              completionPercentage: 100,
              loading: false,
              isOldUser: false,
            });
            return;
          }
        } catch {}

        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        // Check if this is an OLD user
        const profileCreatedAt = profile?.created_at ? new Date(profile.created_at) : null;
        const isOldUser = profileCreatedAt ? profileCreatedAt < UPDATE_RELEASE_DATE : false;

        // If welcome_popup_seen is true, user has completed the flow
        if (profile?.welcome_popup_seen === true) {
          // Set localStorage bypass for future checks
          try {
            localStorage.setItem(PROFILE_GATE_BYPASS_KEY, "true");
          } catch {}
          
          setStatus({
            isComplete: true,
            missingFields: [],
            completionPercentage: 100,
            loading: false,
            isOldUser,
          });
          return;
        }

        // Fetch profile photos count
        const { data: photos, error: photosError } = await supabase
          .from('profile_photos')
          .select('id')
          .eq('user_id', userId);

        const missingFields: string[] = [];
        let completedFields = 0;
        const totalFields = 4; // name, mobile, role, profile_photo

        // Check name
        if (!profile?.name || profile.name.trim() === '' || profile.name === 'User') {
          missingFields.push('Name');
        } else {
          completedFields++;
        }

        // Check mobile - extract digits and validate 10-digit format
        // Reject placeholder values like +000000000000 or all zeros
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

        // For OLD users with 100% complete profile, auto-grant access
        if (isOldUser && fieldsComplete) {
          logger.log('Old user with complete profile detected, granting full access');
          
          // Auto-set welcome_popup_seen for old users
          await supabase
            .from('profiles')
            .update({ welcome_popup_seen: true })
            .eq('user_id', userId);

          // Set localStorage bypass
          try {
            localStorage.setItem(PROFILE_GATE_BYPASS_KEY, "true");
          } catch {}

          setStatus({
            isComplete: true,
            missingFields: [],
            completionPercentage: 100,
            loading: false,
            isOldUser: true,
          });
          return;
        }

        setStatus({
          isComplete: fieldsComplete,
          missingFields,
          completionPercentage,
          loading: false,
          isOldUser,
        });
      } catch (error) {
        logger.error('Error checking profile completion:', error);
        setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    checkProfileCompletion();

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
  }, [userId]);

  return status;
};
