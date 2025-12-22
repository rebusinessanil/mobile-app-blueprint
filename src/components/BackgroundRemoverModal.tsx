import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BackgroundRemoverModalProps {
  open: boolean;
  onKeep: () => void;
  onRemove: () => void;
  onClose: () => void;
  isProcessing?: boolean;
  progress?: number;
  progressText?: string;
  imageReady?: boolean;
}

export default function BackgroundRemoverModal({ 
  open, 
  onKeep, 
  onRemove,
  onClose,
  isProcessing = false,
  progress = 0,
  progressText = '',
  imageReady = true
}: BackgroundRemoverModalProps) {
  // Show loading UI when modal opens but image not yet decoded
  const isLoadingImage = !imageReady && !isProcessing;
  
  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onClose}>
      <DialogContent className="bg-[#1a2744] border-2 border-primary max-w-md">
        {!isProcessing && !isLoadingImage && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center"
          >
            <X className="w-4 h-4 text-primary-foreground" />
          </button>
        )}
        
        <div className="text-center space-y-6 pt-4">
          {isLoadingImage ? (
            // Image loading UI - shown instantly, hidden when decode completes
            <div className="py-8">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div 
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
                  style={{ animationDuration: '0.8s' }}
                ></div>
              </div>
              <h2 className="text-xl font-bold text-primary mb-2">Preparing Image</h2>
              <p className="text-white/80 text-sm">Loading...</p>
            </div>
          ) : isProcessing ? (
            // Processing UI
            <div className="py-8">
              {/* Circular Loading Animation */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                {/* Outer spinning ring */}
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div 
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
                  style={{ animationDuration: '1s' }}
                ></div>
                
                {/* Inner progress circle */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="hsl(var(--primary) / 0.2)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * progress) / 100}
                    className="transition-all duration-300"
                  />
                </svg>
                
                {/* Percentage text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{progress}%</span>
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-primary mb-2">Removing Background</h2>
              <p className="text-white/80 text-sm">{progressText || 'Please wait...'}</p>
              
              {/* Progress stages indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {[1, 2, 3, 4].map((stage) => (
                  <div
                    key={stage}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      progress >= stage * 25 
                        ? 'bg-primary scale-110' 
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Selection UI - shown after image is ready
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
