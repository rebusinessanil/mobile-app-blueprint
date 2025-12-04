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
        // Check if we already have a session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Session already exists, redirect to dashboard
          logger.log("Session found, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
          return;
        }

        // Check for OAuth code in URL (hash or query params)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const code = queryParams.get("code");

        if (accessToken && refreshToken) {
          // Handle implicit grant flow (tokens in hash)
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            logger.error("Set session error:", setSessionError);
            setError(setSessionError.message);
            return;
          }

          logger.log("Session set from tokens, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
        } else if (code) {
          // Handle PKCE flow (code in query params)
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            logger.error("Code exchange error:", exchangeError);
            setError(exchangeError.message);
            return;
          }

          logger.log("Code exchanged for session, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
        } else {
          // No tokens or code found, check for error in URL
          const errorDescription = hashParams.get("error_description") || queryParams.get("error_description");
          
          if (errorDescription) {
            setError(decodeURIComponent(errorDescription));
          } else {
            // No auth data found, redirect to login
            logger.log("No auth data found, redirecting to login");
            navigate("/login", { replace: true });
          }
        }
      } catch (err) {
        logger.error("Auth callback error:", err);
        setError("An unexpected error occurred during authentication");
      }
    };

    handleAuthCallback();
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
