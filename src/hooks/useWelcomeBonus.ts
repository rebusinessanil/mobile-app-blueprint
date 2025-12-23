import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const WELCOME_BONUS_AMOUNT = 199;

export function useWelcomeBonus() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [bonusAmount] = useState(WELCOME_BONUS_AMOUNT);
  const [isChecking, setIsChecking] = useState(true);

  const checkWelcomeBonus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsChecking(false);
        return;
      }

      // Check profile for welcome_popup_seen and welcome_bonus_given status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('welcome_popup_seen, welcome_bonus_given')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        logger.error('Error fetching profile:', profileError);
        setIsChecking(false);
        return;
      }

      // Show popup if welcome bonus was given but popup not yet seen
      if (profile?.welcome_bonus_given === true && profile?.welcome_popup_seen === false) {
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

      // Set welcome_popup_seen = true in database (server-side validation)
      const { error } = await supabase
        .from('profiles')
        .update({ welcome_popup_seen: true })
        .eq('user_id', user.id);

      if (error) {
        logger.error('Error updating welcome_popup_seen:', error);
      }

      // Close modal - user stays on dashboard
      setShowWelcomeModal(false);
    } catch (error) {
      logger.error('Error handling continue:', error);
      setShowWelcomeModal(false);
    }
  }, []);

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
