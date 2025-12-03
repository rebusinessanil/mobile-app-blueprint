import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing authentication...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get session from URL hash (Supabase puts tokens in hash after OAuth redirect)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error("Auth callback error:", error);
          setStatus("Authentication failed. Redirecting...");
          setTimeout(() => navigate("/register?error=session_invalid"), 1500);
          return;
        }

        if (session) {
          // Session exists - check profile completion
          const { data: profile } = await supabase
            .from("profiles")
            .select("profile_completed")
            .eq("user_id", session.user.id)
            .single();

          if (profile?.profile_completed) {
            localStorage.setItem("rebusiness_profile_completed", "true");
            navigate("/dashboard", { replace: true });
          } else {
            localStorage.removeItem("rebusiness_profile_completed");
            navigate("/profile-edit", { replace: true });
          }
        } else {
          // No session - redirect to register
          setStatus("No session found. Redirecting...");
          setTimeout(() => navigate("/register?error=session_invalid"), 1500);
        }
      } catch (err) {
        logger.error("Auth callback exception:", err);
        setStatus("Something went wrong. Redirecting...");
        setTimeout(() => navigate("/register?error=session_invalid"), 1500);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-foreground text-lg">{status}</p>
      </div>
    </div>
  );
}
