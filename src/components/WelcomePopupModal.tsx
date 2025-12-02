import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Camera, User, Phone, MessageCircle, Briefcase, Check } from "lucide-react";

const WELCOME_POPUP_KEY = "rebusiness_welcome_popup_shown";

interface ProfileField {
  icon: React.ElementType;
  label: string;
  completed: boolean;
}

interface WelcomePopupModalProps {
  userId: string | null;
  profile?: {
    name?: string;
    mobile?: string;
    whatsapp?: string;
    role?: string;
    profile_photo?: string;
  } | null;
  photosCount?: number;
}

export default function WelcomePopupModal({ userId, profile, photosCount = 0 }: WelcomePopupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Calculate which fields are completed
  const profileFields: ProfileField[] = [
    { icon: Camera, label: "Profile Photo", completed: photosCount > 0 || !!profile?.profile_photo },
    { icon: User, label: "Full Name", completed: !!profile?.name && profile.name.trim().length > 0 },
    { icon: Phone, label: "Mobile Number", completed: !!profile?.mobile && profile.mobile.trim().length > 0 },
    { icon: MessageCircle, label: "WhatsApp Number", completed: !!profile?.whatsapp && profile.whatsapp.trim().length > 0 },
    { icon: Briefcase, label: "Role/Designation", completed: !!profile?.role && profile.role.trim().length > 0 },
  ];

  const completedCount = profileFields.filter(f => f.completed).length;
  const totalFields = profileFields.length;
  const progressPercent = Math.round((completedCount / totalFields) * 100);

  useEffect(() => {
    if (!userId) return;
    
    // Check if popup was already shown
    const wasShown = localStorage.getItem(WELCOME_POPUP_KEY);
    if (!wasShown) {
      // Show popup after a small delay for smooth UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  const handleContinue = () => {
    // Mark as shown so it never appears again
    localStorage.setItem(WELCOME_POPUP_KEY, "true");
    setIsOpen(false);
    // Navigate to profile edit
    navigate("/profile-edit");
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="bg-card border-primary/30 rounded-2xl max-w-[340px] p-5"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <Gift className="w-7 h-7 text-primary" />
          </div>
          
          {/* Message */}
          <p className="text-foreground text-base font-semibold leading-snug">
            Update your profile and get{" "}
            <span className="text-primary">199 credits FREE</span>
          </p>

          {/* Progress Bar */}
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Profile Completion</span>
              <span className="text-primary font-medium">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Fields Checklist */}
          <div className="w-full space-y-2">
            {profileFields.map((field, index) => {
              const IconComponent = field.icon;
              return (
                <div 
                  key={index}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                    field.completed ? 'bg-primary/10' : 'bg-muted/50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    field.completed ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}>
                    {field.completed ? (
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    ) : (
                      <IconComponent className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    field.completed ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {field.label}
                  </span>
                  {field.completed && (
                    <Check className="w-4 h-4 text-primary ml-auto" />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-11 font-semibold mt-2"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
