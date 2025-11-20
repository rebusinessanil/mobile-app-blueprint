import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BannerLargePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bannerContent: React.ReactNode;
  onDownload?: () => void;
}

export default function BannerLargePreviewModal({
  isOpen,
  onClose,
  bannerContent,
  onDownload,
}: BannerLargePreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto bg-background/95 backdrop-blur-sm">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold text-foreground">
            Full Size Banner Preview
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Large Preview Container */}
          <div className="relative w-full flex items-center justify-center">
            <div className="relative shadow-2xl rounded-lg overflow-hidden">
              {bannerContent}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {onDownload && (
              <Button
                onClick={onDownload}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                size="lg"
              >
                <Download className="h-5 w-5" />
                Download Banner
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              size="lg"
            >
              Close Preview
            </Button>
          </div>

          {/* Info Text */}
          <p className="text-sm text-muted-foreground text-center max-w-md">
            This preview shows the banner at its actual size as it will appear on the frontend.
            All positioning and sizing are preserved exactly.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
