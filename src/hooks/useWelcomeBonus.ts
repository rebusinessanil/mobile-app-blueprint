import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

const WELCOME_BONUS_AMOUNT = 199;

// Update release date - users created before this are considered "old users"
const UPDATE_RELEASE_DATE = new Date('2024-12-01T00:00:00Z');

export function useWelcomeBonus() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(WELCOME_BONUS_AMOUNT);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  const checkWelcomeBonus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsChecking(false);
        return;
      }

      // Check profile for welcome_popup_seen status and profile_completion_bonus_given
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('welcome_popup_seen, profile_completion_bonus_given, created_at')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        logger.error('Error fetching profile:', profileError);
        setIsChecking(false);
        return;
      }

      // If already seen, don't show modal
      if (profile?.welcome_popup_seen) {
        setIsChecking(false);
        return;
      }

      // Check if this is an OLD user (created before update release date)
      // OR if profile_completion_bonus_given is already true (profile was completed before)
      const profileCreatedAt = profile?.created_at ? new Date(profile.created_at) : null;
      const isOldUser = profileCreatedAt && profileCreatedAt < UPDATE_RELEASE_DATE;
      
      if (isOldUser || profile?.profile_completion_bonus_given) {
        // OLD USER: Auto-set welcome_popup_seen to true and skip popup
        logger.log('Old user detected, skipping welcome bonus popup');
        
        await supabase
          .from('profiles')
          .update({ welcome_popup_seen: true })
          .eq('user_id', user.id);
        
        setIsChecking(false);
        return;
      }

      // For NEW users, check if bonus was credited
      const { data: credits, error: creditsError } = await supabase
        .from('user_credits')
        .select('balance, total_earned')
        .eq('user_id', user.id)
        .single();

      if (creditsError) {
        logger.error('Error fetching credits:', creditsError);
        setIsChecking(false);
        return;
      }

      // Only show popup for NEW users who received welcome bonus
      // and haven't seen the popup yet
      if (credits && credits.total_earned >= WELCOME_BONUS_AMOUNT && !profile?.welcome_popup_seen) {
        setBonusAmount(WELCOME_BONUS_AMOUNT);
        setShowWelcomeModal(true);
      }

      setIsChecking(false);
    } catch (error) {
      logger.error('Error checking welcome bonus:', error);
      setIsChecking(false);
    }
  }, []);

  const handleContinue = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark welcome popup as seen and profile completion bonus given
      const { error } = await supabase
        .from('profiles')
        .update({ 
          welcome_popup_seen: true,
          profile_completion_bonus_given: true 
        })
        .eq('user_id', user.id);

      if (error) {
        logger.error('Error updating profile flags:', error);
      }

      // Set localStorage flag to prevent ProfileCompletionGate from blocking
      try {
        localStorage.setItem("rebusiness_profile_completed", "true");
      } catch {}

      // Close modal and navigate
      setShowWelcomeModal(false);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      logger.error('Error handling continue:', error);
      // Even on error, set localStorage and navigate
      try {
        localStorage.setItem("rebusiness_profile_completed", "true");
      } catch {}
      setShowWelcomeModal(false);
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    checkWelcomeBonus();
  }, [checkWelcomeBonus]);

  return {
    showWelcomeModal,
    bonusAmount,
    isChecking,
    handleContinue,
    checkWelcomeBonus
  };
}
