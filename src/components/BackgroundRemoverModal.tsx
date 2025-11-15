import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BackgroundRemoverModalProps {
  open: boolean;
  onKeep: () => void;
  onRemove: () => void;
  onClose: () => void;
}

export default function BackgroundRemoverModal({ 
  open, 
  onKeep, 
  onRemove,
  onClose 
}: BackgroundRemoverModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-blue-900 border-2 border-primary max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center"
        >
          <X className="w-4 h-4 text-primary-foreground" />
        </button>
        
        <div className="text-center space-y-6 pt-4">
          <h2 className="text-3xl font-bold text-primary">Background Remover</h2>
          
          <p className="text-lg text-white leading-relaxed px-4">
            Do you want to remove your image background using our Background Remover Tool?
          </p>
          
          <div className="flex gap-4 pt-4">
            <Button
              onClick={onKeep}
              variant="outline"
              className="flex-1 h-14 text-lg font-bold border-2 border-primary bg-transparent text-white hover:bg-primary/20"
            >
              Keep
            </Button>
            <Button
              onClick={onRemove}
              className="flex-1 h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Remove
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}