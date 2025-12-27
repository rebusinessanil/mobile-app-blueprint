import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import GoldCoinLoader from "@/components/GoldCoinLoader";

interface BackgroundRemoverModalProps {
  open: boolean;
  onKeep: () => void;
  onRemove: () => void;
  onClose: () => void;
  isProcessing?: boolean;
  progress?: number;
  progressText?: string;
}

export default function BackgroundRemoverModal({ 
  open, 
  onKeep, 
  onRemove,
  onClose,
  isProcessing = false,
  progress = 0,
  progressText = ''
}: BackgroundRemoverModalProps) {
  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onClose}>
      <DialogContent className="bg-[#1a2744] border-2 border-primary max-w-md">
        {!isProcessing && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center"
          >
            <X className="w-4 h-4 text-primary-foreground" />
          </button>
        )}
        
        <div className="text-center space-y-6 pt-4">
          {isProcessing ? (
            // Processing UI with Gold Coin Loader
            <div className="py-8">
              {/* Premium Gold Coin with Progress Overlay */}
              <div className="relative">
                <GoldCoinLoader size="xl" showMessage={false} />
                
                {/* Progress percentage overlay */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background/90 px-3 py-1 rounded-full border border-primary/50">
                  <span className="text-sm font-bold text-primary">{progress}%</span>
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-primary mb-2 mt-6">Removing Background</h2>
              <p className="text-white/80 text-sm shimmer-loading-text">{progressText || 'Please wait...'}</p>
              
              {/* Progress stages indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {[1, 2, 3, 4].map((stage) => (
                  <div
                    key={stage}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      progress >= stage * 25 
                        ? 'bg-primary scale-110 shadow-[0_0_8px_hsl(45_100%_60%/0.6)]' 
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Selection UI
            <>
              <h2 className="text-3xl font-bold text-primary">Background Remover</h2>
              
              <p className="text-lg text-white leading-relaxed px-4">
                Do you want to remove your image background using our AI Background Remover?
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}