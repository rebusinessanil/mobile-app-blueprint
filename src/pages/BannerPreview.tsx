import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import RanksStickersPanel from "@/components/RanksStickersPanel";
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
  const [isStickersOpen, setIsStickersOpen] = useState(false);
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [stickerImages, setStickerImages] = useState<{id: string, url: string}[]>([]);
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

  // Fetch sticker images when selectedStickers change
  useEffect(() => {
    const fetchStickerImages = async () => {
      if (selectedStickers.length === 0) {
        setStickerImages([]);
        return;
      }

      const { data, error } = await supabase
        .from('stickers')
        .select('id, image_url')
        .in('id', selectedStickers);

      if (!error && data) {
        setStickerImages(data.map(s => ({ id: s.id, url: s.image_url })));
      }
    };

    fetchStickerImages();
  }, [selectedStickers]);

  // Map selectedTemplate (0-15) to slot_number (1-16) and fetch correct background
  // CRITICAL: Only show background if it exists for this exact slot - NO fallbacks
  const selectedSlot = selectedTemplate + 1;
  const backgroundImage = backgrounds.find(bg => bg.slot_number === selectedSlot)?.background_image_url || null;

  // Main banner name - ALWAYS from user input in form (bannerData.name)
  const mainBannerName: string = bannerData?.name || "";
  const MAX_NAME_LENGTH = 20;
  const truncatedMainName = mainBannerName.length > MAX_NAME_LENGTH ? mainBannerName.slice(0, MAX_NAME_LENGTH) + "..." : mainBannerName;

  // Bottom profile name - ALWAYS from user profile (never changes)
  const profileName: string = profile?.name || "";
  const truncatedProfileName = profileName.length > MAX_NAME_LENGTH ? profileName.slice(0, MAX_NAME_LENGTH) + "..." : profileName;
  const displayContact: string = profile?.mobile || profile?.whatsapp || "9876543210";
  const displayRank: string = (profile?.rank || "ROYAL AMBASSADOR").replace(/[-–—]/g, ' ');

  // Get primary profile photo - prioritize uploaded photo from banner creation for LEFT side
  const primaryPhoto: string | null = bannerData?.photo || profile?.profile_photo || profilePhotos[0]?.photo_url || null;

  // Get mentor/upline photo (RIGHT-BOTTOM) - ONLY use profile photos, never uploads
  const mentorPhoto: string | null = profilePhotos[selectedMentorPhotoIndex]?.photo_url || profilePhotos[0]?.photo_url || profile?.profile_photo || null;

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
    const loadingToast = toast.loading("Generating Full HD banner...");
    try {
      // Fixed dimensions for Full HD Square export (1080×1080)
      const TARGET_WIDTH = 1080;
      const TARGET_HEIGHT = 1080;
      const canvas = await html2canvas(bannerRef.current, {
        scale: 1,
        backgroundColor: "#000000",
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: TARGET_WIDTH,
        height: TARGET_HEIGHT,
        windowWidth: TARGET_WIDTH,
        windowHeight: TARGET_HEIGHT,
        x: 0,
        y: 0,
        imageTimeout: 0
      });

      // Ensure canvas matches exact target dimensions
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = TARGET_WIDTH;
      finalCanvas.height = TARGET_HEIGHT;
      const ctx = finalCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
      }

      // Convert to JPG blob with quality 0.95
      finalCanvas.toBlob(blob => {
        toast.dismiss(loadingToast);
        if (!blob) {
          toast.error("Failed to generate image");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const timestamp = new Date().getTime();
        link.download = `ReBusiness-Banner-${bannerData.rankName}-${timestamp}.jpg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Banner downloaded! (1080×1080 Full HD JPG)");
      }, "image/jpeg", 0.95);
    } catch (error) {
      console.error("Download error:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to download banner. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };
  return <div className="min-h-screen overflow-auto bg-background flex flex-col pb-safe">
      {/* Header - Fixed */}
      <header className="bg-background/95 backdrop-blur-sm z-40 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 sticky top-0">
        <div className="flex items-center justify-between max-w-[600px] mx-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 border-foreground flex items-center justify-center hover:bg-foreground/10 transition-colors touch-target">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
          </button>
          
          <h1 className="text-base sm:text-xl md:text-2xl font-bold text-foreground tracking-widest">BANNER PREVIEW</h1>
          
          <button 
            onClick={() => setIsStickersOpen(true)}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 border-primary bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors touch-target"
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
        </div>
      </header>

      {/* Banner Preview Container - Responsive */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0">
        {/* Main Banner Preview Wrapper with aspect ratio */}
        <div className="preview-banner-wrapper relative w-full max-w-[100vw] sm:max-w-[520px] mx-auto">
          <div className="border-4 border-primary rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
          <div ref={bannerRef} className={`preview-banner border-4 ${templateColors[selectedTemplate].border} relative w-full bg-gradient-to-br ${templateColors[selectedTemplate].bgColor}`} style={{
            aspectRatio: '1 / 1',
            width: '100%',
            height: 'auto'
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
                <div className="absolute top-[1.8%] left-1/2 -translate-x-1/2 flex gap-1.5 z-20" style={{
                transform: 'translateX(-50%) scale(1.1)'
              }}>
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
                    <img src={primaryPhoto} alt={mainBannerName} className="w-full h-full object-cover object-top" />
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

                {/* CENTER-RIGHT - Name with responsive typography */}
                <div className="banner-text-content absolute px-2" style={{
                top: '25%',
                right: '5%',
                width: '50%',
                maxWidth: '50%'
              }}>
                  <h2 title={mainBannerName.toUpperCase()} className="banner-preview-name text-foreground tracking-wider font-extrabold text-center mx-auto">
                    {truncatedMainName.toUpperCase()}
                  </h2>
                  
                  {bannerData.teamCity && <p title={bannerData.teamCity.toUpperCase()} className="banner-team text-foreground tracking-widest mt-1 sm:mt-2 font-light font-sans text-center">
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

                {/* LOWER THIRD - Contact Info */}
                <div className="banner-contact absolute" style={{
                bottom: '3%',
                left: '2%',
                maxWidth: '50%'
              }}>
                  <p className="text-foreground font-light tracking-wide" style={{
                  fontSize: 'clamp(5.6px, 0.94vw, 6.72px)',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  marginBottom: '0.5px',
                  textTransform: 'uppercase',
                  position: 'relative',
                  top: '10%'
                }}>
                    CALL FOR MENTORSHIP                                                                 
                  </p>
                  <p title={`+91 ${displayContact}`} className="text-foreground font-bold tracking-wide" style={{
                  fontSize: 'clamp(11.2px, 2.24vw, 22.4px)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                    +91 {displayContact}
                  </p>
                </div>

                {/* BOTTOM RIGHT - Mentor Photo with rounded corners and feather fade (tap to flip) */}
                {mentorPhoto && <div className="absolute overflow-hidden shadow-2xl rounded-xl cursor-pointer transition-transform duration-500 ease-in-out" onClick={() => setIsMentorPhotoFlipped(!isMentorPhotoFlipped)} style={{
                bottom: 0,
                right: 0,
                width: '33%',
                height: '38.5%',
                transform: isMentorPhotoFlipped ? 'scaleX(-1)' : 'scaleX(1)'
              }}>
                    <img src={mentorPhoto} alt={profileName} className="w-full h-full object-cover object-top" />
                    {/* Bottom feather fade overlay */}
                    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
                  height: '30%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)'
                }} />
                  </div>}


                {/* BOTTOM CENTER - Profile Name & Rank */}
                <div className="absolute text-center" style={{
                bottom: '3%',
                left: '50%',
                transform: 'translateX(-45%)',
                width: 'max-content',
                maxWidth: '80%',
                zIndex: 3
              }}>
                  <p title={profileName} className="banner-profile-name text-foreground font-extrabold tracking-wider" style={{
                  fontSize: '9px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: '1px',
                  position: 'relative',
                  top: '15%'
                }}>
                    {truncatedProfileName.toUpperCase()}
                  </p>
                  <p className="banner-profile-rank text-yellow-500 font-semibold tracking-widest" style={{
                  fontSize: '7px',
                  textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                  textTransform: 'uppercase'
                }}>
                    {displayRank}
                  </p>
                </div>

                {/* Achievement Stickers - Positioned around banner */}
                {stickerImages.map((sticker, index) => {
                  const positions = [
                    { top: '8%', right: '8%', size: '12%' },
                    { top: '8%', left: '8%', size: '12%' },
                    { top: '35%', right: '5%', size: '10%' },
                    { top: '35%', left: '5%', size: '10%' },
                    { bottom: '42%', right: '8%', size: '11%' },
                    { bottom: '42%', left: '8%', size: '11%' },
                  ];
                  const pos = positions[index] || positions[0];
                  
                  return (
                    <img
                      key={sticker.id}
                      src={sticker.url}
                      alt="Achievement Sticker"
                      className="absolute pointer-events-none animate-in fade-in zoom-in duration-300"
                      style={{
                        ...pos,
                        width: pos.size,
                        height: 'auto',
                        aspectRatio: '1',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
                        zIndex: 10,
                      }}
                    />
                  );
                })}

                {/* BOTTOM RIGHT - Mentor Name and Title (Moved to bottom-most position) */}
                

              </div>
            </div>
          </div>
        </div>

        {/* Profile Avatars (Left) + Download Button (Right) */}
        <div className="flex items-center justify-between px-2 sm:px-4 mt-3 sm:mt-4 gap-2">
          {/* Left: Profile Images Row - Clickable to change main photo */}
          <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
            {profilePhotos.slice(0, 6).map((photo, idx) => <button key={photo.id} onClick={() => {
            setSelectedMentorPhotoIndex(idx);
            setIsMentorPhotoFlipped(!isMentorPhotoFlipped);
          }} className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 object-cover flex-shrink-0 shadow-lg transition-all hover:scale-105 active:scale-95 ${selectedMentorPhotoIndex === idx ? 'border-[#FFD700] ring-2 ring-[#FFD700] ring-offset-2 ring-offset-[#0B0E15]' : 'border-gray-500 hover:border-[#FFD700]'}`}>
                <img src={photo.photo_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
              </button>)}
            {profilePhotos.length > 6 && <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-[#FFD700] bg-[#111827] flex items-center justify-center text-[#FFD700] text-[10px] sm:text-xs font-bold flex-shrink-0">
                +{profilePhotos.length - 6}
              </div>}
          </div>

          {/* Right: Download Button */}
          <button onClick={handleDownload} disabled={isDownloading} className="cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
            <img src={downloadIcon} alt="Download" className="h-12 w-auto sm:h-16" />
          </button>
        </div>
      </div>

      {/* Scrollable Slot Selector Box */}
      {backgrounds.length > 0 && <div className="flex-1 overflow-hidden px-3 sm:px-4 pb-3 sm:pb-4 mb-16 sm:mb-0">
          <div className="h-full overflow-y-auto rounded-2xl sm:rounded-3xl bg-[#111827]/50 border-2 border-[#FFD700]/20 p-3 sm:p-4 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {Array.from({
            length: 16
          }, (_, i) => i + 1).map(slotNum => {
            const bg = backgrounds.find(b => b.slot_number === slotNum);
            const isSelected = selectedTemplate === slotNum - 1;
            return <button key={slotNum} onClick={() => setSelectedTemplate(slotNum - 1)} className={`aspect-square rounded-lg overflow-hidden transition-all ${isSelected ? 'border-4 border-[#FFD700] scale-105 shadow-[0_0_20px_rgba(255,215,0,0.5)]' : 'border-2 border-gray-600 hover:border-[#FFD700] hover:scale-105'}`}>
                    {bg?.background_image_url ? <img src={bg.background_image_url} alt={`Slot ${slotNum}`} className="w-full h-full object-cover" /> : <div className={`w-full h-full bg-gradient-to-br ${templateColors[slotNum - 1]?.bgColor || 'from-gray-800 to-gray-900'} flex items-center justify-center`}>
                         <span className="text-white text-xs font-bold">{slotNum}</span>
                      </div>}
                  </button>;
          })}
            </div>
          </div>
        </div>}

      {/* Ranks & Stickers Panel */}
      <RanksStickersPanel
        isOpen={isStickersOpen}
        onClose={() => setIsStickersOpen(false)}
        currentSlot={selectedTemplate + 1}
        rankName={bannerData?.rankName || ''}
        selectedStickers={selectedStickers}
        onStickersChange={setSelectedStickers}
      />
    </div>;
}