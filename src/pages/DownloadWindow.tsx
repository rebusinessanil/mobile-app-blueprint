import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface DownloadWindowState {
  bannerRef: string; // base64 image data
  rankName: string;
  bannerData: any;
}

export default function DownloadWindow() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as DownloadWindowState;
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const bannerImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!state?.bannerRef) {
      toast.error("No banner data found");
      navigate("/banner-preview");
    }
  }, [state, navigate]);

  const handleDownload = async () => {
    if (!bannerImgRef.current) {
      toast.error("Banner not ready for download");
      return;
    }

    setIsDownloading(true);
    const loadingToast = toast.loading("Preparing download...");

    try {
      // Create a canvas to render the image at full quality
      const canvas = document.createElement('canvas');
      const TARGET_WIDTH = 1080;
      const TARGET_HEIGHT = 1080;
      
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Failed to create canvas context");
      }

      // Draw the image to canvas
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = state.bannerRef;
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
          resolve(true);
        };
        img.onerror = reject;
      });

      // Convert to JPG blob with quality 0.95
      canvas.toBlob((blob) => {
        toast.dismiss(loadingToast);
        
        if (!blob) {
          toast.error("Failed to generate image");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const timestamp = new Date().getTime();
        link.download = `ReBusiness-${state.rankName}-${timestamp}.jpg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.success("✅ Banner saved to Gallery!");
      }, "image/jpeg", 0.95);

    } catch (error) {
      console.error("Download error:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to download. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!state?.bannerRef) {
      toast.error("No banner to share");
      return;
    }

    setIsSharing(true);

    try {
      // Convert base64 to blob
      const response = await fetch(state.bannerRef);
      const blob = await response.blob();
      
      const file = new File(
        [blob],
        `ReBusiness-${state.rankName}-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      // Check if Web Share API is supported
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${state.rankName} Achievement`,
          text: "Check out my achievement banner from ReBusiness!",
          files: [file]
        });
        toast.success("✅ Shared successfully!");
      } else {
        // Fallback: just download
        toast.info("Share not supported. Downloading instead...");
        handleDownload();
      }
    } catch (error: any) {
      console.error("Share error:", error);
      if (error.name !== "AbortError") {
        toast.error("Failed to share. Try downloading instead.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (!state?.bannerRef) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex flex-col items-center justify-center p-4 pb-safe">
      {/* Header */}
      <div className="w-full max-w-2xl mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-xl font-bold text-white tracking-wider">
          YOUR BANNER
        </h1>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {/* Banner Preview Container */}
      <div className="w-full max-w-2xl mb-8">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-primary/30 bg-black/40 backdrop-blur-sm p-3">
          <img
            ref={bannerImgRef}
            src={state.bannerRef}
            alt="Generated Banner"
            className="w-full h-auto rounded-xl"
            style={{
              aspectRatio: "1 / 1",
              objectFit: "contain"
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-4 px-4">
        {/* Download Button */}
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all active:scale-95"
        >
          <Download className="w-6 h-6 mr-3" />
          {isDownloading ? "Downloading..." : "Download"}
        </Button>

        {/* Share Button */}
        <Button
          onClick={handleShare}
          disabled={isSharing}
          className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-500/30 transition-all active:scale-95"
        >
          <Share2 className="w-6 h-6 mr-3" />
          {isSharing ? "Sharing..." : "Share"}
        </Button>
      </div>

      {/* Info Text */}
      <p className="text-white/60 text-sm text-center mt-6 max-w-md px-4">
        Full HD quality (1080×1080) • Saves to Gallery • Share to WhatsApp, Instagram & more
      </p>
    </div>
  );
}
