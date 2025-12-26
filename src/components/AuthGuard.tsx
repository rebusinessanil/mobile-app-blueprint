import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { getUserRoleAndRedirect, isPathAllowedForRole } from "@/hooks/useUserRole";
import type { User } from "@supabase/supabase-js";

const PROFILE_GATE_BYPASS_KEY = "rebusiness_profile_completed";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [roleChecked, setRoleChecked] = useState(false);
  const profileCreatedRef = useRef(false);

  // Check if we're on profile-edit route (no loading flash needed)
  const isProfileRoute = location.pathname === '/profile-edit' || location.pathname === '/profile-setup';
  const isAdminRoute = location.pathname.startsWith('/admin');

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
      
      // Check user role and redirect accordingly
      const { isAdmin, redirectPath } = await getUserRoleAndRedirect(session.user.id);
      
      // Check if current path is allowed for user's role
      if (!isPathAllowedForRole(location.pathname, isAdmin)) {
        logger.log(`Path ${location.pathname} not allowed for ${isAdmin ? 'admin' : 'user'}, redirecting to ${redirectPath}`);
        navigate(redirectPath, { replace: true });
        return;
      }
      
      setRoleChecked(true);
      
      // Check profile completion status from DATABASE (not localStorage)
      // Skip for admin routes - admins don't need profile completion
      if (!isProfileRoute && !isAdminRoute) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('profile_completed, welcome_bonus_given')
          .eq('user_id', session.user.id)
          .single();
        
        const profileCompleted = profile?.profile_completed === true;
        const welcomeBonusGiven = profile?.welcome_bonus_given === true;
        
        // If both flags are true, user is fully complete
        if (profileCompleted && welcomeBonusGiven) {
          // Set localStorage bypass for faster future checks
          try {
            localStorage.setItem(PROFILE_GATE_BYPASS_KEY, "true");
          } catch {}
          
          // If on profile-edit but already complete, redirect to dashboard
          if (location.pathname === '/profile-edit') {
            navigate("/dashboard", { replace: true });
            return;
          }
        } else if (location.pathname !== '/profile-edit') {
          // Not complete and not on profile-edit - redirect there
          navigate("/profile-edit", { replace: true });
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
          // Clear ALL localStorage and sessionStorage on sign out
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch {}
          
          // Replace history to prevent back navigation to authenticated pages
          window.history.replaceState(null, '', '/dashboard');
          window.location.replace('/dashboard');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, isProfileRoute, isAdminRoute]);

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
  if (loading || checkingProfile || !roleChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
