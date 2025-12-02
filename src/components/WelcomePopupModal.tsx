import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

const WELCOME_POPUP_KEY = "rebusiness_welcome_popup_shown";

interface WelcomePopupModalProps {
  userId: string | null;
}

export default function WelcomePopupModal({ userId }: WelcomePopupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

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
    navigate("/profile/edit");
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="bg-card border-primary/30 rounded-2xl max-w-[320px] p-6"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          
          {/* Message */}
          <p className="text-foreground text-lg font-semibold leading-snug">
            Update your profile and get{" "}
            <span className="text-primary">199 credits FREE</span>.
          </p>
          
          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-11 font-semibold"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
