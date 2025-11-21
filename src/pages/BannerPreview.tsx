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

  // Compute scale factor for display
  useEffect(() => {
    const updateScale = () => {
      const container = document.querySelector('.banner-scale-container') as HTMLElement;
      if (!container) return;
      
      const parent = container.parentElement;
      if (!parent) return;
      
      const parentWidth = parent.clientWidth;
      const scale = parentWidth / 1350;
      
      container.style.setProperty('--banner-scale', scale.toString());
      container.style.transform = `scale(${scale})`;
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

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

  // 16 template variations (4x4 grid) with actual CSS colors
  const templateColors = [{
    id: 0,
    name: "Green Black",
    bgGradient: "linear-gradient(to bottom right, #000000, #111827, #000000)",
    border: "border-green-500"
  }, {
    id: 1,
    name: "Purple Pink",
    bgGradient: "linear-gradient(to bottom right, #581c87, #831843, #6b21a8)",
    border: "border-pink-500"
  }, {
    id: 2,
    name: "Blue Indigo",
    bgGradient: "linear-gradient(to bottom right, #1e3a8a, #312e81, #1e40af)",
    border: "border-blue-500"
  }, {
    id: 3,
    name: "Red Orange",
    bgGradient: "linear-gradient(to bottom right, #7f1d1d, #7c2d12, #991b1b)",
    border: "border-orange-500"
  }, {
    id: 4,
    name: "Emerald Teal",
    bgGradient: "linear-gradient(to bottom right, #064e3b, #134e4a, #065f46)",
    border: "border-teal-500"
  }, {
    id: 5,
    name: "Pink Purple",
    bgGradient: "linear-gradient(to bottom right, #831843, #581c87, #9d174d)",
    border: "border-purple-500"
  }, {
    id: 6,
    name: "Cyan Blue",
    bgGradient: "linear-gradient(to bottom right, #164e63, #1e3a8a, #155e75)",
    border: "border-cyan-500"
  }, {
    id: 7,
    name: "Yellow Orange",
    bgGradient: "linear-gradient(to bottom right, #713f12, #7c2d12, #854d0e)",
    border: "border-yellow-500"
  }, {
    id: 8,
    name: "Indigo Purple",
    bgGradient: "linear-gradient(to bottom right, #312e81, #581c87, #3730a3)",
    border: "border-indigo-500"
  }, {
    id: 9,
    name: "Rose Red",
    bgGradient: "linear-gradient(to bottom right, #881337, #7f1d1d, #9f1239)",
    border: "border-rose-500"
  }, {
    id: 10,
    name: "Violet Purple",
    bgGradient: "linear-gradient(to bottom right, #4c1d95, #581c87, #5b21b6)",
    border: "border-violet-500"
  }, {
    id: 11,
    name: "Lime Green",
    bgGradient: "linear-gradient(to bottom right, #365314, #14532d, #3f6212)",
    border: "border-lime-500"
  }, {
    id: 12,
    name: "Amber Orange",
    bgGradient: "linear-gradient(to bottom right, #78350f, #7c2d12, #92400e)",
    border: "border-amber-500"
  }, {
    id: 13,
    name: "Sky Blue",
    bgGradient: "linear-gradient(to bottom right, #0c4a6e, #1e3a8a, #075985)",
    border: "border-sky-500"
  }, {
    id: 14,
    name: "Fuchsia Pink",
    bgGradient: "linear-gradient(to bottom right, #701a75, #831843, #86198f)",
    border: "border-fuchsia-500"
  }, {
    id: 15,
    name: "Slate Gray",
    bgGradient: "linear-gradient(to bottom right, #0f172a, #111827, #1e293b)",
    border: "border-slate-500"
  }];
  const handleDownload = async () => {
    if (!bannerRef.current) {
      toast.error("Banner not ready for download");
      return;
    }
    setIsDownloading(true);
    const loadingToast = toast.loading("Generating pixel-perfect banner...");
    try {
      // Wait for all images to fully load
      const images = bannerRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            setTimeout(resolve, 5000);
          });
        })
      );

      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Store original parent styles to restore later
      const scaleContainer = bannerRef.current.closest('.banner-scale-container') as HTMLElement;
      const originalTransform = scaleContainer ? scaleContainer.style.transform : '';
      const originalWidth = scaleContainer ? scaleContainer.style.width : '';
      const originalHeight = scaleContainer ? scaleContainer.style.height : '';

      // Temporarily remove scale transform for capture
      if (scaleContainer) {
        scaleContainer.style.transform = 'none';
        scaleContainer.style.width = '1350px';
        scaleContainer.style.height = '1350px';
      }

      // Capture the banner at full 1350×1350 size with text overflow handling
      const canvas = await html2canvas(bannerRef.current, {
        width: 1350,
        height: 1350,
        scale: 3, // 3x for high quality = 4050×4050 output
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 15000,
        foreignObjectRendering: false,
        windowWidth: 1350,
        windowHeight: 1350,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          // Ensure text elements are fully visible and not cropped
          const clonedBanner = clonedDoc.getElementById('banner-canvas');
          if (clonedBanner) {
            // Allow overflow to show all text content
            clonedBanner.style.overflow = 'visible';
            
            // Find all text containers and ensure they don't clip
            const textElements = clonedBanner.querySelectorAll('.banner-text-content, .banner-preview-name, .banner-team, .banner-contact, .banner-profile-name, .banner-profile-rank');
            textElements.forEach((el) => {
              const element = el as HTMLElement;
              element.style.overflow = 'visible';
              element.style.whiteSpace = 'nowrap';
              element.style.textOverflow = 'clip'; // Don't truncate with ellipsis
            });
            
            // Ensure parent containers allow overflow
            const absoluteContainers = clonedBanner.querySelectorAll('[class*="absolute"]');
            absoluteContainers.forEach((el) => {
              const element = el as HTMLElement;
              if (element.querySelector('.banner-preview-name, .banner-team, .banner-contact, .banner-profile-name, .banner-profile-rank')) {
                element.style.overflow = 'visible';
              }
            });
          }
        }
      });

      // Restore original transform immediately after capture
      if (scaleContainer) {
        scaleContainer.style.transform = originalTransform;
        scaleContainer.style.width = originalWidth;
        scaleContainer.style.height = originalHeight;
      }

      // Verify canvas dimensions
      if (canvas.width !== 4050 || canvas.height !== 4050) {
        console.warn(`Canvas size mismatch: ${canvas.width}×${canvas.height}, expected 4050×4050`);
      }

      // Convert to PNG blob with high quality
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
        const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
        toast.success(`Full-size banner downloaded! (${sizeMB} MB, 4050×4050 PNG)`);
      }, "image/png", 0.95);
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

      {/* Banner Preview Container - Fixed at top */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0 bg-background">
        {/* Display wrapper with responsive scaling */}
        <div className="relative w-full max-w-[100vw] sm:max-w-[520px] mx-auto">
          <div className="border-4 border-primary rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
            {/* Scale wrapper for display - maintains 1350×1350 internal canvas */}
            <div style={{
              width: '100%',
              aspectRatio: '1 / 1',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                transform: 'scale(var(--banner-scale))',
                transformOrigin: 'top left',
                width: '1350px',
                height: '1350px'
              }} className="banner-scale-container">
                <div 
                  ref={bannerRef} 
                  id="banner-canvas"
                  className={`border-4 ${templateColors[selectedTemplate].border}`}
                  style={{
                    position: 'relative',
                    width: '1350px',
                    height: '1350px',
                    background: templateColors[selectedTemplate].bgGradient,
                    overflow: 'hidden'
                  }}
                >
              <div className="absolute inset-0">
                {/* Background Image (if uploaded) or Gradient Background */}
                {backgroundImage ? <img src={backgroundImage} alt="Template background" className="absolute inset-0 w-full h-full object-cover" /> : null}

                {/* Top-Left Logo */}
                {bannerSettings?.logo_left && <div className="absolute z-30" style={{
                top: '24px',
                left: '24px',
                width: '271px',
                height: '154px'
              }}>
                    <img src={bannerSettings.logo_left} alt="Left Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }} />
                  </div>}

                {/* Top-Right Logo */}
                {bannerSettings?.logo_right && <div className="absolute z-30" style={{
                top: '24px',
                right: '24px',
                width: '271px',
                height: '154px'
              }}>
                    <img src={bannerSettings.logo_right} alt="Right Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }} />
                  </div>}

                {/* Congratulations Image - Admin controlled, always displayed */}
                {bannerDefaults?.congratulations_image && <div className="absolute z-20" style={{
                top: '162px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                height: '162px'
              }}>
                    <img src={bannerDefaults.congratulations_image} alt="Congratulations" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.7))' }} />
                  </div>}

                {/* Text Below Congratulations Image */}
                <div className="absolute z-20" style={{
                top: '236px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                textAlign: 'center'
              }}>
                    <p style={{
                  fontSize: '36px',
                  lineHeight: '1.2',
                  whiteSpace: 'nowrap',
                  color: '#ffffff',
                  fontWeight: '600',
                  textShadow: '2px 2px 6px rgba(0,0,0,0.8)',
                  margin: '17px 8px'
                }}>
                      To Our Brand New Leader
                    </p>
                  </div>

                {/* Top - Upline avatars - FIXED SIZE AND POSITION */}
                <div className="absolute z-20" style={{
                top: '10px',
                left: '675px',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '12px'
              }}>
                  {bannerData.uplines?.slice(0, 5).map((upline, idx) => <div key={upline.id} style={{
                    width: '120px', /* LOCKED */
                    height: '120px', /* LOCKED */
                    minWidth: '120px',
                    minHeight: '120px',
                    maxWidth: '120px',
                    maxHeight: '120px',
                    borderRadius: '60px',
                    border: '3px solid #ffffff',
                    overflow: 'hidden',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.5)',
                    flexShrink: 0
                  }}>
                      <img src={upline.avatar || primaryPhoto || "/placeholder.svg"} alt={upline.name} style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
                    </div>)}
                </div>

                {/* LEFT - Main User Photo - FIXED SIZE AND POSITION */}
                {primaryPhoto && <div className="absolute overflow-hidden cursor-pointer transition-transform duration-500 ease-in-out" onClick={() => setIsPhotoFlipped(!isPhotoFlipped)} style={{
                left: '40px', /* LOCKED */
                top: '162px', /* LOCKED */
                width: '540px', /* LOCKED */
                height: '860px', /* LOCKED */
                minWidth: '540px',
                minHeight: '860px',
                maxWidth: '540px',
                maxHeight: '860px',
                borderRadius: '24px',
                transform: isPhotoFlipped ? 'scaleX(-1)' : 'scaleX(1)'
              }}>
                    <img src={primaryPhoto} alt={mainBannerName} style={{ width: '540px', height: '860px', objectFit: 'cover', objectPosition: 'top' }} />
                    {/* Bottom feather fade overlay */}
                    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
                  height: '258px', /* Fixed 30% of 860px */
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)'
                }} />
                  </div>}

                {/* Golden Crown below user photo */}
                <div className="absolute" style={{
                left: '176px',
                bottom: '270px',
                width: '270px',
                height: '108px'
              }}>
                  
                </div>

                {/* CENTER-RIGHT - Name - FIXED SIZE, POSITION, FONTS */}
                <div className="banner-text-content absolute" style={{
                top: '337px', /* LOCKED */
                left: '978px', /* LOCKED */
                transform: 'translateX(-50%)',
                width: '648px', /* LOCKED */
                minWidth: '648px',
                maxWidth: '648px',
                padding: '0 27px'
              }}>
                  <h2 title={mainBannerName.toUpperCase()} className="banner-preview-name text-center" style={{
                    color: '#ffffff',
                    textAlign: 'center',
                    margin: '0 auto'
                  }}>
                    {truncatedMainName.toUpperCase()}
                  </h2>
                  
                  {bannerData.teamCity && <p title={bannerData.teamCity.toUpperCase()} className="banner-team text-center" style={{ 
                    marginTop: '13px',
                    color: '#ffffff',
                    textAlign: 'center'
                  }}>
                      {bannerData.teamCity.toUpperCase()}
                    </p>}
                </div>
                {/* BOTTOM CENTER - Income - FIXED FONTS AND POSITION */}
                {bannerData.chequeAmount && <div className="absolute" style={{
                bottom: '202px', /* LOCKED */
                left: '67px', /* LOCKED */
                width: '743px', /* LOCKED */
                minWidth: '743px',
                maxWidth: '743px'
              }}>
                    <p style={{
                  fontSize: '36px', /* LOCKED */
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                  color: '#ffffff',
                  fontWeight: '500',
                  letterSpacing: '1px',
                  textAlign: 'left',
                  margin: 0,
                  marginBottom: '28px'
                }}>
                      THIS WEEK INCOME 
                    </p>
                    <p style={{
                  fontSize: '62px', /* LOCKED */
                  textShadow: '4px 4px 12px rgba(0,0,0,0.95)',
                  lineHeight: '1',
                  fontWeight: '800',
                  letterSpacing: '2px',
                  textAlign: 'left',
                  margin: 0,
                  color: '#FFD600',
                  fontFamily: 'sans-serif'
                }}>
                      {Number(bannerData.chequeAmount).toLocaleString('en-IN')}
                    </p>
                  </div>}

                {/* LOWER THIRD - Contact Info - FIXED FONTS AND POSITION */}
                <div className="absolute" style={{
                bottom: '40px', /* LOCKED */
                left: '27px', /* LOCKED */
                width: '675px', /* LOCKED */
                minWidth: '675px',
                maxWidth: '675px'
              }}>
                  <p style={{
                  fontSize: '9px !important', /* LOCKED */
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                  marginBottom: '1px',
                  textTransform: 'uppercase',
                  position: 'relative',
                  top: '13px',
                  color: '#ffffff',
                  fontWeight: '300',
                  letterSpacing: '2px'
                }}>
                    CALL FOR MENTORSHIP                                                                 
                  </p>
                  <p title={`+91 ${displayContact}`} className="banner-contact" style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#ffffff',
                  fontFamily: 'sans-serif'
                }}>
                    +91 {displayContact}
                  </p>
                </div>

                {/* BOTTOM RIGHT - Mentor Photo - FIXED SIZE AND POSITION */}
                {mentorPhoto && <div className="absolute overflow-hidden shadow-2xl cursor-pointer transition-transform duration-500 ease-in-out" onClick={() => setIsMentorPhotoFlipped(!isMentorPhotoFlipped)} style={{
                bottom: 0, /* LOCKED */
                right: 0, /* LOCKED */
                width: '445px', /* LOCKED */
                height: '520px', /* LOCKED */
                minWidth: '445px',
                minHeight: '520px',
                maxWidth: '445px',
                maxHeight: '520px',
                borderRadius: '16px',
                transform: isMentorPhotoFlipped ? 'scaleX(-1)' : 'scaleX(1)'
              }}>
                    <img src={mentorPhoto} alt={profileName} style={{ width: '445px', height: '520px', objectFit: 'cover', objectPosition: 'top' }} />
                    {/* Bottom feather fade overlay */}
                    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
                  height: '156px', /* Fixed 30% of 520px */
                  background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)'
                }} />
                  </div>}


                {/* BOTTOM CENTER - Profile Name & Rank - FIXED FONTS AND POSITION */}
                <div className="absolute text-center" style={{
                bottom: '40px', /* LOCKED */
                left: '50%', /* LOCKED */
                transform: 'translateX(-45%)',
                width: 'max-content',
                maxWidth: '1080px',
                zIndex: 3
              }}>
                  <p title={profileName} className="banner-profile-name" style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: '1px',
                  position: 'relative',
                  top: '20px',
                  color: '#ffffff',
                  textAlign: 'center'
                }}>
                    {truncatedProfileName.toUpperCase()}
                  </p>
                  <p className="banner-profile-rank" style={{
                  textTransform: 'uppercase',
                  color: '#eab308',
                  textAlign: 'center'
                }}>
                    {displayRank}
                  </p>
                </div>

                {/* Achievement Stickers - FIXED SIZE */}
                {stickerImages[selectedTemplate + 1]?.map((sticker, index) => {
                return <img key={sticker.id} src={sticker.url} alt="Achievement Sticker" className="absolute pointer-events-none animate-in fade-in zoom-in duration-300" style={{
                  left: `${sticker.position_x ?? 50}%`,
                  top: `${sticker.position_y ?? 50}%`,
                  transform: `translate(-50%, -50%) scale(${sticker.scale ?? 1}) rotate(${sticker.rotation ?? 0}deg)`,
                  transformOrigin: 'center center',
                  width: '162px', /* LOCKED */
                  height: '162px', /* LOCKED */
                  minWidth: '162px',
                  minHeight: '162px',
                  maxWidth: '162px',
                  maxHeight: '162px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 6px 9px rgba(0,0,0,0.4))',
                  zIndex: 10
                }} />;
              })}

                {/* BOTTOM RIGHT - Mentor Name and Title (Moved to bottom-most position) */}
                

              </div>
                </div>
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

      {/* Scrollable Slot Selector Box - Only this area scrolls */}
      {backgrounds.length > 0 && <div className="flex-1 min-h-0 px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="h-full overflow-y-auto rounded-2xl sm:rounded-3xl bg-[#111827]/50 border-2 border-[#FFD700]/20 p-3 sm:p-4 shadow-[0_0_30px_rgba(255,215,0,0.1)] scrollbar-thin scrollbar-thumb-[#FFD700]/30 scrollbar-track-transparent">
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {Array.from({
            length: 16
          }, (_, i) => i + 1).map(slotNum => {
            const bg = backgrounds.find(b => b.slot_number === slotNum);
            const isSelected = selectedTemplate === slotNum - 1;
                  return <button key={slotNum} onClick={() => setSelectedTemplate(slotNum - 1)} className={`aspect-square rounded-lg overflow-hidden transition-all ${isSelected ? 'border-4 border-[#FFD700] scale-105 shadow-[0_0_20px_rgba(255,215,0,0.5)]' : 'border-2 border-gray-600 hover:border-[#FFD700] hover:scale-105'}`}>
                    {bg?.background_image_url ? <img src={bg.background_image_url} alt={`Slot ${slotNum}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ background: templateColors[slotNum - 1]?.bgGradient || 'linear-gradient(to bottom right, #1f2937, #111827)' }}>
                         <span className="text-white text-xs font-bold">{slotNum}</span>
                      </div>}
                  </button>;
          })}
            </div>
          </div>
        </div>}

      {/* Ranks & Stickers Panel - Admin Only */}
      {isAdmin && <RanksStickersPanel isOpen={isStickersOpen} onClose={() => setIsStickersOpen(false)} currentSlot={selectedTemplate + 1} rankName={bannerData?.rankName || ''} selectedStickers={slotStickers[selectedTemplate + 1] || []} onStickersChange={stickers => {
      setSlotStickers(prev => ({
        ...prev,
        [selectedTemplate + 1]: stickers
      }));
    }} />}
    </div>;
}