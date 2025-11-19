import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import downloadIcon from "@/assets/download-icon.png";
import { useProfile } from "@/hooks/useProfile";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { useBannerSettings } from "@/hooks/useBannerSettings";
import { useTemplateBackgrounds } from "@/hooks/useTemplateBackgrounds";
import { useQuery } from "@tanstack/react-query";
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
  templateId?: string;
  rankId?: string;
}
export default function BannerPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const bannerData = location.state as BannerData;
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPhotoFlipped, setIsPhotoFlipped] = useState(false);
  const [isMentorPhotoFlipped, setIsMentorPhotoFlipped] = useState(false);
  const [selectedMentorPhotoIndex, setSelectedMentorPhotoIndex] = useState(0);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
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
  const {
    settings: bannerSettings
  } = useBannerSettings(userId ?? undefined);
  // Get template ID from bannerData (passed from rank selection) or fetch by rank_id
  const {
    data: templateData
  } = useQuery({
    queryKey: ['template-by-rank', bannerData?.rankId],
    queryFn: async () => {
      if (bannerData?.templateId) {
        return {
          id: bannerData.templateId
        };
      }
      if (bannerData?.rankId) {
        const {
          data,
          error
        } = await supabase.from('templates').select('id').eq('rank_id', bannerData.rankId).single();
        if (error) throw error;
        return data;
      }
      return null;
    },
    enabled: !!(bannerData?.templateId || bannerData?.rankId)
  });

  // Fetch backgrounds for the current template - ONLY for this template_id
  const currentTemplateId = bannerData?.templateId || templateData?.id;
  const {
    backgrounds
  } = useTemplateBackgrounds(currentTemplateId);

  // Map selectedTemplate (0-15) to slot_number (1-16) and fetch correct background
  // CRITICAL: Only show background if it exists for this exact slot - NO fallbacks
  const selectedSlot = selectedTemplate + 1;
  const backgroundImage = backgrounds.find(bg => bg.slot_number === selectedSlot)?.background_image_url || null;

  // Use profile data, fallback to banner data
  const displayName: string = profile?.name || bannerData?.name || "";
  const displayContact: string = profile?.mobile || profile?.whatsapp || "9876543210";
  const displayRank: string = profile?.rank || "ROYAL AMBASSADOR";

  // Get primary profile photo - prioritize uploaded photo from banner creation for LEFT side
  const primaryPhoto: string | null = bannerData?.photo || profile?.profile_photo || profilePhotos[0]?.photo_url || null;

  // Get mentor/upline photo (RIGHT-BOTTOM) - ONLY use profile photos, never uploads
  const mentorPhoto: string | null = profilePhotos[selectedMentorPhotoIndex]?.photo_url || profilePhotos[0]?.photo_url || profile?.profile_photo || null;
  const mentorName: string = displayName; // Always use user's profile name

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
  const templateColors = [{
    id: 0,
    name: "Green Black",
    bgColor: "from-black via-gray-900 to-black",
    border: "border-green-500"
  }, {
    id: 1,
    name: "Purple Pink",
    bgColor: "from-purple-900 via-pink-900 to-purple-800",
    border: "border-pink-500"
  }, {
    id: 2,
    name: "Blue Indigo",
    bgColor: "from-blue-900 via-indigo-900 to-blue-800",
    border: "border-blue-500"
  }, {
    id: 3,
    name: "Red Orange",
    bgColor: "from-red-900 via-orange-900 to-red-800",
    border: "border-orange-500"
  }, {
    id: 4,
    name: "Emerald Teal",
    bgColor: "from-emerald-900 via-teal-900 to-emerald-800",
    border: "border-teal-500"
  }, {
    id: 5,
    name: "Pink Purple",
    bgColor: "from-pink-900 via-purple-900 to-pink-800",
    border: "border-purple-500"
  }, {
    id: 6,
    name: "Cyan Blue",
    bgColor: "from-cyan-900 via-blue-900 to-cyan-800",
    border: "border-cyan-500"
  }, {
    id: 7,
    name: "Yellow Orange",
    bgColor: "from-yellow-900 via-orange-900 to-yellow-800",
    border: "border-yellow-500"
  }, {
    id: 8,
    name: "Indigo Purple",
    bgColor: "from-indigo-900 via-purple-900 to-indigo-800",
    border: "border-indigo-500"
  }, {
    id: 9,
    name: "Rose Red",
    bgColor: "from-rose-900 via-red-900 to-rose-800",
    border: "border-rose-500"
  }, {
    id: 10,
    name: "Violet Purple",
    bgColor: "from-violet-900 via-purple-900 to-violet-800",
    border: "border-violet-500"
  }, {
    id: 11,
    name: "Lime Green",
    bgColor: "from-lime-900 via-green-900 to-lime-800",
    border: "border-lime-500"
  }, {
    id: 12,
    name: "Amber Orange",
    bgColor: "from-amber-900 via-orange-900 to-amber-800",
    border: "border-amber-500"
  }, {
    id: 13,
    name: "Sky Blue",
    bgColor: "from-sky-900 via-blue-900 to-sky-800",
    border: "border-sky-500"
  }, {
    id: 14,
    name: "Fuchsia Pink",
    bgColor: "from-fuchsia-900 via-pink-900 to-fuchsia-800",
    border: "border-fuchsia-500"
  }, {
    id: 15,
    name: "Slate Gray",
    bgColor: "from-slate-900 via-gray-900 to-slate-800",
    border: "border-slate-500"
  }];
  const handleDownload = async () => {
    if (!bannerRef.current) {
      toast.error("Banner not ready for download");
      return;
    }
    setIsDownloading(true);
    const loadingToast = toast.loading("Generating high-quality banner...");
    try {
      // Capture the banner at 1080x1080 resolution with transparent background
      const canvas = await html2canvas(bannerRef.current, {
        scale: 3,
        // Higher scale for better quality
        backgroundColor: null,
        // Transparent background
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 1080,
        height: 1080,
        imageTimeout: 0
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
    <div className="h-screen overflow-hidden bg-[#0B0E15] flex flex-col">
      {/* Header - Fixed */}
      <header className="bg-[#0B0E15]/95 backdrop-blur-sm z-40 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <h1 className="text-2xl font-bold text-white tracking-widest">BANNER PREVIEW</h1>
          
          <button className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Banner Preview and Download - Fixed */}
      <div className="px-4 py-4 flex-shrink-0">
        {/* Main Banner Preview - Gold outer border, Green inner border */}
        <div className="relative w-full max-w-[600px] mx-auto">
          <div className="border-4 border-[#FFD700] rounded-lg overflow-hidden">
            <div ref={bannerRef} className={`border-4 ${templateColors[selectedTemplate].border} relative w-full bg-gradient-to-br ${templateColors[selectedTemplate].bgColor}`} style={{
            paddingBottom: '100%'
          }}>
              <div className="absolute inset-0">
                {/* Background Image (if uploaded) or Gradient Background */}
                {backgroundImage ? <img src={backgroundImage} alt="Template background" className="absolute inset-0 w-full h-full object-cover" /> : null}

                {/* Top-Left Logo */}
                {bannerSettings?.logo_left && <div className="absolute z-30" style={{
                top: '3%',
                left: '3%',
                width: '15%',
                height: '8%'
              }}>
                    <img src={bannerSettings.logo_left} alt="Left Logo" className="w-full h-full object-contain drop-shadow-lg" />
                  </div>}

                {/* Top-Right Logo */}
                {bannerSettings?.logo_right && <div className="absolute z-30" style={{
                top: '3%',
                right: '3%',
                width: '15%',
                height: '8%'
              }}>
                    <img src={bannerSettings.logo_right} alt="Right Logo" className="w-full h-full object-contain drop-shadow-lg" />
                  </div>}

                {/* Top - Small circular upline avatars (70% scale = smaller) */}
                <div className="absolute top-[3%] left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {bannerData.uplines?.slice(0, 5).map((upline, idx) => <div key={upline.id} className="w-7 h-7 rounded-full border-2 border-white overflow-hidden shadow-lg">
                      <img src={upline.avatar || primaryPhoto || "/placeholder.svg"} alt={upline.name} className="w-full h-full object-cover" />
                    </div>)}
                </div>

                {/* LEFT - Main User Photo (85% height, rounded, bottom fade, flippable) */}
                {primaryPhoto && <div className="absolute overflow-hidden rounded-2xl cursor-pointer transition-transform duration-500 ease-in-out" onClick={() => setIsPhotoFlipped(!isPhotoFlipped)} style={{
                left: '3%',
                top: '12%',
                width: '40%',
                height: '63.75%',
                transform: isPhotoFlipped ? 'scaleX(-1)' : 'scaleX(1)'
              }}>
                    <img src={primaryPhoto} alt={bannerData.name} className="w-full h-full object-cover object-top" />
                    {/* Bottom feather fade overlay */}
                    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
                  height: '30%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)'
                }} />
                  </div>}

                {/* Golden Crown below user photo */}
                <div className="absolute" style={{
                left: '13%',
                bottom: '20%',
                width: '20%',
                height: '8%'
              }}>
                  
                </div>

                {/* CENTER-RIGHT - Name and Team with auto font scaling */}
                <div className="absolute px-2" style={{
                top: '25%',
                right: '5%',
                width: '50%',
                textAlign: 'center'
              }}>
                  <h2 style={{
                  fontSize: bannerData.name.length > 30 ? 'clamp(14px, 2.5vw, 28px)' : bannerData.name.length > 25 ? 'clamp(16px, 3vw, 32px)' : bannerData.name.length > 20 ? 'clamp(18px, 3.5vw, 36px)' : bannerData.name.length > 15 ? 'clamp(22px, 4vw, 44px)' : 'clamp(24px, 5vw, 56px)',
                  textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
                  lineHeight: '1',
                  transform: bannerData.name.length > 30 ? 'scaleX(0.75)' : bannerData.name.length > 25 ? 'scaleX(0.85)' : bannerData.name.length > 20 ? 'scaleX(0.9)' : 'none',
                  whiteSpace: 'nowrap'
                }} className="text-white tracking-wider mx-0 my-0 px-0 py-0 text-xs font-extrabold text-center">
                    {bannerData.name.toUpperCase()}
                  </h2>
                  
                  {bannerData.teamCity && <p style={{
                  fontSize: 'clamp(12px, 2.5vw, 28px)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }} className="text-white tracking-widest mt-2 text-xs font-thin font-sans text-center mx-[15px] my-0">
                      {bannerData.teamCity.toUpperCase()}
                    </p>}
                </div>
                {/* BOTTOM CENTER - Income */}
                {bannerData.chequeAmount && <div className="absolute text-center" style={{
                bottom: '15%',
                left: '5%',
                width: '55%'
              }}>
                    <p style={{
                  fontSize: 'clamp(8px, 1.5vw, 14px)',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }} className="text-white font-light tracking-widest text-left text-xs">
                      THIS WEEK INCOME 
                    </p>
                    <p style={{
                  fontSize: 'clamp(32px, 7vw, 72px)',
                  textShadow: '4px 4px 8px rgba(0,0,0,0.9)',
                  lineHeight: '1'
                }} className="font-black tracking-tight text-left text-2xl mx-0 my-0 text-yellow-500 font-serif">
                      {Number(bannerData.chequeAmount).toLocaleString('en-IN')}
                    </p>
                  </div>}

                {/* LOWER THIRD - User Name and Phone */}
                <div className="absolute" style={{
                bottom: '3%',
                left: '5%'
              }}>
                  
                  <p className="text-white font-bold tracking-wide" style={{
                  fontSize: 'clamp(10px, 2vw, 20px)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }}>
                    +91 {displayContact}
                  </p>
                </div>

                {/* BOTTOM RIGHT - Mentor Photo with rounded corners and feather fade (non-interactive) */}
                {mentorPhoto && <div className="absolute overflow-hidden shadow-2xl rounded-xl transition-transform duration-500 ease-in-out" style={{
                bottom: '8%',
                right: '5%',
                width: '30%',
                height: '35%',
                transform: isMentorPhotoFlipped ? 'scaleX(-1)' : 'scaleX(1)'
              }}>
                    <img src={mentorPhoto} alt={mentorName} className="w-full h-full object-cover object-top" />
                    {/* Bottom feather fade overlay */}
                    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
                  height: '30%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)'
                }} />
                  </div>}


                {/* BOTTOM RIGHT - Mentor Name and Title (Moved to bottom-most position) */}
                <div className="absolute text-right" style={{
                bottom: '3%',
                right: '5%',
                width: '40%'
              }}>
                  <p className="text-white font-bold tracking-wide" style={{
                  fontSize: mentorName.length > 25 ? 'clamp(8px, 1.5vw, 16px)' : mentorName.length > 20 ? 'clamp(9px, 1.75vw, 18px)' : mentorName.length > 15 ? 'clamp(10px, 1.85vw, 19px)' : 'clamp(10px, 2vw, 20px)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  whiteSpace: 'nowrap',
                  transform: mentorName.length > 25 ? 'scaleX(0.8)' : mentorName.length > 20 ? 'scaleX(0.85)' : mentorName.length > 15 ? 'scaleX(0.9)' : 'none'
                }}>
                    {mentorName.toUpperCase()}
                  </p>
                  <p className="text-[#FFD700] font-semibold tracking-wider mt-1" style={{
                  fontSize: 'clamp(8px, 1.5vw, 14px)',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>
                    {displayRank}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Profile Avatars (Left) + Download Button (Right) */}
        <div className="flex items-center justify-between px-4 mt-4">
          {/* Left: Profile Images Row - Clickable to change main photo */}
          <div className="flex gap-3 overflow-x-auto">
            {profilePhotos.slice(0, 6).map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setSelectedMentorPhotoIndex(idx)}
                className={`h-10 w-10 rounded-full border-2 object-cover flex-shrink-0 shadow-lg transition-all hover:scale-105 ${
                  selectedMentorPhotoIndex === idx ? 'border-[#FFD700] ring-2 ring-[#FFD700] ring-offset-2 ring-offset-[#0B0E15]' : 'border-gray-500 hover:border-[#FFD700]'
                }`}
              >
                <img
                  src={photo.photo_url}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              </button>
            ))}
            {profilePhotos.length > 6 && (
              <div className="h-10 w-10 rounded-full border-2 border-[#FFD700] bg-[#111827] flex items-center justify-center text-[#FFD700] text-xs font-bold flex-shrink-0">
                +{profilePhotos.length - 6}
              </div>
            )}
          </div>

          {/* Right: Download Button */}
          <button 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ml-4 flex-shrink-0"
          >
            <img 
              src={downloadIcon} 
              alt="Download" 
              className="h-16 w-auto"
            />
          </button>
        </div>
      </div>

      {/* Scrollable Slot Selector Box */}
      {backgrounds.length > 0 && (
        <div className="flex-1 overflow-hidden px-4 pb-4">
          <div className="h-full overflow-y-auto rounded-3xl bg-[#111827]/50 border-2 border-[#FFD700]/20 p-4 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 16 }, (_, i) => i + 1).map(slotNum => {
                const bg = backgrounds.find(b => b.slot_number === slotNum);
                const isSelected = selectedTemplate === slotNum - 1;
                return (
                  <button 
                    key={slotNum} 
                    onClick={() => setSelectedTemplate(slotNum - 1)} 
                    className={`aspect-square rounded-lg overflow-hidden transition-all ${
                      isSelected 
                        ? 'border-4 border-[#FFD700] scale-105 shadow-[0_0_20px_rgba(255,215,0,0.5)]' 
                        : 'border-2 border-gray-600 hover:border-[#FFD700] hover:scale-105'
                    }`}
                  >
                    {bg?.background_image_url ? (
                      <img src={bg.background_image_url} alt={`Slot ${slotNum}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${templateColors[slotNum - 1]?.bgColor || 'from-gray-800 to-gray-900'} flex items-center justify-center`}>
                         <span className="text-white text-xs font-bold">{slotNum}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}