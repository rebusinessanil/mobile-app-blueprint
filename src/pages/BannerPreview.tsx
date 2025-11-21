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
    const bannerCanvas = document.getElementById('banner-canvas');
    if (!bannerCanvas) {
      toast.error("Banner not ready for download");
      return;
    }
    setIsDownloading(true);
    const loadingToast = toast.loading("Generating Full HD banner...");
    try {
      // Capture ONLY the #banner-canvas at exact dimensions
      const canvas = await html2canvas(bannerCanvas as HTMLElement, {
        width: 1080,
        height: 1350,
        scale: 3,
        backgroundColor: "#000000",
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0
      });

      // Convert to PNG blob
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
        toast.success("Banner downloaded! (1080×1350 Full HD PNG)");
      }, "image/png");
    } catch (error) {
      console.error("Download error:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to download banner. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'auto',
      backgroundColor: '#0B0E15',
      position: 'relative'
    }}>
      {/* Header - Fixed */}
      <header style={{
        position: 'sticky',
        top: '0px',
        left: '0px',
        width: '100%',
        backgroundColor: 'rgba(11, 14, 21, 0.95)',
        backdropFilter: 'blur(8px)',
        zIndex: 40,
        padding: '16px 24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            <ArrowLeft style={{ width: '24px', height: '24px', color: 'white' }} />
          </button>
          
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            letterSpacing: '0.1em',
            margin: 0
          }}>
            BANNER PREVIEW
          </h1>
          
          {isAdmin && (
            <button 
              onClick={() => setIsStickersOpen(true)} 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                border: '2px solid #FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <Sparkles style={{ width: '24px', height: '24px', color: '#FFD700' }} />
            </button>
          )}
          {!isAdmin && <div style={{ width: '48px', height: '48px' }} />}
        </div>
      </header>

      {/* FIXED-SIZE STATIC CANVAS - 1080x1350px */}
      <div 
        id="banner-canvas"
        ref={bannerRef}
        className={`bg-gradient-to-br ${templateColors[selectedTemplate].bgColor}`}
        style={{
          position: 'relative',
          width: '1080px',
          height: '1350px',
          overflow: 'hidden',
          margin: '20px auto'
        }}
      >
        {/* Background Image */}
        {backgroundImage && (
          <img 
            src={backgroundImage} 
            alt="Template background" 
            style={{
              position: 'absolute',
              top: '0px',
              left: '0px',
              width: '1080px',
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
            left: '32px',
            width: '162px',
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
            right: '32px',
            width: '162px',
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
            left: '783px',
            transform: 'translateX(-50%)',
            width: '518px',
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
          left: '783px',
          transform: 'translateX(-50%)',
          width: '518px',
          zIndex: 20
        }}>
          <p style={{
            fontSize: '12px',
            lineHeight: '1.2',
            whiteSpace: 'nowrap',
            color: 'white',
            textAlign: 'center',
            fontWeight: '600',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            margin: '13px 6px'
          }}>
            To Our Brand New Leader
          </p>
        </div>

        {/* Top Upline Avatars */}
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%) scale(1.1)',
          display: 'flex',
          gap: '6px',
          zIndex: 20
        }}>
          {bannerData.uplines?.slice(0, 5).map((upline, idx) => (
            <div 
              key={upline.id}
              style={{
                width: '28px',
                height: '28px',
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
              left: '32px',
              top: '162px',
              width: '432px',
              height: '860px',
              overflow: 'hidden',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'transform 0.5s ease-in-out',
              transform: isPhotoFlipped ? 'scaleX(-1)' : 'scaleX(1)'
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
              height: '30%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
              pointerEvents: 'none'
            }} />
          </div>
        )}

        {/* CENTER-RIGHT - Name */}
        <div style={{
          position: 'absolute',
          top: '337px',
          left: '783px',
          transform: 'translateX(-50%)',
          width: '518px',
          padding: '0 8px'
        }}>
          <h2 
            title={mainBannerName.toUpperCase()}
            style={{
              fontSize: '14px',
              color: 'white',
              letterSpacing: '0.05em',
              fontWeight: '800',
              textAlign: 'center',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              margin: '0 auto'
            }}
          >
            {truncatedMainName.toUpperCase()}
          </h2>
          
          {bannerData.teamCity && (
            <p 
              title={bannerData.teamCity.toUpperCase()}
              style={{
                fontSize: '12px',
                color: 'white',
                letterSpacing: '0.1em',
                marginTop: '8px',
                fontWeight: '300',
                textAlign: 'center',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
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
            left: '54px',
            width: '594px',
            textAlign: 'left'
          }}>
            <p style={{
              fontSize: '14px',
              color: 'white',
              fontWeight: '300',
              letterSpacing: '0.1em',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>
              THIS WEEK INCOME
            </p>
            <p style={{
              fontSize: '72px',
              color: '#EAB308',
              fontWeight: '900',
              letterSpacing: '-0.02em',
              lineHeight: '1',
              textShadow: '4px 4px 8px rgba(0,0,0,0.9)',
              fontFamily: 'serif',
              margin: '0'
            }}>
              {Number(bannerData.chequeAmount).toLocaleString('en-IN')}
            </p>
          </div>
        )}

        {/* LOWER LEFT - Contact Info */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '22px',
          maxWidth: '540px'
        }}>
          <p style={{
            fontSize: '9px',
            color: 'white',
            fontWeight: '300',
            letterSpacing: '0.05em',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            marginBottom: '2px',
            textTransform: 'uppercase'
          }}>
            CALL FOR MENTORSHIP
          </p>
          <p 
            title={`+91 ${displayContact}`}
            style={{
              fontSize: '18px',
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
              width: '356px',
              height: '519px',
              overflow: 'hidden',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'transform 0.5s ease-in-out',
              transform: isMentorPhotoFlipped ? 'scaleX(-1)' : 'scaleX(1)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.4)'
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
              height: '30%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
              pointerEvents: 'none'
            }} />
          </div>
        )}

        {/* BOTTOM CENTER - Profile Name & Rank */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-45%)',
          textAlign: 'center',
          zIndex: 3
        }}>
          <p 
            title={profileName}
            style={{
              fontSize: '12px',
              color: 'white',
              fontWeight: '800',
              letterSpacing: '0.05em',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: '2px'
            }}
          >
            {truncatedProfileName.toUpperCase()}
          </p>
          <p style={{
            fontSize: '9px',
            color: '#EAB308',
            fontWeight: '600',
            letterSpacing: '0.1em',
            textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
            textTransform: 'uppercase'
          }}>
            {displayRank}
          </p>
        </div>

        {/* Achievement Stickers */}
        {stickerImages[selectedTemplate + 1]?.map((sticker) => (
          <img 
            key={sticker.id}
            src={sticker.url} 
            alt="Achievement Sticker"
            style={{
              position: 'absolute',
              left: `${(sticker.position_x ?? 50) * 10.8}px`,
              top: `${(sticker.position_y ?? 50) * 13.5}px`,
              transform: `translate(-50%, -50%) scale(${sticker.scale ?? 1}) rotate(${sticker.rotation ?? 0}deg)`,
              transformOrigin: 'center center',
              width: '120px',
              height: '120px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          />
        ))}
      </div>

      {/* Profile Avatars + Download Button - Below Canvas */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        marginTop: '32px',
        gap: '16px',
        width: '100%',
        maxWidth: '1400px',
        margin: '32px auto 0'
      }}>
        {/* Left: Profile Images Row */}
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto'
        }}>
          {profilePhotos.slice(0, 6).map((photo, idx) => (
            <button 
              key={photo.id}
              onClick={() => {
                setSelectedMentorPhotoIndex(idx);
                setIsMentorPhotoFlipped(!isMentorPhotoFlipped);
              }}
              style={{
                height: '40px',
                width: '40px',
                minWidth: '40px',
                borderRadius: '50%',
                border: selectedMentorPhotoIndex === idx ? '2px solid #FFD700' : '2px solid #6B7280',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: selectedMentorPhotoIndex === idx 
                  ? '0 0 0 2px #0B0E15, 0 0 0 4px #FFD700' 
                  : 'none',
                transition: 'transform 0.2s',
                padding: 0,
                backgroundColor: 'transparent'
              }}
            >
              <img 
                src={photo.photo_url} 
                alt="Profile" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </button>
          ))}
          {profilePhotos.length > 6 && (
            <div style={{
              height: '40px',
              width: '40px',
              minWidth: '40px',
              borderRadius: '50%',
              border: '2px solid #FFD700',
              backgroundColor: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFD700',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              +{profilePhotos.length - 6}
            </div>
          )}
        </div>

        {/* Right: Download Button */}
        <button 
          onClick={handleDownload} 
          disabled={isDownloading}
          style={{
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            opacity: isDownloading ? 0.5 : 1,
            transition: 'transform 0.2s',
            border: 'none',
            background: 'transparent',
            padding: 0
          }}
        >
          <img 
            src={downloadIcon} 
            alt="Download" 
            style={{
              height: '64px',
              width: 'auto'
            }}
          />
        </button>
      </div>

      {/* Slot Selector Grid - Below Controls */}
      {backgrounds.length > 0 && (
        <div style={{
          width: '100%',
          maxWidth: '1400px',
          padding: '32px 24px',
          margin: '0 auto'
        }}>
          <div style={{
            borderRadius: '24px',
            backgroundColor: 'rgba(17, 24, 39, 0.5)',
            border: '2px solid rgba(255, 215, 0, 0.2)',
            padding: '24px',
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px'
            }}>
              {Array.from({ length: 16 }, (_, i) => i + 1).map(slotNum => {
                const bg = backgrounds.find(b => b.slot_number === slotNum);
                const isSelected = selectedTemplate === slotNum - 1;
                return (
                  <button 
                    key={slotNum}
                    onClick={() => setSelectedTemplate(slotNum - 1)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: isSelected ? '4px solid #FFD700' : '2px solid #4B5563',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isSelected ? '0 0 20px rgba(255, 215, 0, 0.5)' : 'none',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      padding: 0,
                      backgroundColor: 'transparent'
                    }}
                  >
                    {bg?.background_image_url ? (
                      <img 
                        src={bg.background_image_url} 
                        alt={`Slot ${slotNum}`} 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(to bottom right, #1F2937, #111827)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {slotNum}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Ranks & Stickers Panel - Admin Only */}
      {isAdmin && (
        <RanksStickersPanel 
          isOpen={isStickersOpen} 
          onClose={() => setIsStickersOpen(false)} 
          currentSlot={selectedTemplate + 1} 
          rankName={bannerData?.rankName || ''} 
          selectedStickers={slotStickers[selectedTemplate + 1] || []} 
          onStickersChange={stickers => {
            setSlotStickers(prev => ({
              ...prev,
              [selectedTemplate + 1]: stickers
            }));
          }} 
        />
      )}
    </div>
  );
}