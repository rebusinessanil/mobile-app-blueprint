import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const redirectAfterAuth = async (userId: string) => {
      if (!isMounted) return;
      
      // Check if user has completed profile setup
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_completed')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profile || !profile.profile_completed) {
        // New user or incomplete profile - go to profile setup
        logger.log("Redirecting new user to profile-setup");
        navigate("/profile-setup", { replace: true });
      } else {
        // Existing user with complete profile - go to dashboard
        logger.log("Redirecting to dashboard");
        navigate("/dashboard", { replace: true });
      }
    };

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
            logger.log("Session created successfully via code exchange");
            await redirectAfterAuth(data.session.user.id);
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
            logger.log("Session set from tokens successfully");
            await redirectAfterAuth(data.session.user.id);
            return;
          }
        }

        // Check if session already exists (user returned to page)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token && session?.refresh_token) {
          logger.log("Existing session found");
          await redirectAfterAuth(session.user.id);
          return;
        }

        // No valid auth data found
        logger.log("No auth data found, redirecting to register");
        if (isMounted) navigate("/register", { replace: true });

      } catch (err) {
        logger.error("Auth callback error:", err);
        if (isMounted) setError("An unexpected error occurred during authentication");
      }
    };

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
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
            onClick={() => navigate("/register", { replace: true })}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-foreground text-lg">Processing Sign-Up...</p>
        <p className="text-muted-foreground text-sm mt-2">Please wait while we complete your registration</p>
      </div>
    </div>
  );
}
