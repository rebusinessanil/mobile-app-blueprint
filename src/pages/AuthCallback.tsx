import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // First, let Supabase handle the URL automatically
        // This is important - Supabase client with detectSessionInUrl: true 
        // will automatically detect and process the auth callback
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error("Session error:", sessionError);
          setError(sessionError.message);
          return;
        }

        if (session) {
          logger.log("Session found after OAuth callback");
          await handleUserRedirect(session.user.id);
          return;
        }

        // If no session yet, check for OAuth code in URL and exchange it
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        
        if (code) {
          logger.log("Found OAuth code, exchanging for session...");
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            logger.error("Code exchange error:", exchangeError);
            setError(exchangeError.message);
            return;
          }

          if (data.session) {
            logger.log("Session created from code exchange");
            await handleUserRedirect(data.session.user.id);
            return;
          }
        }

        // Check for tokens in hash (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          logger.log("Found tokens in hash, setting session...");
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            logger.error("Set session error:", setSessionError);
            setError(setSessionError.message);
            return;
          }

          if (data.session) {
            logger.log("Session set from tokens");
            await handleUserRedirect(data.session.user.id);
            return;
          }
        }

        // Check for error in URL
        const errorDescription = hashParams.get("error_description") || urlParams.get("error_description");
        if (errorDescription) {
          setError(decodeURIComponent(errorDescription));
          return;
        }

        // No auth data found, redirect to login
        logger.log("No auth data found, redirecting to login");
        navigate("/login", { replace: true });
        
      } catch (err) {
        logger.error("Auth callback error:", err);
        setError("An unexpected error occurred during authentication");
      }
    };

    const handleUserRedirect = async (userId: string) => {
      try {
        // Check if user has a completed profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('profile_completed, name, mobile, role')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) {
          logger.error("Profile check error:", profileError);
          // Still redirect to dashboard, AuthGuard will handle profile creation
          navigate("/dashboard", { replace: true });
          return;
        }

        if (!profile) {
          // New user - profile will be auto-created by database trigger
          // Redirect to profile-edit to complete setup
          logger.log("New user, redirecting to profile-edit");
          navigate("/profile-edit", { replace: true });
          return;
        }

        // Check if profile is complete
        const isComplete = profile.profile_completed === true;
        
        if (isComplete) {
          logger.log("Profile complete, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
        } else {
          logger.log("Profile incomplete, redirecting to profile-edit");
          navigate("/profile-edit", { replace: true });
        }
      } catch (err) {
        logger.error("User redirect error:", err);
        navigate("/dashboard", { replace: true });
      }
    };

    // Small delay to ensure Supabase client is ready
    const timer = setTimeout(handleAuthCallback, 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive text-2xl">✕</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-foreground text-lg">Processing Login...</p>
        <p className="text-muted-foreground text-sm mt-2">Please wait while we complete your sign-in</p>
      </div>
    </div>
  );
}
