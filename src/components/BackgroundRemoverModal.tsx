import { useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PremiumGlobalLoader from "@/components/PremiumGlobalLoader";

interface BackgroundRemoverModalProps {
  open: boolean;
  onKeep?: () => void; // Optional - hidden for mandatory mode
  onRemove: () => void;
  onClose?: () => void; // Optional - hidden during mandatory processing
  isProcessing?: boolean;
  progress?: number;
  progressText?: string;
  isMandatory?: boolean; // When true, auto-triggers removal without choice
}

export default function BackgroundRemoverModal({ 
  open, 
  onKeep, 
  onRemove,
  onClose,
  isProcessing = false,
  progress = 0,
  progressText = '',
  isMandatory = false // Default to false - only profile photos should auto-trigger
}: BackgroundRemoverModalProps) {
  const hasTriggeredRef = useRef(false);

  // Auto-trigger background removal when modal opens in mandatory mode
  useEffect(() => {
    if (open && isMandatory && !isProcessing && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      // Small delay to allow modal to render first
      const timer = setTimeout(() => {
        onRemove();
      }, 150);
      return () => clearTimeout(timer);
    }
    
    // Reset trigger flag when modal closes
    if (!open) {
      hasTriggeredRef.current = false;
    }
  }, [open, isMandatory, isProcessing, onRemove]);

  // Show choice UI when not mandatory and not processing
  const showChoiceUI = !isMandatory && !isProcessing;

  return (
    <Dialog open={open} onOpenChange={showChoiceUI ? onClose : undefined}>
      <DialogContent className="bg-[#1a2744] border-2 border-primary max-w-md [&>button]:hidden">
        <div className="text-center space-y-6 pt-4">
          {showChoiceUI ? (
            // Choice UI for Achiever photos - user decides
            <div className="py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-3xl">✂️</span>
              </div>
              
              <h2 className="text-xl font-bold text-primary mb-2">
                Remove Background?
              </h2>
              <p className="text-white/80 text-sm mb-6">
                Would you like to remove the background from this image for a cleaner look?
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onKeep}
                  className="px-6 py-2.5 rounded-full border-2 border-primary/50 text-white hover:bg-primary/10 transition-colors"
                >
                  Keep Original
                </button>
                <button
                  onClick={onRemove}
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  Remove Background
                </button>
              </div>
            </div>
          ) : (
            // Processing UI - auto or manual removal in progress
            <div className="py-8">
              <div className="relative">
                <PremiumGlobalLoader size="lg" showMessage={false} fullScreen={false} />
                
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background/90 px-3 py-1 rounded-full border border-primary/50">
                  <span className="text-sm font-bold text-primary">{progress}%</span>
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-primary mb-2 mt-6">
                {progress === 0 ? 'Preparing...' : 'Removing Background'}
              </h2>
              <p className="text-white/80 text-sm shimmer-loading-text">
                {progressText || 'Processing image...'}
              </p>
              <p className="text-white/50 text-xs mt-2">
                This ensures no dark edges or halos on your banner
              </p>
              
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}