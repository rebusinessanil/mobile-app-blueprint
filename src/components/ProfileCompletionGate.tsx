import { useNavigate } from "react-router-dom";
import { UserCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";

const PROFILE_POPUP_SHOWN_KEY = "rebusiness_profile_popup_shown";

// Check localStorage synchronously to prevent flash
const getPopupShownStatus = (): boolean => {
  try {
    return localStorage.getItem(PROFILE_POPUP_SHOWN_KEY) === "true";
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
  
  // Check localStorage synchronously FIRST - this is instant
  const popupAlreadyShown = getPopupShownStatus();
  
  const {
    isComplete,
    missingFields,
    completionPercentage,
    loading
  } = useProfileCompletion(userId || undefined);

  const handleContinueToProfile = () => {
    // Set flag in localStorage immediately
    localStorage.setItem(PROFILE_POPUP_SHOWN_KEY, "true");
    // Navigate to profile edit
    navigate("/profile-edit");
  };

  // CRITICAL: If popup was already shown once, IMMEDIATELY bypass - no flash, no loading
  if (popupAlreadyShown) {
    return <>{children}</>;
  }

  // Popup was never shown, so we need to check profile completion
  // Show BLANK loading state until profile check completes - prevents any flash
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Completely blank with same background - no visible loading indicator */}
      </div>
    );
  }

  // Profile check complete - if profile is complete, show children and mark popup as shown
  if (isComplete) {
    // Auto-mark as shown since profile is complete (prevents future checks)
    try {
      localStorage.setItem(PROFILE_POPUP_SHOWN_KEY, "true");
    } catch {}
    return <>{children}</>;
  }

  // Profile incomplete AND popup never shown - show blocking popup
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card border border-primary/30 rounded-3xl p-8 shadow-2xl shadow-primary/10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <UserCircle className="w-12 h-12 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-foreground mb-2">
            Please Complete Your Profile To Unlock All Features
          </h2>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Profile Completion</span>
              <span className="text-primary font-semibold">{completionPercentage}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Missing Information</span>
              </div>
              <ul className="space-y-1">
                {missingFields.map((field) => (
                  <li key={field} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Continue Button */}
          <Button
            onClick={handleContinueToProfile}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl"
          >
            Continue to Profile
          </Button>

          {/* Helper Text */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            Complete all required fields to access Dashboard & Categories
          </p>
        </div>
      </div>
    </div>
  );
}
