import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";

interface ProfileCompletionGateProps {
  userId: string | null;
  children: React.ReactNode;
}

/**
 * Strict Profile Completion Gate
 * 
 * This gate BLOCKS access to any protected route until:
 * 1. Profile is 100% complete (verified by database flag)
 * 2. Welcome bonus has been credited (verified by database flag)
 * 
 * NO localStorage bypasses - everything is server-validated
 */
export default function ProfileCompletionGate({
  userId,
  children
}: ProfileCompletionGateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasNavigated, setHasNavigated] = useState(false);
  
  const {
    canAccessDashboard,
    loading,
    isOldUser,
  } = useProfileCompletion(userId || undefined);

  // Prevent back navigation when profile is incomplete
  useEffect(() => {
    // Skip for old users or if already has dashboard access
    if (isOldUser || canAccessDashboard) return;
    if (loading) return;
    
    // If on profile-edit, allow - this is where they need to be
    if (location.pathname === "/profile-edit") return;

    // Push state to prevent back navigation
    window.history.pushState(null, "", window.location.href);
    
    const handlePopState = () => {
      // Always push back to prevent escape and redirect to profile-edit
      window.history.pushState(null, "", window.location.href);
      navigate("/profile-edit", { replace: true });
    };
    
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [canAccessDashboard, loading, isOldUser, location.pathname, navigate]);

  // Main redirect logic - STRICT enforcement
  useEffect(() => {
    // Skip if still loading or is old user
    if (loading) return;
    if (isOldUser) return;
    
    // Already on profile-edit - allow access
    if (location.pathname === "/profile-edit") {
      setHasNavigated(false);
      return;
    }

    // If cannot access dashboard, redirect to profile-edit
    if (!canAccessDashboard && !hasNavigated) {
      setHasNavigated(true);
      navigate("/profile-edit", { replace: true });
    }
  }, [canAccessDashboard, loading, isOldUser, location.pathname, navigate, hasNavigated]);

  // Reset navigation flag when location changes
  useEffect(() => {
    setHasNavigated(false);
  }, [location.pathname]);

  // Old users bypass the gate completely
  if (isOldUser) {
    return <>{children}</>;
  }

  // Show loading state while checking
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If on profile-edit page, always allow access
  if (location.pathname === "/profile-edit") {
    return <>{children}</>;
  }

  // If can access dashboard, show children
  if (canAccessDashboard) {
    return <>{children}</>;
  }

  // Cannot access - show loading while redirect happens
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
