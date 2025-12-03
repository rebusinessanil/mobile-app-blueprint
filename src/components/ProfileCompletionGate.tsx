import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";

const PROFILE_COMPLETED_KEY = "rebusiness_profile_completed";

// Check localStorage synchronously to prevent flash
const getProfileCompletedStatus = (): boolean => {
  try {
    return localStorage.getItem(PROFILE_COMPLETED_KEY) === "true";
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
  const profileAlreadyCompleted = getProfileCompletedStatus();
  
  const {
    isComplete,
    loading
  } = useProfileCompletion(userId || undefined);

  // Prevent back navigation when profile is incomplete
  useEffect(() => {
    if (profileAlreadyCompleted || loading) return;
    
    if (!isComplete && location.pathname !== "/profile-edit") {
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
    if (profileAlreadyCompleted) return;
    if (loading) return;
    
    if (!isComplete && location.pathname !== "/profile-edit") {
      navigate("/profile-edit", { replace: true });
    }
    
    // Mark as completed when profile is complete
    if (isComplete) {
      try {
        localStorage.setItem(PROFILE_COMPLETED_KEY, "true");
      } catch {}
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

  // Profile incomplete and not on profile-edit - will redirect via useEffect
  // Show blank screen during redirect
  if (!isComplete) {
    return (
      <div className="min-h-screen bg-background">
        {/* Redirecting to profile-edit */}
      </div>
    );
  }

  return <>{children}</>;
}