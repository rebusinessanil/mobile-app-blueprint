import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";

const PROFILE_GATE_BYPASS_KEY = "rebusiness_profile_completed";

// Check localStorage synchronously to prevent flash (only for established users)
const getProfileBypassStatus = (): boolean => {
  try {
    return localStorage.getItem(PROFILE_GATE_BYPASS_KEY) === "true";
  } catch {
    return false;
  }
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
  
  // Check localStorage synchronously FIRST - this is instant
  const profileBypassed = getProfileBypassStatus();
  
  const {
    isComplete,
    loading,
    isOldUser,
    profileCompleted,
    welcomeBonusGiven
  } = useProfileCompletion(userId || undefined);

  // Determine if user can access dashboard
  // For NEW users: Both profile_completed AND welcome_bonus_given must be true
  const canAccessDashboard = isComplete || profileBypassed || isOldUser;

  // Prevent back button navigation when profile is incomplete
  const handlePopState = useCallback(() => {
    if (!canAccessDashboard && !loading) {
      // Always push back to prevent escape
      window.history.pushState(null, "", window.location.href);
      navigate("/profile-edit", { replace: true });
    }
  }, [canAccessDashboard, loading, navigate]);

  // Block back button, refresh, and direct URL access
  useEffect(() => {
    if (profileBypassed || loading || isOldUser) return;
    
    if (!canAccessDashboard && location.pathname !== "/profile-edit") {
      // Push state to prevent back navigation
      window.history.pushState(null, "", window.location.href);
      
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [canAccessDashboard, loading, profileBypassed, isOldUser, location.pathname, handlePopState]);

  // Prevent page refresh bypass - re-check on visibility change
  useEffect(() => {
    if (profileBypassed || isOldUser) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading && !canAccessDashboard) {
        if (location.pathname !== "/profile-edit") {
          navigate("/profile-edit", { replace: true });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [canAccessDashboard, loading, profileBypassed, isOldUser, location.pathname, navigate]);

  // Redirect to profile-edit if profile is incomplete (NEW users only)
  useEffect(() => {
    if (profileBypassed || isOldUser) return;
    if (loading) return;
    
    if (!canAccessDashboard && location.pathname !== "/profile-edit") {
      navigate("/profile-edit", { replace: true });
    }
  }, [canAccessDashboard, loading, profileBypassed, isOldUser, location.pathname, navigate]);

  // Redirect to dashboard when BOTH conditions are met
  useEffect(() => {
    if (loading || isOldUser) return;
    
    // Only redirect from profile-edit when complete
    if (location.pathname === "/profile-edit" && profileCompleted && welcomeBonusGiven) {
      // Set localStorage bypass for future
      try {
        localStorage.setItem(PROFILE_GATE_BYPASS_KEY, "true");
      } catch {}
      navigate("/dashboard", { replace: true });
    }
  }, [loading, isOldUser, profileCompleted, welcomeBonusGiven, location.pathname, navigate]);

  // If localStorage bypass is set OR is old user, show children immediately
  if (profileBypassed || isOldUser) {
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

  // If profile is complete (both flags true), show children
  if (canAccessDashboard) {
    return <>{children}</>;
  }

  // Profile incomplete and not on profile-edit - will redirect via useEffect
  // Show blank screen during redirect
  return (
    <div className="min-h-screen bg-background">
      {/* Redirecting to profile-edit */}
    </div>
  );
}
