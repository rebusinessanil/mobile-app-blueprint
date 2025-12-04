import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { User } from "@supabase/supabase-js";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        
        // Only redirect on explicit sign out, not on session refresh or other events
        if (event === 'SIGNED_OUT') {
          navigate("/login", { replace: true });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check if user has a profile - don't auto-create, let database trigger handle it
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setCheckingProfile(false);
        return;
      }

      // Wait a moment for database trigger to create profile for new users
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, profile_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('Error checking profile:', error);
        setCheckingProfile(false);
        return;
      }

      // If no profile exists after trigger should have created it,
      // redirect to profile setup without trying to insert
      if (!profile) {
        logger.log('No profile found, redirecting to profile-edit');
        navigate("/profile-edit", { replace: true });
        setCheckingProfile(false);
        return;
      }

      setCheckingProfile(false);
    };

    if (!loading && user) {
      checkProfile();
    }
  }, [user, loading, navigate]);

  if (loading || checkingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-dark">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
