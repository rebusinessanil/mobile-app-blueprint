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
import { useBannerDefaults } from "@/hooks/useBannerDefaults";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Sticker } from "@/hooks/useStickers";
import html2canvas from "html2canvas";
import { useRealtimeStickerSync } from "@/hooks/useRealtimeStickerSync";
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
  slotStickers?: Record<number, string[]>;
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
  const [currentEditingSlot, setCurrentEditingSlot] = useState(1);
  const [slotStickers, setSlotStickers] = useState<Record<number, string[]>>(bannerData?.slotStickers || {});
  const [stickerImages, setStickerImages] = useState<Record<number, {
    id: string;
    url: string;
    position_x?: number;
    position_y?: number;
    scale?: number;
    rotation?: number;
  }[]>>({});
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Get authenticated user and check admin status
  useEffect(() => {
    supabase.auth.getSession().then(async ({
      data: {
        session
      }
    }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        const {
          data: adminCheck
        } = await supabase.rpc('is_admin', {
          user_id: uid
        });
        setIsAdmin(adminCheck ?? false);
      }
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
  const {
    defaults: bannerDefaults
  } = useBannerDefaults();
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

  // Real-time sync for sticker updates from admin panel
  useRealtimeStickerSync({
    categoryId: bannerData?.templateId || currentTemplateId,
    rankId: bannerData?.rankId,
    onUpdate: () => {
      // Refetch sticker images when admin updates stickers
      console.log('Sticker update detected, refetching images...');
      fetchStickerImages();
    }
  });

  // Fetch sticker images for each slot independently
  const fetchStickerImages = async () => {
    // If no slotStickers or rankId, fetch all stickers for this rank
    if (bannerData?.rankId && (!slotStickers || Object.keys(slotStickers).length === 0)) {
      const {
        data,
        error
      } = await supabase.from('stickers').select('id, image_url, position_x, position_y, scale, rotation, slot_number').eq('rank_id', bannerData.rankId).eq('is_active', true);
      if (!error && data) {
        const newStickerImages: Record<number, {
          id: string;
          url: string;
          position_x?: number;
          position_y?: number;
          scale?: number;
          rotation?: number;
        }[]> = {};
        data.forEach(s => {
          if (s.slot_number) {
            if (!newStickerImages[s.slot_number]) {
              newStickerImages[s.slot_number] = [];
            }
            newStickerImages[s.slot_number].push({
              id: s.id,
              url: s.image_url,
              position_x: s.position_x ?? 50,
              position_y: s.position_y ?? 50,
              scale: s.scale ?? 1.0,
              rotation: s.rotation ?? 0
            });
          }
        });
        setStickerImages(newStickerImages);
        return;
      }
    }

    // Otherwise use slotStickers structure
    const newStickerImages: Record<number, {
      id: string;
      url: string;
      position_x?: number;
      position_y?: number;
      scale?: number;
      rotation?: number;
    }[]> = {};
    for (const [slotNum, stickerIds] of Object.entries(slotStickers)) {
      if (stickerIds.length === 0) continue;
      const {
        data,
        error
      } = await supabase.from('stickers').select('id, image_url, position_x, position_y, scale, rotation').in('id', stickerIds);
      if (!error && data) {
        newStickerImages[parseInt(slotNum)] = data.map(s => ({
          id: s.id,
          url: s.image_url,
          position_x: s.position_x ?? 50,
          position_y: s.position_y ?? 50,
          scale: s.scale ?? 1.0,
          rotation: s.rotation ?? 0
        }));
      }
    }
    setStickerImages(newStickerImages);
  };
  useEffect(() => {
    fetchStickerImages();
  }, [slotStickers, bannerData?.rankId]);

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

  // Fetch selected stickers - removed, now using slotStickers structure
  // Each slot has its own stickers independently

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
    const canvas = document.getElementById("banner-canvas") as HTMLElement;
    if (!canvas) {
      toast.error("Banner not ready for download");
      return;
    }
    setIsDownloading(true);
    const loadingToast = toast.loading("Generating Full HD banner...");
    try {
      // Capture ONLY the #banner-canvas at exact 1350x1350 with scale:3
      const htmlCanvas = await html2canvas(canvas, {
        width: 1350,
        height: 1350,
        scale: 3,
        backgroundColor: "#000000",
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0
      });

      // Convert to PNG blob
      htmlCanvas.toBlob(blob => {
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
        toast.success("Banner downloaded! (1350×1350 Full HD PNG)");
      }, "image/png");
    } catch (error) {
      console.error("Download error:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to download banner. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };
  return <div className="h-screen overflow-hidden bg-background flex flex-col">
      {/* Header - Fixed */}
      <header className="bg-background/95 backdrop-blur-sm z-40 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-[600px] mx-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 border-foreground flex items-center justify-center hover:bg-foreground/10 transition-colors touch-target">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
          </button>
          
          <h1 className="text-base sm:text-xl md:text-2xl font-bold text-foreground tracking-widest">BANNER PREVIEW</h1>
          
          {isAdmin && <button onClick={() => setIsStickersOpen(true)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 border-primary bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors touch-target">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </button>}
          {!isAdmin && <div className="w-10 h-10 sm:w-12 sm:h-12" />}
        </div>
      </header>

      {/* Banner Preview Container - Centered and scaled to fit */}
      <div className="flex-1 overflow-hidden flex items-center justify-center bg-background p-2 sm:p-4">
        {/* Scaled wrapper - maintains aspect ratio and fits to screen */}
        <div 
          className="border-4 border-primary rounded-xl sm:rounded-2xl shadow-2xl banner-canvas-container"
          style={{
            width: 'min(100%, calc(100vh - 280px))',
            height: 'min(100%, calc(100vh - 280px))',
            aspectRatio: '1 / 1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* PURE STATIC CANVAS - 1350x1350 FIXED but CSS scaled to fit container */}
          <div 
            id="banner-canvas" 
            ref={bannerRef}
            className={`bg-gradient-to-br ${templateColors[selectedTemplate].bgColor}`}
            style={{
              position: 'relative',
              width: '1350px',
              height: '1350px',
              flexShrink: 0,
              overflow: 'hidden'
            }}
          >
              {/* Background Image (if uploaded) or Gradient Background */}
              {backgroundImage && (
                <img 
                  src={backgroundImage} 
                  alt="Template background" 
                  style={{
                    position: 'absolute',
                    top: '0px',
                    left: '0px',
                    width: '1350px',
                    height: '1350px',
                    objectFit: 'cover'
                  }} 
                />
              )}

              {/* Top-Left Logo */}
              {bannerSettings?.logo_left && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  left: '40px',
                  width: '200px',
                  height: '108px',
                  zIndex: 30
                }}>
                  <img 
                    src={bannerSettings.logo_left} 
                    alt="Left Logo" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))'
                    }} 
                  />
                </div>
              )}

              {/* Top-Right Logo */}
              {bannerSettings?.logo_right && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  right: '40px',
                  width: '200px',
                  height: '108px',
                  zIndex: 30
                }}>
                  <img 
                    src={bannerSettings.logo_right} 
                    alt="Right Logo" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))'
                    }} 
                  />
                </div>
              )}

              {/* Congratulations Image */}
              {bannerDefaults?.congratulations_image && (
                <div style={{
                  position: 'absolute',
                  top: '162px',
                  left: '978px',
                  transform: 'translateX(-50%)',
                  width: '648px',
                  height: '162px',
                  zIndex: 20
                }}>
                  <img 
                    src={bannerDefaults.congratulations_image} 
                    alt="Congratulations" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))'
                    }} 
                  />
                </div>
              )}

              {/* Text Below Congratulations */}
              <div style={{
                position: 'absolute',
                top: '236px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                zIndex: 20
              }}>
                <p style={{
                  fontSize: '15px',
                  lineHeight: '1.2',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  color: 'white',
                  fontWeight: '600',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  margin: '20px 8px'
                }}>
                  To Our Brand New Leader
                </p>
              </div>

              {/* Top - Upline avatars */}
              <div style={{
                position: 'absolute',
                top: '24px',
                left: '675px',
                transform: 'translateX(-50%) scale(1.1)',
                display: 'flex',
                gap: '8px',
                zIndex: 20
              }}>
                {bannerData.uplines?.slice(0, 5).map((upline, idx) => (
                  <div 
                    key={upline.id} 
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      border: '2px solid white',
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}
                  >
                    <img 
                      src={upline.avatar || primaryPhoto || "/placeholder.svg"} 
                      alt={upline.name} 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }} 
                    />
                  </div>
                ))}
              </div>

              {/* LEFT - Main User Photo */}
              {primaryPhoto && (
                <div 
                  onClick={() => setIsPhotoFlipped(!isPhotoFlipped)}
                  style={{
                    position: 'absolute',
                    left: '40px',
                    top: '162px',
                    width: '540px',
                    height: '860px',
                    overflow: 'hidden',
                    borderRadius: '24px',
                    cursor: 'pointer',
                    transform: isPhotoFlipped ? 'scaleX(-1)' : 'scaleX(1)',
                    transition: 'transform 0.5s ease-in-out'
                  }}
                >
                  <img 
                    src={primaryPhoto} 
                    alt={mainBannerName} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'top'
                    }} 
                  />
                  {/* Bottom feather fade */}
                  <div style={{
                    position: 'absolute',
                    bottom: '0px',
                    left: '0px',
                    right: '0px',
                    height: '258px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                    pointerEvents: 'none'
                  }} />
                </div>
              )}

              {/* CENTER-RIGHT - Name */}
              <div style={{
                position: 'absolute',
                top: '338px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                padding: '0 10px'
              }}>
                <h2 
                  title={mainBannerName.toUpperCase()}
                  style={{
                    fontSize: '15px',
                    lineHeight: '1.4',
                    letterSpacing: '0.1em',
                    fontWeight: '800',
                    textAlign: 'center',
                    color: 'white',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {truncatedMainName.toUpperCase()}
                </h2>
                
                {bannerData.teamCity && (
                  <p 
                    title={bannerData.teamCity.toUpperCase()}
                    style={{
                      fontSize: '12px',
                      lineHeight: '1.4',
                      letterSpacing: '0.15em',
                      fontWeight: '300',
                      textAlign: 'center',
                      color: 'white',
                      textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                      marginTop: '10px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {bannerData.teamCity.toUpperCase()}
                  </p>
                )}
              </div>

              {/* BOTTOM CENTER - Income */}
              {bannerData.chequeAmount && (
                <div style={{
                  position: 'absolute',
                  bottom: '202px',
                  left: '67px',
                  width: '742px',
                  textAlign: 'left'
                }}>
                  <p style={{
                    fontSize: '19px',
                    color: 'white',
                    fontWeight: '300',
                    letterSpacing: '0.15em',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}>
                    THIS WEEK INCOME
                  </p>
                  <p style={{
                    fontSize: '97px',
                    color: '#eab308',
                    fontWeight: '900',
                    letterSpacing: '-0.05em',
                    lineHeight: '1',
                    textShadow: '4px 4px 8px rgba(0,0,0,0.9)',
                    fontFamily: 'serif',
                    margin: '0'
                  }}>
                    {Number(bannerData.chequeAmount).toLocaleString('en-IN')}
                  </p>
                </div>
              )}

              {/* LOWER THIRD - Contact Info */}
              <div style={{
                position: 'absolute',
                bottom: '40px',
                left: '27px',
                maxWidth: '675px'
              }}>
                <p style={{
                  fontSize: '9px',
                  color: 'white',
                  fontWeight: '300',
                  letterSpacing: '0.05em',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  marginBottom: '2px',
                  textTransform: 'uppercase',
                  position: 'relative',
                  top: '14px'
                }}>
                  CALL FOR MENTORSHIP
                </p>
                <p 
                  title={`+91 ${displayContact}`}
                  style={{
                    fontSize: '24px',
                    color: 'white',
                    fontWeight: '700',
                    letterSpacing: '0.05em',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  +91 {displayContact}
                </p>
              </div>

              {/* BOTTOM RIGHT - Mentor Photo */}
              {mentorPhoto && (
                <div 
                  onClick={() => setIsMentorPhotoFlipped(!isMentorPhotoFlipped)}
                  style={{
                    position: 'absolute',
                    bottom: '0px',
                    right: '0px',
                    width: '445px',
                    height: '520px',
                    overflow: 'hidden',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    transform: isMentorPhotoFlipped ? 'scaleX(-1)' : 'scaleX(1)',
                    transition: 'transform 0.5s ease-in-out'
                  }}
                >
                  <img 
                    src={mentorPhoto} 
                    alt={profileName} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'top'
                    }} 
                  />
                  {/* Bottom feather fade */}
                  <div style={{
                    position: 'absolute',
                    bottom: '0px',
                    left: '0px',
                    right: '0px',
                    height: '156px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                    pointerEvents: 'none'
                  }} />
                </div>
              )}

              {/* BOTTOM CENTER - Profile Name & Rank */}
              <div style={{
                position: 'absolute',
                bottom: '40px',
                left: '675px',
                transform: 'translateX(-45%)',
                width: 'max-content',
                maxWidth: '1080px',
                textAlign: 'center',
                zIndex: 3
              }}>
                <p 
                  title={profileName}
                  style={{
                    fontSize: '12px',
                    color: 'white',
                    fontWeight: '800',
                    letterSpacing: '0.1em',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '2px',
                    position: 'relative',
                    top: '20px'
                  }}
                >
                  {truncatedProfileName.toUpperCase()}
                </p>
                <p style={{
                  fontSize: '9px',
                  color: '#eab308',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                  textTransform: 'uppercase'
                }}>
                  {displayRank}
                </p>
              </div>

              {/* Achievement Stickers - Only for current slot */}
              {stickerImages[selectedTemplate + 1]?.map((sticker) => {
                const leftPx = ((sticker.position_x ?? 50) / 100) * 1350;
                const topPx = ((sticker.position_y ?? 50) / 100) * 1350;
                
                return (
                  <img 
                    key={sticker.id} 
                    src={sticker.url} 
                    alt="Achievement Sticker"
                    style={{
                      position: 'absolute',
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      transform: `translate(-50%, -50%) scale(${sticker.scale ?? 1}) rotate(${sticker.rotation ?? 0}deg)`,
                      transformOrigin: 'center center',
                      width: '162px',
                      height: '162px',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
                      zIndex: 10,
                      pointerEvents: 'none'
                    }} 
                  />
                );
              })}
          </div>
        </div>
      </div>

      {/* Controls Section - Fixed at bottom */}
      <div className="flex-shrink-0 bg-background border-t border-border">
        {/* Profile Avatars (Left) + Download Button (Right) */}
        <div className="flex items-center justify-between px-4 py-3 gap-2">
          {/* Left: Profile Images Row */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {profilePhotos.slice(0, 6).map((photo, idx) => (
              <button 
                key={photo.id} 
                onClick={() => {
                  setSelectedMentorPhotoIndex(idx);
                  setIsMentorPhotoFlipped(!isMentorPhotoFlipped);
                }} 
                className={`h-10 w-10 rounded-full border-2 flex-shrink-0 shadow-lg transition-all hover:scale-105 active:scale-95 ${
                  selectedMentorPhotoIndex === idx 
                    ? 'border-[#FFD700] ring-2 ring-[#FFD700]' 
                    : 'border-gray-500 hover:border-[#FFD700]'
                }`}
              >
                <img src={photo.photo_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
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
            className="cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <img src={downloadIcon} alt="Download" className="h-16 w-auto" />
          </button>
        </div>

        {/* Scrollable Slot Selector */}
        {backgrounds.length > 0 && (
          <div className="px-4 pb-4">
            <div className="rounded-2xl bg-[#111827]/50 border-2 border-[#FFD700]/20 p-4">
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

      {/* Ranks & Stickers Panel - Admin Only */}
      {isAdmin && <RanksStickersPanel isOpen={isStickersOpen} onClose={() => setIsStickersOpen(false)} currentSlot={selectedTemplate + 1} rankName={bannerData?.rankName || ''} selectedStickers={slotStickers[selectedTemplate + 1] || []} onStickersChange={stickers => {
      setSlotStickers(prev => ({
        ...prev,
        [selectedTemplate + 1]: stickers
      }));
    }} />}
    </div>;
}