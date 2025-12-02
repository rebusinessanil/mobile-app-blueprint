import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { supabase } from "@/integrations/supabase/client";

const PROFILE_POPUP_SHOWN_KEY = "rebusiness_profile_popup_shown";

interface ProfileCompletionGateProps {
  userId: string | null;
  children: React.ReactNode;
}

export default function ProfileCompletionGate({
  userId,
  children
}: ProfileCompletionGateProps) {
  const navigate = useNavigate();
  const [popupDismissed, setPopupDismissed] = useState<boolean | null>(null);
  const {
    isComplete,
    missingFields,
    completionPercentage,
    loading
  } = useProfileCompletion(userId || undefined);

  // Check localStorage on mount
  useEffect(() => {
    const wasShown = localStorage.getItem(PROFILE_POPUP_SHOWN_KEY);
    setPopupDismissed(wasShown === "true");
  }, []);

  const handleContinueToProfile = async () => {
    // Set flag in localStorage immediately
    localStorage.setItem(PROFILE_POPUP_SHOWN_KEY, "true");
    setPopupDismissed(true);
    
    // Navigate to profile edit
    navigate("/profile-edit");
  };

  // Show loading state while checking
  if (loading || popupDismissed === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  // If profile is complete OR popup was already shown once, show children
  if (isComplete || popupDismissed) {
    return <>{children}</>;
  }

  // Profile incomplete AND popup never shown - show blocking screen
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
