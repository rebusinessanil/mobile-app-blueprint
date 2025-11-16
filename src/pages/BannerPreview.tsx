import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { supabase } from "@/integrations/supabase/client";
import type { Sticker } from "@/hooks/useStickers";
import html2canvas from "html2canvas";
interface Upline {
  id: string;
  name: string;
  avatar?: string;
}
interface BannerData {
  rankName: string;
  rankIcon: string;
  rankGradient: string;
  name: string;
  teamCity: string;
  chequeAmount?: string;
  photo: string | null;
  uplines: Upline[];
  selectedStickers?: string[];
}
export default function BannerPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const bannerData = location.state as BannerData;
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Get authenticated user
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);
  const {
    profile
  } = useProfile(userId ?? undefined);
  const {
    photos: profilePhotos
  } = useProfilePhotos(userId ?? undefined);

  // Use profile data, fallback to banner data
  const displayName: string = profile?.name || bannerData?.name || "";
  const displayContact: string = profile?.mobile || profile?.whatsapp || "9876543210";
  const displayRank: string = profile?.rank || "ROYAL AMBASSADOR";

  // Get primary profile photo
  const primaryPhoto: string | null = profile?.profile_photo || profilePhotos[0]?.photo_url || bannerData?.photo || null;

  // Get mentor/upline photo (first upline with avatar)
  const mentorPhoto: string | null = bannerData?.uplines?.find(u => u.avatar)?.avatar || profilePhotos[1]?.photo_url || primaryPhoto;
  const mentorName: string = bannerData?.uplines?.[0]?.name || displayName;

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

  // 16 template variations (4x4 grid)
  const templateColors = [
    { id: 0, name: "Green Black", bgColor: "from-black via-gray-900 to-black", border: "border-green-500" },
    { id: 1, name: "Purple Pink", bgColor: "from-purple-900 via-pink-900 to-purple-800", border: "border-pink-500" },
    { id: 2, name: "Blue Indigo", bgColor: "from-blue-900 via-indigo-900 to-blue-800", border: "border-blue-500" },
    { id: 3, name: "Red Orange", bgColor: "from-red-900 via-orange-900 to-red-800", border: "border-orange-500" },
    { id: 4, name: "Emerald Teal", bgColor: "from-emerald-900 via-teal-900 to-emerald-800", border: "border-teal-500" },
    { id: 5, name: "Pink Purple", bgColor: "from-pink-900 via-purple-900 to-pink-800", border: "border-purple-500" },
    { id: 6, name: "Cyan Blue", bgColor: "from-cyan-900 via-blue-900 to-cyan-800", border: "border-cyan-500" },
    { id: 7, name: "Yellow Orange", bgColor: "from-yellow-900 via-orange-900 to-yellow-800", border: "border-yellow-500" },
    { id: 8, name: "Indigo Purple", bgColor: "from-indigo-900 via-purple-900 to-indigo-800", border: "border-indigo-500" },
    { id: 9, name: "Rose Red", bgColor: "from-rose-900 via-red-900 to-rose-800", border: "border-rose-500" },
    { id: 10, name: "Violet Purple", bgColor: "from-violet-900 via-purple-900 to-violet-800", border: "border-violet-500" },
    { id: 11, name: "Lime Green", bgColor: "from-lime-900 via-green-900 to-lime-800", border: "border-lime-500" },
    { id: 12, name: "Amber Orange", bgColor: "from-amber-900 via-orange-900 to-amber-800", border: "border-amber-500" },
    { id: 13, name: "Sky Blue", bgColor: "from-sky-900 via-blue-900 to-sky-800", border: "border-sky-500" },
    { id: 14, name: "Fuchsia Pink", bgColor: "from-fuchsia-900 via-pink-900 to-fuchsia-800", border: "border-fuchsia-500" },
    { id: 15, name: "Slate Gray", bgColor: "from-slate-900 via-gray-900 to-slate-800", border: "border-slate-500" },
  ];
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
        scale: 2,
        // Higher scale for better quality
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 1080,
        height: 1080
      });

      // Convert to blob and download
      canvas.toBlob(blob => {
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
    <div className="min-h-screen bg-[#0B0E15] pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-[#0B0E15]/95 backdrop-blur-sm z-40 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <h1 className="text-2xl font-bold text-white tracking-widest">BANNER PREVIEW</h1>
          
          <button className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Main Banner Preview - Gold outer border, Green inner border */}
        <div className="relative w-full max-w-[600px] mx-auto">
          <div className="border-4 border-[#FFD700] rounded-lg overflow-hidden">
            <div
              ref={bannerRef}
              className={`border-4 ${templateColors[selectedTemplate].border} relative w-full bg-gradient-to-br ${templateColors[selectedTemplate].bgColor}`}
              style={{ paddingBottom: '100%' }}
            >
              <div className="absolute inset-0">
                {/* Top - Small circular upline avatars */}
                <div className="absolute top-[3%] left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {bannerData.uplines?.slice(0, 5).map((upline, idx) => (
                    <div
                      key={upline.id}
                      className="w-12 h-12 rounded-full border-3 border-white overflow-hidden shadow-lg"
                    >
                      <img
                        src={upline.avatar || primaryPhoto || "/placeholder.svg"}
                        alt={upline.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* LEFT - Main User Photo (Full height) */}
                {primaryPhoto && (
                  <div
                    className="absolute overflow-hidden"
                    style={{
                      left: '3%',
                      top: '12%',
                      width: '40%',
                      height: '75%'
                    }}
                  >
                    <img
                      src={primaryPhoto}
                      alt={bannerData.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                )}

                {/* Golden Crown below user photo */}
                <div
                  className="absolute"
                  style={{
                    left: '13%',
                    bottom: '20%',
                    width: '20%',
                    height: '8%'
                  }}
                >
                  <svg viewBox="0 0 100 50" className="w-full h-full fill-[#FFD700]">
                    <path d="M10 40 L20 10 L30 35 L40 5 L50 30 L60 5 L70 35 L80 10 L90 40 C85 45 75 48 50 48 C25 48 15 45 10 40 Z" />
                  </svg>
                </div>

                {/* CENTER-RIGHT - Name and Team */}
                <div
                  className="absolute"
                  style={{
                    top: '25%',
                    right: '5%',
                    width: '50%',
                    textAlign: 'center'
                  }}
                >
                  <h2
                    className="text-white font-black tracking-wider whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{
                      fontSize: 'clamp(24px, 5vw, 56px)',
                      textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
                      lineHeight: '1'
                    }}
                  >
                    {bannerData.name.toUpperCase()}
                  </h2>
                  
                  {bannerData.teamCity && (
                    <p
                      className="text-white font-semibold tracking-widest mt-2"
                      style={{
                        fontSize: 'clamp(12px, 2.5vw, 28px)',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                      }}
                    >
                      {bannerData.teamCity.toUpperCase()}
                    </p>
                  )}
                </div>
                {/* BOTTOM CENTER - Income */}
                {bannerData.chequeAmount && (
                  <div
                    className="absolute text-center"
                    style={{
                      bottom: '15%',
                      left: '5%',
                      width: '55%'
                    }}
                  >
                    <p
                      className="text-white font-light tracking-widest"
                      style={{
                        fontSize: 'clamp(8px, 1.5vw, 14px)',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                      }}
                    >
                      THIS WEEK INCOME QUALIFY FOR
                    </p>
                    <p
                      className="text-white font-black tracking-tight"
                      style={{
                        fontSize: 'clamp(32px, 7vw, 72px)',
                        textShadow: '4px 4px 8px rgba(0,0,0,0.9)',
                        lineHeight: '1'
                      }}
                    >
                      {Number(bannerData.chequeAmount).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}

                {/* BOTTOM LEFT - Phone */}
                <div
                  className="absolute"
                  style={{
                    bottom: '3%',
                    left: '5%'
                  }}
                >
                  <p
                    className="text-white font-bold tracking-wide"
                    style={{
                      fontSize: 'clamp(10px, 2vw, 20px)',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    +91 {displayContact}
                  </p>
                </div>

                {/* BOTTOM RIGHT - Mentor Photo */}
                {mentorPhoto && (
                  <div
                    className="absolute overflow-hidden shadow-2xl"
                    style={{
                      bottom: '8%',
                      right: '5%',
                      width: '30%',
                      height: '35%'
                    }}
                  >
                    <img
                      src={mentorPhoto}
                      alt={mentorName}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                )}

                {/* BOTTOM RIGHT - Mentor Name and Title */}
                <div
                  className="absolute text-center"
                  style={{
                    bottom: '45%',
                    right: '5%',
                    width: '30%'
                  }}
                >
                  <p
                    className="text-white font-bold tracking-wide"
                    style={{
                      fontSize: 'clamp(10px, 2vw, 20px)',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    {mentorName.toUpperCase()}
                  </p>
                  <p
                    className="text-[#FFD700] font-semibold tracking-wider mt-1"
                    style={{
                      fontSize: 'clamp(8px, 1.5vw, 14px)',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                    }}
                  >
                    {displayRank}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Thumbnails and Download Button Row */}
        <div className="flex items-center justify-between gap-4 px-2">
          {/* Left - Two thumbnail previews */}
          <div className="flex gap-3">
            {profilePhotos.slice(0, 2).map((photo, idx) => (
              <div
                key={photo.id}
                className="w-20 h-20 rounded-lg overflow-hidden border-2 border-[#FFD700] shadow-lg"
              >
                <img
                  src={photo.photo_url}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Right - Download Button */}
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="h-20 px-8 bg-gradient-to-br from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 disabled:opacity-50 text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xl"
          >
            <ChevronDown className="w-8 h-8" />
            <ChevronDown className="w-8 h-8 -mt-4" />
            <span className="text-sm font-bold tracking-wider">
              {isDownloading ? "LOADING..." : "DOWNLOAD"}
            </span>
          </Button>
        </div>

        {/* 4x4 Template Grid */}
        <div className="grid grid-cols-4 gap-3 px-2">
          {templateColors.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`aspect-square rounded-lg overflow-hidden transition-all shadow-lg ${
                selectedTemplate === template.id
                  ? `border-4 ${template.border} scale-105`
                  : "border-2 border-gray-700 hover:border-gray-500"
              }`}
            >
              <div className={`w-full h-full bg-gradient-to-br ${template.bgColor}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}