import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

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
  return (
    <Dialog open={open} modal={true}>
      <DialogContent 
        className="bg-gradient-to-b from-[#1a2744] to-[#0f1a2e] border-2 border-primary max-w-sm mx-auto"
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
            <p className="text-white/80 mt-1">
              Credits added to your wallet!
            </p>
          </div>
          
          {/* Message */}
          <p className="text-white/70 text-sm px-4">
            Thank you for joining ReBusiness! Use these credits to create stunning banners.
          </p>
          
          {/* Continue Button */}
          <Button
            onClick={onContinue}
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.02]"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
