import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
  loading: boolean;
}

export const useProfileCompletion = (userId?: string) => {
  const [status, setStatus] = useState<ProfileCompletionStatus>({
    isComplete: false,
    missingFields: [],
    completionPercentage: 0,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    const checkProfileCompletion = async () => {
      try {
        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        // If profile_completion_bonus_given is true, profile is permanently complete
        if (profile?.profile_completion_bonus_given === true) {
          setStatus({
            isComplete: true,
            missingFields: [],
            completionPercentage: 100,
            loading: false,
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
        const totalFields = 5; // name, mobile, whatsapp, role, profile_photo

        // Check name
        if (!profile?.name || profile.name.trim() === '' || profile.name === 'User') {
          missingFields.push('Name');
        } else {
          completedFields++;
        }

        // Check mobile
        if (!profile?.mobile || profile.mobile === '+000000000000' || !/^\d{10}$/.test(profile.mobile.replace(/\D/g, ''))) {
          missingFields.push('Mobile Number');
        } else {
          completedFields++;
        }

        // Check whatsapp
        if (!profile?.whatsapp || !/^\d{10}$/.test(profile.whatsapp.replace(/\D/g, ''))) {
          missingFields.push('WhatsApp Number');
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
        const isComplete = missingFields.length === 0;

        setStatus({
          isComplete,
          missingFields,
          completionPercentage,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking profile completion:', error);
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
