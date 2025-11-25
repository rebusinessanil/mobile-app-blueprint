import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import RanksStickersPanel from "@/components/RanksStickersPanel";
import StickerControl from "@/components/StickerControl";
import downloadIcon from "@/assets/download-icon.png";
import { useProfile } from "@/hooks/useProfile";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { useBannerSettings } from "@/hooks/useBannerSettings";
import { useTemplateBackgrounds } from "@/hooks/useTemplateBackgrounds";
import { useBannerDefaults } from "@/hooks/useBannerDefaults";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Sticker } from "@/hooks/useStickers";
import { toPng } from "html-to-image";
import download from "downloadjs";
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
  categoryType?: 'rank' | 'bonanza' | 'birthday' | 'anniversary' | 'meeting' | 'festival' | 'motivational';
  message?: string;
  tripName?: string;
  eventTitle?: string;
  eventDate?: string;
  eventVenue?: string;
  quote?: string;
  motivationalBannerId?: string;
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
  
  // Sticker control states
  const [isDragMode, setIsDragMode] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [stickerScale, setStickerScale] = useState<Record<string, number>>({});
  const [isSavingSticker, setIsSavingSticker] = useState(false);
  const [originalStickerStates, setOriginalStickerStates] = useState<Record<string, {
    position_x: number;
    position_y: number;
    scale: number;
  }>>({});

  // Profile picture control states (motivational only, admin only)
  const [profilePicPosition, setProfilePicPosition] = useState({ x: 0, y: 0 }); // Offset from default position
  const [profilePicScale, setProfilePicScale] = useState(1); // Scale multiplier (1 = 100%)
  const [isDraggingProfile, setIsDraggingProfile] = useState(false);
  const [profileDragStart, setProfileDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isProfileControlMinimized, setIsProfileControlMinimized] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);

  // Handle profile picture drag (admin only, motivational only)
  useEffect(() => {
    if (!isDraggingProfile || !profileDragStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - profileDragStart.x;
      const newY = e.clientY - profileDragStart.y;
      
      // Boundary constraints: keep within canvas (0 to 1350px width, -675 to 675px height offset)
      const maxWidth = 1350 - (1026 * profilePicScale * 0.75); // 3:4 aspect ratio width
      const constrainedX = Math.max(0, Math.min(newX, maxWidth));
      const constrainedY = Math.max(-500, Math.min(newY, 500));
      
      setProfilePicPosition({ x: constrainedX, y: constrainedY });
    };

    const handleMouseUp = () => {
      setIsDraggingProfile(false);
      setProfileDragStart(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingProfile, profileDragStart, profilePicScale]);

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

  // Fetch motivational profile defaults (position and scale for profile picture)
  const { data: profileDefaults, refetch: refetchProfileDefaults } = useQuery({
    queryKey: ['motivational-profile-defaults', bannerData?.motivationalBannerId],
    queryFn: async () => {
      if (!bannerData?.motivationalBannerId) return null;
      
      const { data, error } = await supabase
        .from('motivational_profile_defaults')
        .select('*')
        .eq('motivational_banner_id', bannerData.motivationalBannerId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!bannerData?.motivationalBannerId && bannerData?.categoryType === 'motivational'
  });

  // Initialize profile picture position and scale from database defaults
  useEffect(() => {
    if (profileDefaults && bannerData?.categoryType === 'motivational') {
      setProfilePicPosition({ 
        x: Number(profileDefaults.profile_position_x) || 0, 
        y: Number(profileDefaults.profile_position_y) || 0 
      });
      setProfilePicScale(Number(profileDefaults.profile_scale) || 1);
    }
  }, [profileDefaults, bannerData?.categoryType]);

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

  // CRITICAL: Fetch backgrounds for the current template - STRICT template_id filtering
  const currentTemplateId = bannerData?.templateId || templateData?.id;
  
  // Validate templateId exists before fetching backgrounds
  useEffect(() => {
    if (!currentTemplateId) {
      console.error('❌ No templateId - backgrounds cannot be fetched. This will cause cross-contamination!');
    } else {
      console.log('✅ Fetching backgrounds for templateId:', currentTemplateId);
    }
  }, [currentTemplateId]);

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

  // Auto-select sticker when there's only one in the current slot
  useEffect(() => {
    const currentSlot = selectedTemplate + 1;
    const stickersInSlot = stickerImages[currentSlot] || [];
    
    // Auto-select if there's exactly one sticker and none is selected
    if (stickersInSlot.length === 1 && !selectedStickerId) {
      const sticker = stickersInSlot[0];
      setSelectedStickerId(sticker.id);
      
      // Initialize scale from database defaults (admin-defined)
      if (!stickerScale[sticker.id]) {
        setStickerScale(prev => ({
          ...prev,
          [sticker.id]: sticker.scale || 2.5
        }));
      }
      
      // Store original state for admin reset functionality
      if (isAdmin) {
        setOriginalStickerStates(prev => ({
          ...prev,
          [sticker.id]: {
            position_x: sticker.position_x || 0,
            position_y: sticker.position_y || 0,
            scale: sticker.scale || 2.5
          }
        }));
      }
    }
  }, [stickerImages, selectedTemplate, selectedStickerId, stickerScale, isAdmin]);

  // Map selectedTemplate (0-15) to slot_number (1-16) and fetch correct background
  // CRITICAL: Only show background if it exists for this exact slot - NO fallbacks, NO cross-contamination
  const selectedSlot = selectedTemplate + 1;
  const backgroundImage = backgrounds.find(bg => bg.slot_number === selectedSlot)?.background_image_url || null;

  // Debug background selection
  useEffect(() => {
    console.log('🎨 Background selection:', {
      selectedSlot,
      totalBackgrounds: backgrounds.length,
      currentTemplateId,
      foundBackground: !!backgroundImage,
      backgroundUrl: backgroundImage ? backgroundImage.substring(0, 60) + '...' : 'none'
    });
    
    // Warn if backgrounds exist but none match current slot
    if (backgrounds.length > 0 && !backgroundImage) {
      console.warn('⚠️ Backgrounds exist but none for slot', selectedSlot);
      console.log('Available slots:', backgrounds.map(bg => bg.slot_number));
    }
  }, [selectedSlot, backgrounds, currentTemplateId, backgroundImage]);

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
  // FESTIVAL & MOTIVATIONAL CATEGORIES: Skip auto-loading achiever image completely
  const primaryPhoto: string | null = (bannerData?.categoryType === 'festival' || bannerData?.categoryType === 'motivational')
    ? (bannerData?.photo || null) 
    : (bannerData?.photo || profile?.profile_photo || profilePhotos[0]?.photo_url || null);

  // Get mentor/upline photo (RIGHT-BOTTOM) - ONLY use profile photos, never uploads
  const mentorPhoto: string | null = profilePhotos[selectedMentorPhotoIndex]?.photo_url || profilePhotos[0]?.photo_url || profile?.profile_photo || null;

  // Fetch selected stickers - removed, now using slotStickers structure
  // Each slot has its own stickers independently

  // Early return if no banner data
  if (!bannerData) {
    navigate("/rank-selection");
    return null;
  }

  // Category-specific content render function
  const renderCategoryContent = () => {
    const category = bannerData.categoryType || 'rank';

    switch (category) {
      case 'bonanza':
        return (
          <>
            {/* Congratulations Image */}
            {bannerDefaults?.congratulations_image && (
              <div className="absolute z-20" style={{
                top: '162px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                height: '162px'
              }}>
                <img src={bannerDefaults.congratulations_image} alt="Congratulations" style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.7))'
                }} />
              </div>
            )}

            {/* Trip Achievement Title */}
            <div className="absolute z-20" style={{
              top: '236px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '42px',
                fontWeight: '600',
                color: '#ffffff',
                textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                letterSpacing: '1px'
              }}>
                BONANZA TRIP WINNER
              </p>
            </div>

            {/* Trip Name */}
            <div className="absolute" style={{
              top: '337px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              padding: '0 27px'
            }}>
              <h2 style={{
                color: '#FFD700',
                textAlign: 'center',
                fontSize: '48px',
                fontWeight: '700',
                textShadow: '3px 3px 10px rgba(0,0,0,0.95)',
                margin: 0
              }}>
                {bannerData.tripName?.toUpperCase() || 'TRIP DESTINATION'}
              </h2>
            </div>

            {/* Achiever Name & Team */}
            <div className="absolute" style={{
              top: '420px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              padding: '0 27px'
            }}>
              <h3 style={{
                color: '#ffffff',
                textAlign: 'center',
                fontSize: '36px',
                fontWeight: '600',
                textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
                margin: 0
              }}>
                {truncatedMainName.toUpperCase()}
              </h3>
              {bannerData.teamCity && (
                <p style={{
                  marginTop: '13px',
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: '28px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
                }}>
                  {bannerData.teamCity.toUpperCase()}
                </p>
              )}
            </div>
          </>
        );

      case 'birthday':
        return (
          <>
            {/* Birthday Emoji/Icon */}
            <div className="absolute z-20" style={{
              top: '140px',
              left: '978px',
              transform: 'translateX(-50%)',
              fontSize: '120px'
            }}>
              🎂
            </div>

            {/* Happy Birthday Text */}
            <div className="absolute z-20" style={{
              top: '280px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '52px',
                fontWeight: '700',
                color: '#FFD700',
                textShadow: '3px 3px 10px rgba(0,0,0,0.9)',
                letterSpacing: '2px'
              }}>
                HAPPY BIRTHDAY
              </p>
            </div>

            {/* Name */}
            <div className="absolute" style={{
              top: '370px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              padding: '0 27px'
            }}>
              <h2 style={{
                color: '#ffffff',
                textAlign: 'center',
                fontSize: '44px',
                fontWeight: '600',
                textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                margin: 0
              }}>
                {truncatedMainName.toUpperCase()}
              </h2>
            </div>

            {/* Birthday Message */}
            {bannerData.message && (
              <div className="absolute" style={{
                top: '450px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                padding: '0 40px'
              }}>
                <p style={{
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: '24px',
                  fontStyle: 'italic',
                  textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
                  lineHeight: '1.4'
                }}>
                  {bannerData.message}
                </p>
              </div>
            )}
          </>
        );

      case 'anniversary':
        return (
          <>
            {/* Anniversary Icon */}
            <div className="absolute z-20" style={{
              top: '140px',
              left: '978px',
              transform: 'translateX(-50%)',
              fontSize: '120px'
            }}>
              💞
            </div>

            {/* Happy Anniversary Text */}
            <div className="absolute z-20" style={{
              top: '280px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '48px',
                fontWeight: '700',
                color: '#FFD700',
                textShadow: '3px 3px 10px rgba(0,0,0,0.9)',
                letterSpacing: '1px'
              }}>
                HAPPY ANNIVERSARY
              </p>
            </div>

            {/* Name */}
            <div className="absolute" style={{
              top: '370px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              padding: '0 27px'
            }}>
              <h2 style={{
                color: '#ffffff',
                textAlign: 'center',
                fontSize: '44px',
                fontWeight: '600',
                textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                margin: 0
              }}>
                {truncatedMainName.toUpperCase()}
              </h2>
              {bannerData.teamCity && (
                <p style={{
                  marginTop: '13px',
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: '28px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
                }}>
                  {bannerData.teamCity.toUpperCase()}
                </p>
              )}
            </div>

            {/* Anniversary Message */}
            {bannerData.message && (
              <div className="absolute" style={{
                top: '480px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                padding: '0 40px'
              }}>
                <p style={{
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: '22px',
                  fontStyle: 'italic',
                  textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
                  lineHeight: '1.4'
                }}>
                  {bannerData.message}
                </p>
              </div>
            )}
          </>
        );

      case 'meeting':
        return (
          <>
            {/* Event Icon */}
            <div className="absolute z-20" style={{
              top: '140px',
              left: '978px',
              transform: 'translateX(-50%)',
              fontSize: '110px'
            }}>
              📅
            </div>

            {/* Event Type */}
            <div className="absolute z-20" style={{
              top: '270px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '42px',
                fontWeight: '700',
                color: '#FFD700',
                textShadow: '3px 3px 10px rgba(0,0,0,0.9)',
                letterSpacing: '1px'
              }}>
                TEAM MEETING
              </p>
            </div>

            {/* Event Title */}
            <div className="absolute" style={{
              top: '350px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              padding: '0 27px'
            }}>
              <h2 style={{
                color: '#ffffff',
                textAlign: 'center',
                fontSize: '38px',
                fontWeight: '600',
                textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                margin: 0
              }}>
                {bannerData.eventTitle?.toUpperCase() || truncatedMainName.toUpperCase()}
              </h2>
            </div>

            {/* Event Details */}
            <div className="absolute" style={{
              top: '430px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              padding: '0 40px'
            }}>
              {bannerData.eventDate && (
                <p style={{
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: '26px',
                  textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
                  margin: '8px 0'
                }}>
                  📆 {bannerData.eventDate}
                </p>
              )}
              {bannerData.eventVenue && (
                <p style={{
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: '24px',
                  textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
                  margin: '8px 0'
                }}>
                  📍 {bannerData.eventVenue}
                </p>
              )}
            </div>
          </>
        );

      case 'festival':
        return (
          <>
            {/* Festival Icon */}
            <div className="absolute z-20" style={{
              top: '140px',
              left: '978px',
              transform: 'translateX(-50%)',
              fontSize: '120px'
            }}>
              🎉
            </div>

            {/* Festival Greeting */}
            <div className="absolute z-20" style={{
              top: '280px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '48px',
                fontWeight: '700',
                color: '#FFD700',
                textShadow: '3px 3px 10px rgba(0,0,0,0.9)',
                letterSpacing: '1px'
              }}>
                FESTIVAL GREETINGS
              </p>
            </div>

            {/* Name - Only show if name exists */}
            {truncatedMainName && (
              <div className="absolute" style={{
                top: '370px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                padding: '0 27px'
              }}>
                <h2 style={{
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: '44px',
                  fontWeight: '600',
                  textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                  margin: 0
                }}>
                  {truncatedMainName.toUpperCase()}
                </h2>
                {bannerData.teamCity && (
                  <p style={{
                    marginTop: '13px',
                    color: '#ffffff',
                    textAlign: 'center',
                    fontSize: '28px',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
                  }}>
                    {bannerData.teamCity.toUpperCase()}
                  </p>
                )}
              </div>
            )}

            {/* Festival Message */}
            {bannerData.message && (
              <div className="absolute" style={{
                top: '480px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                padding: '0 40px'
              }}>
                <p style={{
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: '24px',
                  fontStyle: 'italic',
                  textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
                  lineHeight: '1.4'
                }}>
                  {bannerData.message}
                </p>
              </div>
            )}
          </>
        );

      case 'motivational':
        return (
          <>
            {/* Motivational Icon */}
            <div className="absolute z-20" style={{
              top: '140px',
              left: '978px',
              transform: 'translateX(-50%)',
              fontSize: '110px'
            }}>
              💪
            </div>

            {/* Motivational Title */}
            <div className="absolute z-20" style={{
              top: '270px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '44px',
                fontWeight: '700',
                color: '#FFD700',
                textShadow: '3px 3px 10px rgba(0,0,0,0.9)',
                letterSpacing: '1px'
              }}>
                STAY MOTIVATED
              </p>
            </div>

            {/* Quote/Message */}
            {bannerData.quote && (
              <div className="absolute" style={{
                top: '360px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                padding: '0 50px'
              }}>
                <p style={{
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: '32px',
                  fontWeight: '500',
                  fontStyle: 'italic',
                  textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                  lineHeight: '1.5',
                  quotes: '"\"""\""'
                }}>
                  "{bannerData.quote}"
                </p>
              </div>
            )}

            {/* Name Attribution - Only show if name exists */}
            {truncatedMainName && (
              <div className="absolute" style={{
                top: '520px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                padding: '0 27px'
              }}>
                <p style={{
                  color: '#FFD700',
                  textAlign: 'center',
                  fontSize: '30px',
                  fontWeight: '600',
                  textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
                  margin: 0
                }}>
                  - {truncatedMainName.toUpperCase()}
                </p>
              </div>
            )}
          </>
        );

      default: // 'rank' category - original rank banner layout
        return (
          <>
            {/* Congratulations Image - Admin controlled, always displayed */}
            {bannerDefaults?.congratulations_image && (
              <div className="absolute z-20" style={{
                top: '162px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                height: '162px'
              }}>
                <img src={bannerDefaults.congratulations_image} alt="Congratulations" style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.7))'
                }} />
              </div>
            )}

            {/* Text Below Congratulations Image */}
            <div className="absolute z-20" style={{
              top: '236px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              textAlign: 'center'
            }}>
              {/* Placeholder for future content */}
            </div>

            {/* CENTER-RIGHT - Name - FIXED SIZE, POSITION, FONTS */}
            <div className="banner-text-content absolute" style={{
              top: '337px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              minWidth: '648px',
              maxWidth: '648px',
              padding: '0 27px'
            }}>
              <h2 title={mainBannerName.toUpperCase()} style={{
                color: '#ffffff',
                textAlign: 'center',
                margin: '0 auto'
              }} className="banner-preview-name text-center px-0 py-[2px] mx-[26px]">
                {truncatedMainName.toUpperCase()}
              </h2>
              
              {bannerData.teamCity && (
                <p title={bannerData.teamCity.toUpperCase()} style={{
                  marginTop: '13px',
                  color: '#ffffff',
                  textAlign: 'center'
                }} className="banner-team text-center px-[5px] py-[6px]">
                  {bannerData.teamCity.toUpperCase()}
                </p>
              )}
            </div>

            {/* BOTTOM CENTER - Income - FIXED FONTS AND POSITION */}
            {bannerData.chequeAmount && (
              <div className="absolute" style={{
                bottom: '202px',
                left: '67px',
                width: '743px',
                minWidth: '743px',
                maxWidth: '743px'
              }}>
                <p style={{
                  fontSize: '36px',
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
                  fontSize: '62px',
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
              </div>
            )}
          </>
        );
    }
  };

  // Handle sticker dragging - Admin only
  const handleStickerMouseDown = (e: React.MouseEvent, stickerId: string) => {
    if (!isAdmin || !isDragMode) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedStickerId(stickerId);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleStickerMouseMove = (e: React.MouseEvent) => {
    if (!isAdmin || !isDragMode || !selectedStickerId || !dragStartPos || !bannerRef.current) return;
    
    const banner = bannerRef.current;
    const rect = banner.getBoundingClientRect();
    const scale = rect.width / 1350; // Account for display scaling
    
    // Calculate new position relative to banner
    const deltaX = (e.clientX - dragStartPos.x) / scale;
    const deltaY = (e.clientY - dragStartPos.y) / scale;
    
    // Update sticker position
    setStickerImages(prev => {
      const newImages = { ...prev };
      Object.keys(newImages).forEach(slot => {
        newImages[parseInt(slot)] = newImages[parseInt(slot)].map(sticker => {
          if (sticker.id === selectedStickerId) {
            const currentX = (sticker.position_x ?? 77) / 100 * 1350;
            const currentY = (sticker.position_y ?? 62) / 100 * 1350;
            const newX = Math.max(0, Math.min(1350, currentX + deltaX));
            const newY = Math.max(0, Math.min(1350, currentY + deltaY));
            
            return {
              ...sticker,
              position_x: (newX / 1350) * 100,
              position_y: (newY / 1350) * 100,
            };
          }
          return sticker;
        });
      });
      return newImages;
    });
    
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleStickerMouseUp = () => {
    setSelectedStickerId(null);
    setDragStartPos(null);
  };

  const handleAddSticker = () => {
    toast.info("Add sticker functionality coming soon!");
  };

  const handleResizeSticker = (scale: number) => {
    if (!selectedStickerId) {
      // Apply to all stickers in current slot
      const currentSlot = selectedTemplate + 1;
      const stickers = stickerImages[currentSlot] || [];
      stickers.forEach(sticker => {
        setStickerScale(prev => ({ ...prev, [sticker.id]: scale }));
      });
    } else {
      setStickerScale(prev => ({ ...prev, [selectedStickerId]: scale }));
    }
  };

  const handleSaveSticker = async () => {
    if (!selectedStickerId) {
      toast.error("Please select a sticker first");
      return;
    }

    const currentSlot = selectedTemplate + 1;
    const stickers = stickerImages[currentSlot] || [];
    const selectedSticker = stickers.find(s => s.id === selectedStickerId);
    
    if (!selectedSticker) {
      toast.error("Sticker not found");
      return;
    }

    setIsSavingSticker(true);
    try {
      const { error } = await supabase
        .from("stickers")
        .update({
          position_x: selectedSticker.position_x || 0,
          position_y: selectedSticker.position_y || 0,
          scale: stickerScale[selectedStickerId] || 2.5,
        })
        .eq("id", selectedStickerId);

      if (error) throw error;

      // Store current state as original after successful save
      setOriginalStickerStates(prev => ({
        ...prev,
        [selectedStickerId]: {
          position_x: selectedSticker.position_x || 0,
          position_y: selectedSticker.position_y || 0,
          scale: stickerScale[selectedStickerId] || 2.5,
        }
      }));

      toast.success("Sticker settings saved successfully!");
    } catch (error) {
      console.error("Error saving sticker:", error);
      toast.error("Failed to save sticker settings");
    } finally {
      setIsSavingSticker(false);
    }
  };

  const handleResetSticker = () => {
    if (!selectedStickerId) {
      toast.error("Please select a sticker first");
      return;
    }

    const originalState = originalStickerStates[selectedStickerId];
    if (!originalState) {
      toast.info("No saved state to reset to");
      return;
    }

    // Reset to original saved state
    setStickerScale(prev => ({
      ...prev,
      [selectedStickerId]: originalState.scale
    }));
    
    const currentSlot = selectedTemplate + 1;
    setStickerImages(prev => ({
      ...prev,
      [currentSlot]: (prev[currentSlot] || []).map(sticker => {
        if (sticker.id === selectedStickerId) {
          return {
            ...sticker,
            position_x: originalState.position_x,
            position_y: originalState.position_y,
          };
        }
        return sticker;
      })
    }));
    
    toast.success("Sticker reset to saved position");
  };

  const getCurrentScale = () => {
    const currentSlot = selectedTemplate + 1;
    const stickers = stickerImages[currentSlot] || [];
    if (stickers.length > 0) {
      const firstSticker = stickers[0];
      return stickerScale[firstSticker.id] ?? firstSticker.scale ?? 0.5;
    }
    return 0.5;
  };

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

  // Save profile picture position and scale defaults (admin only, motivational only)
  const handleSaveProfileDefaults = async () => {
    if (!isAdmin || bannerData.categoryType !== 'motivational' || !bannerData.motivationalBannerId) {
      toast.error("Cannot save profile defaults");
      return;
    }

    const savingToast = toast.loading("Saving profile picture defaults...");

    try {
      const { error } = await supabase
        .from('motivational_profile_defaults')
        .upsert({
          motivational_banner_id: bannerData.motivationalBannerId,
          profile_position_x: profilePicPosition.x,
          profile_position_y: profilePicPosition.y,
          profile_scale: profilePicScale
        }, {
          onConflict: 'motivational_banner_id'
        });

      if (error) throw error;

      toast.dismiss(savingToast);
      toast.success("Profile picture defaults saved! All users will see these settings.");
      
      // Refetch to confirm the save
      refetchProfileDefaults();
    } catch (error) {
      console.error("Error saving profile defaults:", error);
      toast.dismiss(savingToast);
      toast.error("Failed to save profile defaults");
    }
  };

  const handleDownload = async () => {
    if (!bannerRef.current) {
      toast.error("Banner not ready for download");
      return;
    }

    // Check credit balance before download
    if (userId) {
      const { data: credits, error: creditsError } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (creditsError || !credits) {
        toast.error("Failed to check credit balance");
        return;
      }

      // Check for zero balance first
      if (credits.balance <= 0) {
        setShowBalanceModal(true);
        return;
      }

      const BANNER_COST = 10; // Cost per banner download
      if (credits.balance < BANNER_COST) {
        toast.error(`Insufficient balance! You need ₹${BANNER_COST} credits to download this banner.`, {
          action: {
            label: "Top Up",
            onClick: () => navigate("/wallet"),
          },
        });
        return;
      }
    }

    setIsDownloading(true);
    const loadingToast = toast.loading("Generating ultra HD banner...");
    
    try {
      // High quality export settings
      const dataUrl = await toPng(bannerRef.current, {
        cacheBust: true,
        pixelRatio: 3,             // Ultra HD Export
        quality: 1,                
        backgroundColor: null,     // Transparent safe
        style: {
          transform: "scale(1)",   // No scaling issue
          transformOrigin: "top left",
        },
        filter: (node) => {
          // WhatsApp button, controls, slots, UI elements hide
          if (
            node.classList?.contains("slot-selector") ||
            node.classList?.contains("control-buttons") ||
            node.classList?.contains("whatsapp-float") ||
            node.id === "ignore-download"
          ) {
            return false;
          }
          return true;
        },
      });

      toast.dismiss(loadingToast);

      // Download the banner
      const timestamp = new Date().getTime();
      download(dataUrl, `ReBusiness-Banner-${bannerData.rankName}-${timestamp}.png`);

      // Calculate approximate size (base64 size estimation)
      const sizeMB = ((dataUrl.length * 0.75) / (1024 * 1024)).toFixed(2);

      // Deduct credits after successful download
      if (userId) {
        const BANNER_COST = 10;
        try {
          // Get current balance
          const { data: currentCredits } = await supabase
            .from("user_credits")
            .select("balance, total_spent")
            .eq("user_id", userId)
            .single();

          if (currentCredits) {
            const newBalance = currentCredits.balance - BANNER_COST;
            const newTotalSpent = currentCredits.total_spent + BANNER_COST;

            // Update balance
            await supabase
              .from("user_credits")
              .update({
                balance: newBalance,
                total_spent: newTotalSpent,
              })
              .eq("user_id", userId);

            // Record transaction
            await supabase
              .from("credit_transactions")
              .insert({
                user_id: userId,
                amount: BANNER_COST,
                transaction_type: "spent",
                description: `Banner download - ${bannerData.rankName}`,
              });

            toast.success(
              `Banner downloaded! (${sizeMB} MB) • ₹${BANNER_COST} deducted`,
              {
                description: `Remaining balance: ₹${newBalance}`,
              }
            );
          }
        } catch (error) {
          console.error("Credit deduction error:", error);
          // Still show success for download even if credit deduction fails
          toast.success(`Ultra HD banner downloaded! (~${sizeMB} MB PNG)`);
        }
      } else {
        toast.success(`Ultra HD banner downloaded! (~${sizeMB} MB PNG)`);
      }
    } catch (error) {
      console.error("Banner download failed:", error);
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
                  onMouseMove={isAdmin ? handleStickerMouseMove : undefined}
                  onMouseUp={isAdmin ? handleStickerMouseUp : undefined}
                  onMouseLeave={isAdmin ? handleStickerMouseUp : undefined}
                  style={{
                    position: 'relative',
                    width: '1350px',
                    height: '1350px',
                    background: templateColors[selectedTemplate].bgGradient,
                    overflow: 'hidden',
                    cursor: isAdmin && isDragMode ? 'crosshair' : 'default',
                  }}
                >
              <div className="absolute inset-0">
                {/* Background Image (if uploaded) or Gradient Background */}
                {backgroundImage ? <img src={backgroundImage} alt="Template background" className="absolute inset-0 w-full h-full object-cover" /> : null}

                {/* Top-Left Logo */}
                {bannerSettings?.logo_left && <div className="absolute z-30" style={{
                    top: '10px',
                    left: '24px',
                    width: '250px',
                    height: 'auto'
                  }}>
                    <img src={bannerSettings.logo_left} alt="Left Logo" style={{
                      width: '250px',
                      height: 'auto',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
                    }} />
                  </div>}

                {/* Top-Right Logo */}
                {bannerSettings?.logo_right && <div className="absolute z-30" style={{
                    top: '10px',
                    right: '24px',
                    width: '250px',
                    height: 'auto'
                  }}>
                    <img src={bannerSettings.logo_right} alt="Right Logo" style={{
                      width: '250px',
                      height: 'auto',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
                    }} />
                  </div>}

                {/* Top - Upline avatars - FIXED SIZE AND POSITION */}
                <div className="absolute z-20" style={{
                    top: '10px',
                    left: '675px',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '12px'
                  }}>
                  {bannerData.uplines?.slice(0, 5).map((upline, idx) => <div key={upline.id} style={{
                      width: '120px',
                      /* LOCKED */
                      height: '120px',
                      /* LOCKED */
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
                      <img src={upline.avatar || primaryPhoto || "/placeholder.svg"} alt={upline.name} style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'cover'
                      }} />
                    </div>)}
                </div>

                {/* LEFT - Main User Photo - FIXED SIZE AND POSITION - 3:4 RATIO - REDUCED BY 12% */}
                {primaryPhoto && <div className="absolute overflow-hidden cursor-pointer transition-transform duration-500 ease-in-out" onClick={() => setIsPhotoFlipped(!isPhotoFlipped)} style={{
                    left: '40px',
                    /* LOCKED */
                    top: '162px',
                    /* LOCKED */
                    width: '594px',
                    /* LOCKED - 3:4 ratio, 12% reduction */
                    height: '792px',
                    /* LOCKED - 3:4 ratio, 12% reduction */
                    minWidth: '594px',
                    minHeight: '792px',
                    maxWidth: '594px',
                    maxHeight: '792px',
                    borderRadius: '24px',
                    transform: isPhotoFlipped ? 'scaleX(-1)' : 'scaleX(1)'
                  }}>
                    <img src={primaryPhoto} alt={mainBannerName} style={{
                      width: '594px',
                      height: '792px',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }} />
                    {/* Bottom feather fade overlay */}
                    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
                      height: '238px',
                      /* Fixed 30% of 792px */
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)'
                    }} />
                  </div>}

                {/* Golden Crown below user photo */}
                <div className="absolute" style={{
                    left: '176px',
                    bottom: '230px',
                    width: '270px',
                    height: '108px'
                  }}>
                  
                </div>

                {/* Category-specific content */}
                {renderCategoryContent()}

                {/* LOWER THIRD - Contact Info - FIXED FONTS AND POSITION */}
                <div className="absolute" style={{
                    bottom: '40px',
                    ...(bannerData.categoryType === 'motivational' 
                      ? { right: '27px', textAlign: 'right' as const }
                      : { left: '27px' }
                    ),
                    width: '675px',
                    minWidth: '675px',
                    maxWidth: '675px'
                  }}>
                  <p style={{
                      fontSize: '9px !important',
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
                  <p title={`+91 ${displayContact}`} style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: '#ffffff',
                      fontFamily: 'sans-serif'
                    }} className="banner-contact px-0 py-[3px]">
                    +91 {displayContact}
                  </p>
                </div>

                {/* LEFT SIDE - Profile Photo - 75% HEIGHT - Motivational Layout */}
                {mentorPhoto && bannerData.categoryType === 'motivational' && <div 
                  className="absolute overflow-hidden shadow-2xl transition-transform duration-500 ease-in-out" 
                  onClick={() => !isDraggingProfile && setIsMentorPhotoFlipped(!isMentorPhotoFlipped)}
                  onMouseDown={(e) => {
                    if (isAdmin) {
                      e.stopPropagation();
                      setIsDraggingProfile(true);
                      setProfileDragStart({ x: e.clientX - profilePicPosition.x, y: e.clientY - profilePicPosition.y });
                    }
                  }}
                  style={{
                    top: `calc(50% + ${profilePicPosition.y}px)`,
                    left: `${profilePicPosition.x}px`,
                    width: 'auto',
                    height: `${1026 * profilePicScale}px`,
                    aspectRatio: '3/4',
                    borderRadius: '16px',
                    transform: isMentorPhotoFlipped ? 'translateY(-50%) scaleX(-1)' : 'translateY(-50%) scaleX(1)',
                    cursor: isAdmin ? 'move' : 'pointer',
                    border: 'none'
                  }}>
                    <img src={mentorPhoto} alt={profileName} style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      pointerEvents: 'none'
                    }} />
                    {/* Bottom feather fade overlay */}
                    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
                      height: '308px', // 30% of 1026px
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)'
                    }} />
                  </div>}

                {/* BOTTOM RIGHT - Mentor Photo - FIXED SIZE AND POSITION - SQUARE 1:1 RATIO - Other Categories */}
                {mentorPhoto && bannerData.categoryType !== 'motivational' && <div className="absolute overflow-hidden shadow-2xl cursor-pointer transition-transform duration-500 ease-in-out" onClick={() => setIsMentorPhotoFlipped(!isMentorPhotoFlipped)} style={{
                    bottom: 0,
                    right: 0,
                    width: '540px',
                    height: '540px',
                    minWidth: '540px',
                    minHeight: '540px',
                    maxWidth: '540px',
                    maxHeight: '540px',
                    borderRadius: '16px',
                    transform: isMentorPhotoFlipped ? 'scaleX(-1)' : 'scaleX(1)'
                  }}>
                    <img src={mentorPhoto} alt={profileName} style={{
                      width: '540px',
                      height: '540px',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }} />
                    {/* Bottom feather fade overlay */}
                    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
                      height: '162px',
                      /* Fixed 30% of 540px */
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)'
                    }} />
                  </div>}


                {/* MOTIVATIONAL CONTACT STRIP BANNER - Three Variant Sequencing */}
                {bannerData.categoryType === 'motivational' && (() => {
                  // Calculate variant based on slot number (1-16) in repeating sequence
                  const slotNumber = selectedTemplate + 1; // selectedTemplate is 0-indexed, slots are 1-16
                  const variantIndex = ((slotNumber - 1) % 3) + 1; // 1, 2, or 3
                  
                  // Define three variants with strict color isolation
                  const variants = {
                    1: { 
                      borderColor: '#e63946', // Red/Crimson
                      tabColor: '#e63946',
                      shadowColor: 'rgba(230, 57, 70, 0.4)'
                    },
                    2: { 
                      borderColor: '#f77f00', // Orange
                      tabColor: '#f77f00',
                      shadowColor: 'rgba(247, 127, 0, 0.4)'
                    },
                    3: { 
                      borderColor: '#06d6a0', // Teal/Cyan
                      tabColor: '#06d6a0',
                      shadowColor: 'rgba(6, 214, 160, 0.4)'
                    }
                  };

                  const currentVariant = variants[variantIndex as keyof typeof variants];

                  return (
                    <div className="absolute" style={{
                      bottom: '35px',
                      left: '27px',
                      right: '27px',
                      height: '105px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      zIndex: 4
                    }}>
                      {/* Main Dark Banner with Colored Border */}
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        right: '280px',
                        height: '100%',
                        background: '#1a1f2e',
                        borderRadius: '50px 8px 8px 50px',
                        border: `4px solid ${currentVariant.borderColor}`,
                        boxShadow: `0 6px 20px rgba(0, 0, 0, 0.5), 0 0 20px ${currentVariant.shadowColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 40px'
                      }}>
                        {/* User Info on Left */}
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '30px',
                            fontWeight: '800',
                            color: '#ffffff',
                            marginBottom: '4px',
                            letterSpacing: '1px',
                            textShadow: '0 2px 6px rgba(0, 0, 0, 0.6)'
                          }}>
                            {profileName?.toUpperCase() || 'USER NAME'}
                          </div>
                          <div style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: currentVariant.borderColor,
                            letterSpacing: '1px',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                          }}>
                            {displayRank || 'RANK'}
                          </div>
                        </div>
                      </div>

                      {/* Right Tab with Angled Edge */}
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        height: '100%',
                        width: '320px',
                        background: currentVariant.tabColor,
                        clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 15% 100%, 0% 50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingLeft: '60px',
                        boxShadow: `0 6px 20px ${currentVariant.shadowColor}`
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '15px',
                            fontWeight: '600',
                            color: '#ffffff',
                            marginBottom: '2px',
                            letterSpacing: '1.5px',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
                          }}>
                            CALL FOR MENTORSHIP
                          </div>
                          <div style={{
                            fontSize: '26px',
                            fontWeight: '800',
                            color: '#ffffff',
                            letterSpacing: '1px',
                            textShadow: '0 2px 6px rgba(0, 0, 0, 0.5)'
                          }}>
                            {profile?.mobile || profile?.whatsapp || '+91 7734990035'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* BOTTOM CENTER - Profile Name & Rank - FIXED FONTS AND POSITION (Only for non-motivational) */}
                {bannerData.categoryType !== 'motivational' && (
                  <div className="absolute text-center" style={{
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-45%)',
                    width: 'max-content',
                    maxWidth: '1080px',
                    zIndex: 3
                  }}>
                    <p title={profileName} style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '1px',
                        position: 'relative',
                        top: '20px',
                        color: '#ffffff',
                        textAlign: 'center'
                      }} className="banner-profile-name px-[4px] py-0 my-0">
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
                )}

                {/* Achievement Stickers - Right side of achiever photo, near right edge */}
                {stickerImages[selectedTemplate + 1]?.map((sticker, index) => {
                    const finalScale = stickerScale[sticker.id] ?? sticker.scale ?? 0.5;
                    const isSelected = selectedStickerId === sticker.id;
                    return <img 
                      key={sticker.id} 
                      src={sticker.url} 
                      alt="Achievement Sticker" 
                      className={`absolute animate-in fade-in zoom-in duration-300 transition-all ${isAdmin && isDragMode ? 'cursor-move' : 'pointer-events-none'} ${isAdmin && isSelected ? 'ring-4 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                      onMouseDown={isAdmin ? (e) => handleStickerMouseDown(e, sticker.id) : undefined}
                      onClick={isAdmin ? (e) => {
                        if (isDragMode) {
                          e.stopPropagation();
                          setSelectedStickerId(sticker.id);
                        }
                      } : undefined}
                      style={{
                        left: `${sticker.position_x ?? 77}%`,
                        top: `${sticker.position_y ?? 62}%`,
                        transform: `translate(-50%, -50%) scale(${finalScale}) rotate(${sticker.rotation ?? 0}deg)`,
                        transformOrigin: 'center center',
                        width: '145px',
                        height: '145px',
                        minWidth: '145px',
                        minHeight: '145px',
                        maxWidth: '145px',
                        maxHeight: '145px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 6px 9px rgba(0,0,0,0.4))',
                        zIndex: isSelected ? 20 : 10,
                        userSelect: 'none',
                      }} 
                    />;
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
                    {bg?.background_image_url ? <img src={bg.background_image_url} alt={`Slot ${slotNum}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{
                background: templateColors[slotNum - 1]?.bgGradient || 'linear-gradient(to bottom right, #1f2937, #111827)'
              }}>
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

      {/* Sticker Control Panel - Admin Only */}
      {isAdmin && stickerImages[selectedTemplate + 1]?.length > 0 && (
        <StickerControl
          onAddSticker={handleAddSticker}
          onResizeSticker={handleResizeSticker}
          onToggleDragMode={setIsDragMode}
          onSave={handleSaveSticker}
          onReset={handleResetSticker}
          currentScale={getCurrentScale()}
          isDragMode={isDragMode}
          isSaving={isSavingSticker}
          isAdmin={true}
        />
      )}

      {/* Profile Picture Control Panel - Admin Only - Motivational Only */}
      {isAdmin && bannerData.categoryType === 'motivational' && mentorPhoto && (
        <>
          {/* Minimized State - Floating Icon */}
          {isProfileControlMinimized && (
            <button
              onClick={() => setIsProfileControlMinimized(false)}
              className="fixed bottom-6 right-6 z-40 bg-[#0f1720] rounded-full p-4 shadow-2xl border border-primary/30 hover:bg-[#1a1f2e] transition-colors"
              title="Expand Profile Controls"
            >
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}

          {/* Expanded State - Full Control Panel */}
          {!isProfileControlMinimized && (
            <div className="fixed bottom-6 right-6 z-40 bg-[#0f1720] rounded-2xl p-4 shadow-2xl border border-primary/30 w-[320px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Profile Picture</h3>
                </div>
                <button
                  onClick={() => setIsProfileControlMinimized(true)}
                  className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-secondary/30"
                  title="Minimize"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Scale Control */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-muted-foreground font-medium">Scale</label>
                    <span className="text-xs text-primary font-mono">{Math.round(profilePicScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={profilePicScale}
                    onChange={(e) => setProfilePicScale(parseFloat(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                </div>

                {/* Instructions */}
                <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-primary font-semibold">Drag</span> the profile picture to reposition it within the banner.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveProfileDefaults}
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Save Defaults
                  </Button>
                  <Button
                    onClick={() => {
                      setProfilePicPosition({ x: 0, y: 0 });
                      setProfilePicScale(1);
                      toast.success("Profile picture reset to default");
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Balance Modal - Shows when balance is zero */}
      {showBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0f1720] rounded-3xl p-8 shadow-2xl border-2 border-primary/30 w-[90%] max-w-[420px] animate-scale-in">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-foreground text-center mb-3">
              Insufficient Balance
            </h3>

            {/* Message */}
            <p className="text-muted-foreground text-center text-base mb-8 leading-relaxed">
              Please recharge your wallet to download banners.
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  setShowBalanceModal(false);
                  navigate("/wallet");
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg rounded-xl shadow-lg"
              >
                Recharge Wallet
              </Button>
              <Button
                onClick={() => setShowBalanceModal(false)}
                variant="outline"
                className="w-full border-border/50 text-muted-foreground hover:bg-secondary/30 py-6 text-base rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay - Shows during banner export */}
      {isDownloading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[86%] max-w-[420px] bg-[#0f1720] rounded-xl p-5 shadow-2xl border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              {/* Logo placeholder - replace with actual ReBusiness logo */}
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-background font-bold text-sm">RB</span>
              </div>
              <div className="flex-1">
                <div className="text-foreground font-bold text-base leading-tight">
                  ReBusiness • Creating your success banner…
                </div>
                <div className="text-muted-foreground text-sm mt-1">
                  Just a moment!
                </div>
              </div>
              {/* Spinner */}
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
            </div>
            <p className="text-muted-foreground text-xs text-center mt-3 pt-3 border-t border-border">
              Preparing your banner — this may take a few seconds.
            </p>
          </div>
        </div>
      )}
    </div>;
}