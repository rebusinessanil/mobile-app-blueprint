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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const { profile } = useProfile(userId ?? undefined);
  const { photos: profilePhotos } = useProfilePhotos(userId ?? undefined);

  // Use profile data for bottom section, fallback to banner data
  const displayName: string = profile?.name || bannerData?.name || "";
  const displayContact: string = profile?.mobile || profile?.whatsapp || "9876543210";
  const displayRank: string = profile?.rank || "Diamond";
  
  // Get primary profile photo or first photo
  const primaryPhoto: string | null = profile?.profile_photo || 
                       profilePhotos[0]?.photo_url || 
                       bannerData?.photo || 
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
  return <div className="min-h-screen bg-navy-dark pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white tracking-wider">BANNER PREVIEW</h1>
          <button className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Main Banner Preview - Fixed Square Format (1080x1080 base) */}
        <div className="relative w-full max-w-[600px] mx-auto">
          <div ref={bannerRef} className="border-4 border-primary rounded-2xl overflow-hidden shadow-2xl">
            {/* Fixed aspect ratio container - scales proportionally on all devices */}
            <div className={`relative w-full bg-gradient-to-br ${templateColors[selectedTemplate].bgColor}`} style={{
            paddingBottom: '100%'
          }}>
              <div className="absolute inset-0">
                
                {/* Left Side - Main Achievement Photo (Use Profile Photo) */}
                {primaryPhoto && <div className="absolute overflow-hidden shadow-2xl" style={{
                left: '2%',
                top: '8%',
                width: '42%',
                height: '65%'
              }}>
                    <img src={primaryPhoto} alt={bannerData.name} className="w-full h-full object-cover" />
                  </div>}

                {/* Right Side - Name and Team */}
                <div className="absolute" style={{
                top: '20%',
                right: '6%',
                width: '48%'
              }}>
                  <h2 className="text-white font-black leading-none tracking-wider text-right" style={{
                  fontSize: 'clamp(32px,6.5vw,68px)',
                  textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
                  letterSpacing: '0.05em'
                }}>
                    {bannerData.name.toUpperCase()}
                  </h2>
                  {bannerData.teamCity && <p className="text-white font-bold text-right mt-2 tracking-widest" style={{
                  fontSize: 'clamp(16px,3vw,32px)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }}>
                    TEAM - {bannerData.teamCity.toUpperCase()}
                  </p>}
                </div>

                {/* Achievement Stickers - Dynamic from Selection */}
                {stickers.length > 0 && <div className="absolute flex gap-[2%]" style={{
                bottom: '33%',
                left: '2%',
                width: '44%'
              }}>
                    {stickers.map((sticker, index) => <div key={sticker.id} className="rounded-full border-[5px] border-yellow-400 overflow-hidden shadow-xl" style={{
                  width: '30%',
                  aspectRatio: '1/1'
                }}>
                        <img src={sticker.image_url} alt={sticker.name} className="w-full h-full object-cover" />
                      </div>)}
                  </div>}

                {/* Income Section - Bottom Left */}
                {bannerData.chequeAmount && <div className="absolute" style={{
                bottom: '16%',
                left: '2%',
                width: '55%'
              }}>
                    <p style={{
                  fontSize: 'clamp(10px,1.8vw,16px)',
                  letterSpacing: '0.1em'
                }} className="text-white leading-tight mb-1 text-xs font-thin text-left my-0 px-0 py-0 mx-0">
                      THIS WEEK INCOME 
                    </p>
                    <p className="font-black leading-none" style={{
                  fontSize: 'clamp(48px,9vw,90px)',
                  color: '#FFFFFF',
                  textShadow: '4px 4px 8px rgba(0,0,0,0.9)',
                  letterSpacing: '0.02em'
                }}>
                      {Number(bannerData.chequeAmount).toLocaleString('en-IN')}
                    </p>
                  </div>}

                {/* Bottom Right - Profile Photo (Auto-Sync from Profile) */}
                <div className="absolute overflow-hidden shadow-2xl" style={{
                bottom: '8%',
                right: '3%',
                width: '32%',
                height: '38%'
              }}>
                  <img src={primaryPhoto || "/placeholder.svg"} alt={displayName} className="w-full h-full object-cover" />
                </div>

                {/* Bottom Right - Profile Name and Rank (Auto-Sync) */}
                <div style={{
                bottom: '48%',
                right: '3%',
                width: '32%'
              }} className="absolute text-center mx-[240px] py-[40px] px-0 my-[240px]">
                  <p style={{
                  fontSize: 'clamp(14px,2.5vw,24px)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }} className="text-white font-bold leading-tight tracking-wide mx-0">
                    {displayName.toUpperCase()}
                  </p>
                  <p style={{
                  fontSize: 'clamp(10px,1.8vw,16px)',
                  color: '#FFD700',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }} className="font-semibold leading-tight mt-1 text-xs">
                    {displayRank.toUpperCase()}
                  </p>
                </div>

                {/* Bottom Left - Contact Info (Auto-Sync from Profile) */}
                <div className="absolute" style={{
                bottom: '3%',
                left: '2%'
              }}>
                  <p style={{
                  fontSize: 'clamp(14px,2.5vw,22px)',
                  color: '#FFFFFF',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }} className="font-bold leading-tight px-0 py-0 text-xs mx-[5px] my-0">
                    +91 {displayContact}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Profile Photos Gallery - 1-6 Square Thumbnails */}
        {profilePhotos.length > 0 && (
          <div className="flex gap-3 justify-center overflow-x-auto pb-2 px-4">
            {profilePhotos.slice(0, 6).map((photo, idx) => (
              <div 
                key={photo.id} 
                className="w-16 h-16 aspect-square rounded-lg overflow-hidden border-2 border-primary shadow-md flex-shrink-0"
              >
                <img 
                  src={photo.photo_url} 
                  alt={`Profile ${idx + 1}`} 
                  className="w-full h-full object-cover object-center" 
                />
              </div>
            ))}
          </div>
        )}

        {/* Download Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="h-16 px-12 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white text-xl font-bold rounded-2xl flex items-center gap-3"
          >
            <Download className="w-6 h-6" />
            {isDownloading ? "GENERATING..." : "DOWNLOAD"}
          </Button>
        </div>

        {/* Template Color Selection Grid */}
        <div className="grid grid-cols-3 gap-4">
          {templateColors.map(template => <button key={template.id} onClick={() => setSelectedTemplate(template.id)} className={`aspect-square rounded-2xl overflow-hidden transition-all relative ${selectedTemplate === template.id ? "border-4 border-[#00FF00] scale-105 shadow-lg shadow-[#00FF00]/30" : "border-2 border-muted/30 hover:border-primary/50"}`}>
              <div className={`w-full h-full bg-gradient-to-br ${template.bgColor} flex items-center justify-center`}>
                <div className="text-5xl">💚</div>
              </div>
            </button>)}
        </div>

      </div>
    </div>;
}