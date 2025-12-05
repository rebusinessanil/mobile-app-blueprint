import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { User } from "@supabase/supabase-js";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const profileCreatedRef = useRef(false);

  // Check if we're on profile-edit route (no loading flash needed)
  const isProfileRoute = location.pathname === '/profile-edit' || location.pathname === '/profile-setup';

  useEffect(() => {
    let mounted = true;
    
    // Check for existing session FIRST (synchronous-like)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      if (!session?.user) {
        // No user, redirect to login immediately
        navigate("/login", { replace: true });
        return;
      }
      
      setUser(session.user);
      
      // Check if profile is already complete - redirect to dashboard immediately
      if (!isProfileRoute) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('profile_completed')
          .eq('user_id', session.user.id)
          .single();
        
        // If profile is complete, allow access; if on profile-edit, redirect to dashboard
        if (profile?.profile_completed === true && location.pathname === '/profile-edit') {
          navigate("/dashboard", { replace: true });
          return;
        }
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          navigate("/login", { replace: true });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, isProfileRoute]);

  // Check if user has a profile, create one if it doesn't exist
  useEffect(() => {
    const checkProfile = async () => {
      if (!user || profileCreatedRef.current) {
        setCheckingProfile(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('Error checking profile:', error);
        setCheckingProfile(false);
        return;
      }

      if (!profile) {
        profileCreatedRef.current = true;
        // Auto-create profile for new user
        const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        const userMobile = user.user_metadata?.mobile || user.phone || '';
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            name: userName,
            mobile: userMobile,
            welcome_popup_seen: false, // New user, will see welcome popup
          });

        if (insertError) {
          logger.error('Error creating profile:', insertError);
        }
      }

      setCheckingProfile(false);
    };

    if (!loading && user) {
      checkProfile();
    }
  }, [user, loading]);

  // For profile routes, render immediately without loading flash
  if (isProfileRoute && user) {
    return <>{children}</>;
  }

  // Show minimal loading only for non-profile routes
  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen bg-background" />
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
