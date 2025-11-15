import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { supabase } from "@/integrations/supabase/client";
import type { Sticker } from "@/hooks/useStickers";
import html2canvas from "html2canvas";
interface BannerData {
  rankName: string;
  rankIcon: string;
  rankGradient: string;
  name: string;
  teamCity: string;
  chequeAmount?: string;
  photo: string | null;
  uplines: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  selectedStickers?: string[];
}
export default function BannerPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const bannerData = location.state as BannerData;
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Mock user ID - replace with actual auth when implemented
  const mockUserId = "mock-user-123";
  const { profile } = useProfile(mockUserId);
  const { photos: profilePhotos } = useProfilePhotos(mockUserId);

  // Use profile data for bottom section, fallback to banner data
  const displayName = profile?.name || bannerData?.name || "";
  const displayContact = profile?.mobile || profile?.whatsapp || "9876543210";
  const displayRank = profile?.rank || "Diamond";
  
  // Get primary profile photo or first photo
  const primaryPhoto = profile?.profile_photo || 
                       (profilePhotos[0]?.photo_url) || 
                       (bannerData?.photo) || 
                       null;

  // Fetch selected stickers
  useEffect(() => {
    const fetchStickers = async () => {
      if (!bannerData?.selectedStickers || bannerData.selectedStickers.length === 0) {
        return;
      }
      const {
        data,
        error
      } = await supabase.from('stickers').select('*').in('id', bannerData.selectedStickers);
      if (!error && data) {
        setStickers(data);
      }
    };
    fetchStickers();
  }, [bannerData?.selectedStickers]);

  // Early return if no banner data
  if (!bannerData) {
    navigate("/rank-selection");
    return null;
  }

  // Template color variations with different backgrounds
  const templateColors = [{
    id: 0,
    name: "Purple Pink",
    bgColor: "from-pink-900 to-purple-900"
  }, {
    id: 1,
    name: "Blue Indigo",
    bgColor: "from-blue-900 to-indigo-900"
  }, {
    id: 2,
    name: "Emerald Teal",
    bgColor: "from-emerald-900 to-teal-900"
  }, {
    id: 3,
    name: "Red Pink",
    bgColor: "from-red-900 to-pink-900"
  }, {
    id: 4,
    name: "Purple Blue",
    bgColor: "from-purple-900 to-blue-900"
  }, {
    id: 5,
    name: "Orange Yellow",
    bgColor: "from-yellow-900 to-orange-900"
  }];
  const handleDownload = async () => {
    if (!bannerRef.current) {
      toast.error("Banner not ready for download");
      return;
    }

    setIsDownloading(true);
    const loadingToast = toast.loading("Generating high-quality banner...");

    try {
      // Capture the banner at 1080x1080 resolution
      const canvas = await html2canvas(bannerRef.current, {
        scale: 2, // Higher scale for better quality
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 1080,
        height: 1080,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        toast.dismiss(loadingToast);
        
        if (!blob) {
          toast.error("Failed to generate image");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const timestamp = new Date().getTime();
        link.download = `ReBusiness-Banner-${bannerData.rankName}-${timestamp}.png`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
        toast.success("Banner downloaded successfully!");
      }, "image/png", 1.0);

    } catch (error) {
      console.error("Download error:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to download banner. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };
  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-black/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white tracking-wider">BANNER PREVIEW</h1>
          <button className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Main Banner Preview - 1080x1080 Fixed */}
        <div className="relative w-full max-w-[540px] mx-auto">
          <div
            ref={bannerRef}
            className="relative w-full bg-black overflow-hidden"
            style={{ aspectRatio: "1/1" }}
          >
            {/* Top Upline Avatars Row */}
            {bannerData.uplines && bannerData.uplines.length > 0 && (
              <div className="absolute top-[2%] left-1/2 -translate-x-1/2 flex gap-[1.5%] z-20">
                {bannerData.uplines.slice(0, 5).map((upline, idx) => (
                  <div
                    key={upline.id || idx}
                    className="rounded-full border-[3px] border-white overflow-hidden bg-gray-800"
                    style={{ width: "13%", aspectRatio: "1/1" }}
                  >
                    {upline.avatar && (
                      <img
                        src={upline.avatar}
                        alt={upline.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Left Large Profile Photo */}
            {primaryPhoto && (
              <div
                className="absolute overflow-hidden"
                style={{
                  left: "3%",
                  top: "15%",
                  width: "43%",
                  height: "55%",
                }}
              >
                <img
                  src={primaryPhoto}
                  alt={bannerData.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Crown Decoration Below Left Photo */}
            <div
              className="absolute"
              style={{
                left: "3%",
                top: "68%",
                width: "43%",
                height: "8%",
              }}
            >
              <svg viewBox="0 0 200 40" className="w-full h-full">
                {/* Curved base */}
                <path
                  d="M 0,35 Q 100,10 200,35"
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth="2"
                />
                {/* Crown shape */}
                <g transform="translate(100, 5)">
                  <circle cx="-25" cy="15" r="4" fill="#FFD700" />
                  <circle cx="25" cy="15" r="4" fill="#FFD700" />
                  <circle cx="0" cy="5" r="5" fill="#FFD700" />
                  <path
                    d="M -20,20 L -10,10 L 0,15 L 10,10 L 20,20 L 0,0 Z"
                    fill="#FFD700"
                  />
                </g>
              </svg>
            </div>

            {/* Right Side - Name */}
            <div
              className="absolute"
              style={{
                top: "23%",
                right: "5%",
                width: "48%",
              }}
            >
              <h2
                className="text-white font-black leading-none tracking-wider text-right"
                style={{
                  fontSize: "clamp(28px, 5.5vw, 56px)",
                  textShadow: "3px 3px 8px rgba(0,0,0,0.9)",
                  letterSpacing: "0.08em",
                }}
              >
                {bannerData.name.toUpperCase()}
              </h2>
            </div>

            {/* Right Side - City/Team */}
            {bannerData.teamCity && (
              <div
                className="absolute"
                style={{
                  top: "35%",
                  right: "5%",
                  width: "48%",
                }}
              >
                <p
                  className="text-white font-bold text-right tracking-widest"
                  style={{
                    fontSize: "clamp(16px, 3vw, 28px)",
                    textShadow: "2px 2px 6px rgba(0,0,0,0.9)",
                  }}
                >
                  {bannerData.teamCity.toUpperCase()}
                </p>
              </div>
            )}

            {/* Income Section - Bottom Left */}
            {bannerData.chequeAmount && (
              <div
                className="absolute"
                style={{
                  bottom: "18%",
                  left: "3%",
                  width: "58%",
                }}
              >
                <p
                  className="text-white font-light tracking-widest mb-1"
                  style={{
                    fontSize: "clamp(9px, 1.6vw, 14px)",
                    letterSpacing: "0.15em",
                  }}
                >
                  THIS WEEK INCOME QUALIFY FOR
                </p>
                <p
                  className="text-white font-black leading-none"
                  style={{
                    fontSize: "clamp(36px, 7.5vw, 72px)",
                    textShadow: "4px 4px 10px rgba(0,0,0,1)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {Number(bannerData.chequeAmount).toLocaleString("en-IN")}
                </p>
              </div>
            )}

            {/* Bottom Right - Secondary Profile Photo */}
            <div
              className="absolute overflow-hidden"
              style={{
                bottom: "9%",
                right: "4%",
                width: "30%",
                height: "35%",
              }}
            >
              <img
                src={primaryPhoto || "/placeholder.svg"}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Bottom Right - Profile Name and Rank */}
            <div
              className="absolute text-center"
              style={{
                bottom: "45%",
                right: "4%",
                width: "30%",
              }}
            >
              <p
                className="text-white font-bold leading-tight tracking-wide"
                style={{
                  fontSize: "clamp(12px, 2.2vw, 20px)",
                  textShadow: "2px 2px 6px rgba(0,0,0,0.9)",
                }}
              >
                {displayName.toUpperCase()}
              </p>
              <p
                className="text-[#FFD700] font-semibold leading-tight mt-1"
                style={{
                  fontSize: "clamp(9px, 1.6vw, 14px)",
                  textShadow: "1px 1px 4px rgba(0,0,0,0.9)",
                }}
              >
                {displayRank.toUpperCase()}
              </p>
            </div>

            {/* Bottom Left - Contact */}
            <div
              className="absolute"
              style={{
                bottom: "4%",
                left: "3%",
              }}
            >
              <p
                className="text-white font-bold leading-tight"
                style={{
                  fontSize: "clamp(12px, 2.2vw, 20px)",
                  textShadow: "2px 2px 6px rgba(0,0,0,0.9)",
                }}
              >
                +91 {displayContact}
              </p>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="h-16 px-12 bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFC700] hover:to-[#FF9500] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xl font-bold rounded-2xl flex items-center gap-3 shadow-lg"
          >
            <Download className="w-6 h-6" />
            {isDownloading ? "GENERATING..." : "DOWNLOAD HD"}
          </Button>
        </div>
      </div>
    </div>
  );
}