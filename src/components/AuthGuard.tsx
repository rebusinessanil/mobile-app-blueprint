import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

  // Check if user has a profile, create one if it doesn't exist
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setCheckingProfile(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking profile:', error);
        setCheckingProfile(false);
        return;
      }

      if (!profile) {
        // Auto-create profile for existing user
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            name: user.email?.split('@')[0] || 'User',
            mobile: user.phone || '+000000000000', // Required field
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
          navigate("/profile-setup", { replace: true });
          return;
        }
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
