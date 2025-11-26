import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

interface InsufficientBalanceModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InsufficientBalanceModal({
  open,
  onClose,
}: InsufficientBalanceModalProps) {
  const handleRecharge = () => {
    window.open("https://wa.me/917734990035", "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-primary/20 max-w-md">
        <div className="flex flex-col items-center text-center space-y-6 py-4">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="w-10 h-10 text-primary" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Insufficient Balance
            </h2>
            <p className="text-muted-foreground text-base">
              Please recharge your wallet to download banners.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col w-full gap-3 pt-2">
            <Button
              onClick={handleRecharge}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl h-12 text-base"
            >
              Recharge Wallet
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-primary/30 text-foreground hover:bg-primary/10 rounded-xl h-12 text-base"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
