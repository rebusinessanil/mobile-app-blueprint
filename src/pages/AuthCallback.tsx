import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { WifiOff } from "lucide-react";
import { getUserRoleAndRedirect } from "@/hooks/useUserRole";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const handleAuthCallback = async () => {
      try {
        // Get URL parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const code = queryParams.get("code");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const errorDescription = hashParams.get("error_description") || queryParams.get("error_description");

        // Check for errors first
        if (errorDescription) {
          if (isMounted) setError(decodeURIComponent(errorDescription));
          return;
        }

        // Helper function to handle post-auth redirect based on role
        const handlePostAuthRedirect = async (userId: string, profileCompleted: boolean) => {
          if (profileCompleted) {
            // Check role and redirect accordingly
            const { redirectPath, isAdmin } = await getUserRoleAndRedirect(userId);
            logger.log(`Profile complete, redirecting to ${redirectPath} (isAdmin: ${isAdmin})`);
            if (isMounted) navigate(redirectPath, { replace: true });
          } else {
            logger.log("Profile not complete, redirecting to profile-edit");
            if (isMounted) navigate("/profile-edit", { replace: true });
          }
        };

        // Handle PKCE flow (code in query params) - PRIMARY METHOD
        if (code) {
          logger.log("Exchanging code for session...");
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            logger.error("Code exchange error:", exchangeError);
            if (isMounted) setError(exchangeError.message);
            return;
          }

          if (data?.session?.access_token && data?.session?.refresh_token) {
            // Credit welcome bonus via edge function (idempotent)
            try {
              const response = await fetch(
                'https://gjlrxikynlbpsvrpwebp.supabase.co/functions/v1/credit-welcome-bonus',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.session.access_token}`,
                  },
                }
              );
              const bonusResult = await response.json();
              logger.log('[Welcome Bonus]', bonusResult);
            } catch (bonusError) {
              logger.error('Welcome bonus error:', bonusError);
            }

            // Check if profile is already complete
            const { data: profileData } = await supabase
              .from('profiles')
              .select('profile_completed')
              .eq('user_id', data.session.user.id)
              .single();
            
            await handlePostAuthRedirect(
              data.session.user.id, 
              profileData?.profile_completed === true
            );
            return;
          }
        }

        // Handle implicit grant flow (tokens in hash) - FALLBACK
        if (accessToken && refreshToken) {
          logger.log("Setting session from tokens...");
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            logger.error("Set session error:", setSessionError);
            if (isMounted) setError(setSessionError.message);
            return;
          }

          if (data?.session) {
            // Credit welcome bonus via edge function (idempotent)
            try {
              const response = await fetch(
                'https://gjlrxikynlbpsvrpwebp.supabase.co/functions/v1/credit-welcome-bonus',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.session.access_token}`,
                  },
                }
              );
              const bonusResult = await response.json();
              logger.log('[Welcome Bonus]', bonusResult);
            } catch (bonusError) {
              logger.error('Welcome bonus error:', bonusError);
            }

            // Check if profile is already complete
            const { data: profileData } = await supabase
              .from('profiles')
              .select('profile_completed')
              .eq('user_id', data.session.user.id)
              .single();
            
            await handlePostAuthRedirect(
              data.session.user.id, 
              profileData?.profile_completed === true
            );
            return;
          }
        }

        // Check if session already exists
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token && session?.refresh_token) {
          // Check if profile is already complete
          const { data: profileData } = await supabase
            .from('profiles')
            .select('profile_completed')
            .eq('user_id', session.user.id)
            .single();
          
          await handlePostAuthRedirect(
            session.user.id, 
            profileData?.profile_completed === true
          );
          return;
        }

        // No valid auth data found
        logger.log("No auth data found, redirecting to register");
        if (isMounted) navigate("/register", { replace: true });

      } catch (err: any) {
        logger.error("Auth callback error:", err);
        if (err.message?.includes("fetch") || err.message?.includes("network") || !navigator.onLine) {
          if (isMounted) setError("Server not reachable. Please check your internet connection and try again.");
        } else {
          if (isMounted) setError("An unexpected error occurred during authentication");
        }
      }
    };

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4 safe-area-top safe-area-bottom">
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive text-2xl">✕</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => navigate("/register", { replace: true })}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors touch-target"
          >
            Back to Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center safe-area-top safe-area-bottom">
      {/* Offline indicator */}
      {isOffline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-destructive/90 text-white rounded-full text-sm animate-pulse">
          <WifiOff className="w-4 h-4" />
          <span>No connection</span>
        </div>
      )}
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-foreground text-lg">Processing Sign-Up...</p>
        <p className="text-muted-foreground text-sm mt-2">Please wait while we complete your registration</p>
      </div>
    </div>
  );
}
