import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to manage guest mode state
 * Returns whether user is a guest (not authenticated) and current user ID
 */
export function useGuestMode() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUserId(session.user.id);
        setIsGuest(false);
      } else {
        setUserId(null);
        setIsGuest(true);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUserId(session.user.id);
        setIsGuest(false);
      } else {
        setUserId(null);
        setIsGuest(true);
      }
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
    isAuthenticated: !isGuest && !!userId 
  };
}
