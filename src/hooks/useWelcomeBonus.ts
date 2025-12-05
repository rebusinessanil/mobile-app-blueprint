import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

const WELCOME_BONUS_AMOUNT = 199;
const PROFILE_GATE_BYPASS_KEY = "rebusiness_profile_completed";

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

      // Check profile for welcome_popup_seen status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('welcome_popup_seen, created_at')
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
      const profileCreatedAt = profile?.created_at ? new Date(profile.created_at) : null;
      const isOldUser = profileCreatedAt && profileCreatedAt < UPDATE_RELEASE_DATE;
      
      if (isOldUser) {
        // OLD USER: Auto-set welcome_popup_seen to true and skip popup
        logger.log('Old user detected, skipping welcome bonus popup');
        
        await supabase
          .from('profiles')
          .update({ welcome_popup_seen: true })
          .eq('user_id', user.id);
        
        // Set localStorage bypass
        try {
          localStorage.setItem(PROFILE_GATE_BYPASS_KEY, "true");
        } catch {}
        
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

      // Show popup for NEW users who received welcome bonus and haven't seen the popup
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

      // Only set welcome_popup_seen = true in database
      const { error } = await supabase
        .from('profiles')
        .update({ welcome_popup_seen: true })
        .eq('user_id', user.id);

      if (error) {
        logger.error('Error updating welcome_popup_seen:', error);
      }

      // Set localStorage bypass flag for instant gate skip
      try {
        localStorage.setItem(PROFILE_GATE_BYPASS_KEY, "true");
      } catch {}

      // Close modal and immediately redirect to dashboard
      setShowWelcomeModal(false);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      logger.error('Error handling continue:', error);
      // Even on error, set localStorage and navigate
      try {
        localStorage.setItem(PROFILE_GATE_BYPASS_KEY, "true");
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
