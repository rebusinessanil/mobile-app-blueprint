import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

const WELCOME_BONUS_AMOUNT = 199;

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
        .select('welcome_popup_seen')
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

      // Check if bonus was credited (balance should be >= 199 for new users)
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

      // Check if user has received the welcome bonus (total_earned includes 199)
      // and hasn't seen the popup yet
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

      // Mark welcome popup as seen
      const { error } = await supabase
        .from('profiles')
        .update({ welcome_popup_seen: true })
        .eq('user_id', user.id);

      if (error) {
        logger.error('Error updating welcome_popup_seen:', error);
      }

      // Close modal and navigate
      setShowWelcomeModal(false);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      logger.error('Error handling continue:', error);
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
