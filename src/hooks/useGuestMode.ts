import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to manage guest mode state with strict auth validation
 * Returns whether user is a guest (not authenticated) and current user ID
 * Re-validates auth state on every mount to prevent stale sessions
 */
export function useGuestMode() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true);
  const [authValidated, setAuthValidated] = useState(false);

  // Force re-validation of auth state
  const revalidateAuth = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        setUserId(null);
        setIsGuest(true);
        return false;
      }
      
      setUserId(session.user.id);
      setIsGuest(false);
      return true;
    } catch {
      setUserId(null);
      setIsGuest(true);
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Always validate session on mount - prevents stale UI states
    const validateSession = async () => {
      setIsLoading(true);
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      if (error || !session?.user) {
        setUserId(null);
        setIsGuest(true);
      } else {
        setUserId(session.user.id);
        setIsGuest(false);
      }
      
      setAuthValidated(true);
      setIsLoading(false);
    };

    validateSession();

    // Listen for auth changes with immediate state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      // Handle sign out event - immediately clear state
      if (event === 'SIGNED_OUT') {
        setUserId(null);
        setIsGuest(true);
        setAuthValidated(true);
        return;
      }
      
      // Handle sign in and token refresh events
      if (session?.user) {
        setUserId(session.user.id);
        setIsGuest(false);
      } else {
        setUserId(null);
        setIsGuest(true);
      }
      setAuthValidated(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { 
    userId, 
    isGuest, 
    isLoading,
    isAuthenticated: !isGuest && !!userId,
    authValidated,
    revalidateAuth
  };
}
