import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
interface ProfileCompletionBonusModalProps {
  open: boolean;
  onConfirm: () => void;
}
export default function ProfileCompletionBonusModal({
  open,
  onConfirm
}: ProfileCompletionBonusModalProps) {
  return <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-card border-primary/30 max-w-sm mx-auto text-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold text-primary">
            Congratulations
          </h2>
          
          <p className="text-muted-foreground">
            You got 199 Credits FREE!
          </p>
          
          <Button onClick={onConfirm} className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
}