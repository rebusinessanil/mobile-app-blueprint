import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

const PROFILE_COMPLETED_KEY = "rebusiness_profile_completed";

// Check localStorage synchronously to prevent flash
const getProfileCompletedStatus = (): boolean => {
  try {
    return localStorage.getItem(PROFILE_COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
};

// Set profile completed status in localStorage
const setProfileCompletedStatus = (completed: boolean): void => {
  try {
    if (completed) {
      localStorage.setItem(PROFILE_COMPLETED_KEY, "true");
    } else {
      localStorage.removeItem(PROFILE_COMPLETED_KEY);
    }
  } catch {}
};

interface ProfileCompletionGateProps {
  userId: string | null;
  children: React.ReactNode;
}

export default function ProfileCompletionGate({
  userId,
  children
}: ProfileCompletionGateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  
  // Check localStorage synchronously FIRST - this is instant
  const profileAlreadyCompleted = getProfileCompletedStatus();

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch profile_completed field directly from database
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('profile_completed, created_at')
          .eq('user_id', userId)
          .single();

        if (error) {
          logger.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }

        const profileCompleted = profile?.profile_completed === true;
        
        // Update local state and localStorage
        setIsComplete(profileCompleted);
        if (profileCompleted) {
          setProfileCompletedStatus(true);
        }

        setLoading(false);
      } catch (error) {
        logger.error('Error checking profile completion:', error);
        setLoading(false);
      }
    };

    if (!profileAlreadyCompleted) {
      checkProfileCompletion();
    } else {
      setIsComplete(true);
      setLoading(false);
    }

    // Set up real-time subscription
    if (userId && !profileAlreadyCompleted) {
      const channel = supabase
        .channel(`profile-gate-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const newProfile = payload.new as { profile_completed?: boolean };
            if (newProfile?.profile_completed === true) {
              setIsComplete(true);
              setProfileCompletedStatus(true);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId, profileAlreadyCompleted]);

  // Prevent back navigation when profile is incomplete
  useEffect(() => {
    if (profileAlreadyCompleted || loading || isComplete) return;
    
    if (location.pathname !== "/profile-edit") {
      // Push state to prevent back navigation
      window.history.pushState(null, "", window.location.href);
      
      const handlePopState = () => {
        // Always push back to prevent escape
        window.history.pushState(null, "", window.location.href);
        navigate("/profile-edit", { replace: true });
      };
      
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [isComplete, loading, profileAlreadyCompleted, location.pathname, navigate]);

  // Redirect to profile-edit if profile is incomplete
  useEffect(() => {
    if (profileAlreadyCompleted || loading) return;
    
    if (!isComplete && location.pathname !== "/profile-edit") {
      navigate("/profile-edit", { replace: true });
    }
  }, [isComplete, loading, profileAlreadyCompleted, location.pathname, navigate]);

  // If profile already completed in localStorage, show children immediately
  if (profileAlreadyCompleted) {
    return <>{children}</>;
  }

  // Show blank loading state until profile check completes
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Completely blank with same background */}
      </div>
    );
  }

  // If on profile-edit page, allow access
  if (location.pathname === "/profile-edit") {
    return <>{children}</>;
  }

  // If profile is complete, show children
  if (isComplete) {
    return <>{children}</>;
  }

  // Profile incomplete and not on profile-edit - will redirect via useEffect
  return (
    <div className="min-h-screen bg-background">
      {/* Redirecting to profile-edit */}
    </div>
  );
}
