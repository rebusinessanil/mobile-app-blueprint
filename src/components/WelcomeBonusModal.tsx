import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { useState, useEffect } from "react";

interface WelcomeBonusModalProps {
  open: boolean;
  bonusAmount: number;
  onContinue: () => void;
}

export default function WelcomeBonusModal({ 
  open, 
  bonusAmount,
  onContinue 
}: WelcomeBonusModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Smooth fade-in when modal opens
  useEffect(() => {
    if (open && !isClosing) {
      // Small delay for smooth fade-in
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [open, isClosing]);

  // Reset closing state when modal reopens
  useEffect(() => {
    if (open) {
      setIsClosing(false);
    }
  }, [open]);

  const handleContinue = () => {
    if (isClosing) return;
    
    setIsClosing(true);
    setIsVisible(false);
    
    // Smooth fade-out animation (250ms) before calling onContinue
    setTimeout(() => {
      onContinue();
    }, 250);
  };

  if (!open) return null;

  return (
    <Dialog open={open} modal={true}>
      <DialogContent 
        className={`bg-gradient-to-b from-card to-background border-2 border-primary max-w-sm mx-auto transition-all duration-250 ease-out ${
          isVisible && !isClosing 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
        }`}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="text-center space-y-6 py-6">
          {/* Animated Gift Icon */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
              <Gift className="w-10 h-10 text-primary-foreground animate-bounce" />
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-primary">
            Welcome Bonus Credited!
          </h2>
          
          {/* Bonus Amount Display */}
          <div className="bg-primary/10 rounded-2xl p-4 border border-primary/30">
            <p className="text-4xl font-bold text-primary">
              ₹{bonusAmount}
            </p>
            <p className="text-foreground/80 mt-1">
              Credits added to your wallet!
            </p>
          </div>
          
          {/* Message */}
          <p className="text-muted-foreground text-sm px-4">
            Thank you for joining ReBusiness! Use these credits to create stunning banners.
          </p>
          
          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={isClosing}
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.02]"
          >
            {isClosing ? 'Opening Dashboard...' : 'Continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
