import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Sparkles, Home, CheckCircle2 } from "lucide-react";
import BannerPreviewSkeleton from "@/components/skeletons/BannerPreviewSkeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import RanksStickersPanel from "@/components/RanksStickersPanel";
import StickerControl from "@/components/StickerControl";
import SlotPreviewMini from "@/components/SlotPreviewMini";
import downloadIcon from "@/assets/download-icon.png";
import anniversaryNameplateFrame from "@/assets/anniversary-nameplate-frame.png";
// *** PROXY MODEL: Universal placeholder for preview - real photo loads only at download ***
import slotDefaultModel from "@/assets/slot-default-model.png";
import { useProfile } from "@/hooks/useProfile";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { useBannerSettings } from "@/hooks/useBannerSettings";
import { useGlobalBackgroundSlots, getSlotBackgroundStyle, BackgroundSlot } from "@/hooks/useGlobalBackgroundSlots";
import { useBannerDefaults } from "@/hooks/useBannerDefaults";
import { useUnifiedStickerSlots, mapBannerDataToStickerOptions } from "@/hooks/useUnifiedStickerSlots";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Sticker } from "@/hooks/useStickers";
import { toJpeg } from "html-to-image";
import { triggerDownload, compressToTargetRange, cleanupBannerMemory } from "@/lib/downloadUtils";
import { useWalletDeduction } from "@/hooks/useWalletDeduction";
import InsufficientBalanceModal from "@/components/InsufficientBalanceModal";
import BannerWatermarks from "@/components/BannerWatermarks";
import PremiumGlobalLoader from "@/components/PremiumGlobalLoader";

// *** LIGHTWEIGHT PROXY BACKGROUND MODE: Real background URLs with optimized loading ***
// Used in main banner preview - loads real background but optimized for mobile performance
const getProxyBackgroundStyle = (slot: BackgroundSlot | undefined): React.CSSProperties => {
  if (!slot) {
    return { backgroundColor: '#1a1a2e', backgroundImage: 'none' };
  }
  // Use real background URL with performance optimizations
  if (slot.imageUrl) {
    return {
      backgroundImage: `url(${slot.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: slot.defaultColor || '#1a1a2e', // Fallback color while loading
    };
  }
  // Fallback to default color only
  return {
    backgroundColor: slot.defaultColor || '#1a1a2e',
    backgroundImage: 'none',
  };
};
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
  categoryType?: 'rank' | 'bonanza' | 'birthday' | 'anniversary' | 'meeting' | 'festival' | 'motivational' | 'story';
  message?: string;
  tripName?: string;
  tripId?: string;
  birthdayId?: string;
  anniversaryId?: string;
  festivalId?: string;
  eventTitle?: string;
  eventDate?: string;
  eventVenue?: string;
  quote?: string;
  motivationalBannerId?: string;
  storyId?: string;
  eventId?: string;
  backgroundRemoved?: boolean;
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
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [stickerScale, setStickerScale] = useState<Record<string, number>>({});
  const [isSavingSticker, setIsSavingSticker] = useState(false);
  const [originalStickerStates, setOriginalStickerStates] = useState<Record<string, {
    position_x: number;
    position_y: number;
    scale: number;
  }>>({});

  // Profile picture control states (motivational only, admin only)
  const [profilePicPosition, setProfilePicPosition] = useState({
    x: 0,
    y: 0
  }); // Offset from default position
  const [profilePicScale, setProfilePicScale] = useState(1); // Scale multiplier (1 = 100%)
  const [isDraggingProfile, setIsDraggingProfile] = useState(false);
  const [profileDragStart, setProfileDragStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isProfileControlMinimized, setIsProfileControlMinimized] = useState(false);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);

  // Download success state - shows success screen with image preview
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [downloadedImageUrl, setDownloadedImageUrl] = useState<string | null>(null);
  
  // Download progress state - luxury progress UI
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Wallet deduction hook - admins bypass credit deduction
  const {
    checkAndDeductBalance,
    isProcessing: isProcessingWallet
  } = useWalletDeduction({
    skipDeductionForAdmin: true
  });

  // Handle profile picture drag (admin only, motivational only)
  useEffect(() => {
    if (!isDraggingProfile || !profileDragStart) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - profileDragStart.x;
      const newY = e.clientY - profileDragStart.y;

      // Boundary constraints: keep within canvas (0 to 1350px width, -675 to 675px height offset)
      const maxWidth = 1350 - 1026 * profilePicScale * 0.75; // 3:4 aspect ratio width
      const constrainedX = Math.max(0, Math.min(newX, maxWidth));
      const constrainedY = Math.max(-500, Math.min(newY, 500));
      setProfilePicPosition({
        x: constrainedX,
        y: constrainedY
      });
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

  // *** MOBILE-FIRST UNIVERSAL LAYOUT - FIXED REFERENCE WIDTH ***
  // Same visual appearance across ALL devices (mobile, tablet, desktop)
  // Banner canvas is 1350px fixed, scaled down to fit container
  const [bannerScale, setBannerScale] = useState(0);
  const bannerContainerRef = useRef<HTMLDivElement>(null);
  const scaleCalculatedRef = useRef(false);

  // RAF ref for cleanup
  const rafRef = useRef<number | null>(null);
  
  // *** MOBILE-FIRST: Calculate scale ONCE on mount ***
  // UNIVERSAL LAYOUT: Same scale logic for all devices
  // Fixed reference width (1350px) scaled to fit container perfectly
  // Ensures banner NEVER overflows - mobile appearance is universal
  const calculateInitialScale = useCallback(() => {
    if (scaleCalculatedRef.current) return; // Only calculate once
    if (!bannerContainerRef.current) return;
    
    const containerWidth = bannerContainerRef.current.clientWidth;
    if (containerWidth === 0) return;

    // UNIVERSAL FIT: Calculate scale to fit 1350px canvas into container
    // Use 96% safety margin to prevent any overflow on all devices
    const CANVAS_SIZE = 1350;
    const SAFETY_MARGIN = 0.96; // 4% margin for safety
    const availableWidth = containerWidth * SAFETY_MARGIN;
    
    // Calculate scale - same formula for all devices
    const scale = Math.min(availableWidth / CANVAS_SIZE, 1); // Never > 1
    
    // Minimum scale to prevent canvas from being too small
    const MIN_SCALE = 0.15; // ~200px minimum width
    const finalScale = Math.max(scale, MIN_SCALE);
    
    setBannerScale(finalScale);
    setIsLayoutReady(true);
    scaleCalculatedRef.current = true;
    
    console.log(`📐 Universal scale: ${(finalScale * 100).toFixed(1)}% (container: ${containerWidth}px)`);
  }, []);

  // Legacy compatibility wrapper
  const updateBannerScale = calculateInitialScale;

  // *** INSTANT SLOT SWITCHING - No re-render, only background + stickers update ***
  const handleSlotChange = useCallback((slotIndex: number) => {
    // Direct state update - React batches this efficiently
    setSelectedTemplate(slotIndex);
    // Clear sticker selection on slot change for clean experience
    setSelectedStickerId(null);
  }, []);

  // Handle Home button - SPA navigation to dashboard
  const handleGoHome = useCallback(() => {
    // Cleanup memory
    if (bannerRef.current) {
      cleanupBannerMemory(bannerRef.current);
    }
    // Revoke blob URL if exists
    if (downloadedImageUrl) {
      URL.revokeObjectURL(downloadedImageUrl);
    }
    // SPA navigation - instant, no reload
    navigate('/dashboard', { replace: true });
  }, [navigate, downloadedImageUrl]);

  // Handle back navigation - clean exit
  const handleGoBack = useCallback(() => {
    if (bannerRef.current) {
      cleanupBannerMemory(bannerRef.current);
    }
    navigate(-1);
  }, [navigate]);

  // *** MOBILE-FIRST: Calculate scale ONCE on mount - no resize listener ***
  // ResizeObserver removed for mobile stability - scale is fixed after initial calculation
  useLayoutEffect(() => {
    // CRITICAL: Skip if already calculated to prevent infinite loop
    if (scaleCalculatedRef.current) return;
    if (!bannerContainerRef.current) return;

    // Calculate scale once on mount
    calculateInitialScale();

    // Fallback: If container isn't ready, retry ONCE with RAF
    if (!scaleCalculatedRef.current && !rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        calculateInitialScale();
        rafRef.current = null;
      });
    }
    
    // Cleanup RAF on unmount
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [calculateInitialScale]);

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
  const {
    data: profileDefaults,
    refetch: refetchProfileDefaults
  } = useQuery({
    queryKey: ['motivational-profile-defaults', bannerData?.motivationalBannerId],
    queryFn: async () => {
      if (!bannerData?.motivationalBannerId) return null;
      const {
        data,
        error
      } = await supabase.from('motivational_profile_defaults').select('*').eq('motivational_banner_id', bannerData.motivationalBannerId).maybeSingle();
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
    if (!currentTemplateId && bannerData?.categoryType !== 'story') {
      console.error('❌ No templateId - backgrounds cannot be fetched. This will cause cross-contamination!');
    } else if (currentTemplateId) {
      console.log('✅ Fetching backgrounds for templateId:', currentTemplateId);
    }
  }, [currentTemplateId, bannerData?.categoryType]);

  // Use global background slots system with real-time sync and default colors
  const storyId = bannerData?.storyId || bannerData?.eventId;
  const {
    slots: globalBackgroundSlots,
    loading: backgroundsLoading
  } = useGlobalBackgroundSlots({
    templateId: bannerData?.categoryType !== 'story' && bannerData?.categoryType !== 'festival' ? currentTemplateId : undefined,
    storyId: bannerData?.categoryType === 'story' ? storyId : undefined,
    festivalId: bannerData?.categoryType === 'festival' ? bannerData?.festivalId : undefined,
    categoryType: bannerData?.categoryType
  });

  // UNIFIED STICKER SLOTS - Single source of truth for all categories
  // Maps bannerData to sticker options using the unified system
  const stickerOptions = bannerData ? mapBannerDataToStickerOptions({
    categoryType: bannerData.categoryType,
    rankId: bannerData.rankId,
    tripId: bannerData.tripId,
    birthdayId: bannerData.birthdayId,
    anniversaryId: bannerData.anniversaryId,
    motivationalBannerId: bannerData.motivationalBannerId,
    festivalId: bannerData.festivalId,
    storyId: bannerData.storyId,
    eventId: bannerData.eventId
  }) : {};
  const {
    slotsByNumber: unifiedStickerImages,
    loading: stickersLoading
  } = useUnifiedStickerSlots({
    ...stickerOptions,
    enableRealtime: true,
    activeOnly: true
  });

  // Sync unified sticker data to local state for compatibility with existing code
  useEffect(() => {
    if (unifiedStickerImages && Object.keys(unifiedStickerImages).length > 0) {
      setStickerImages(unifiedStickerImages);
    }
  }, [unifiedStickerImages]);

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
          [sticker.id]: sticker.scale || 9.3
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

  // Map selectedTemplate (0-15) to slot_number (1-16) and get background from global slots
  const selectedSlot = selectedTemplate + 1;
  const currentSlot = globalBackgroundSlots.find(slot => slot.slotNumber === selectedSlot);
  
  // *** LIGHTWEIGHT PROXY BACKGROUND: Real background URLs optimized for performance ***
  // Uses real background images in proxy mode - fast loading, mobile-first
  const backgroundStyle = getProxyBackgroundStyle(currentSlot);

  // Debug background selection
  useEffect(() => {
    console.log('🎨 REAL background selection:', {
      selectedSlot,
      categoryType: bannerData?.categoryType,
      imageUrl: currentSlot?.imageUrl || 'none',
      defaultColor: currentSlot?.defaultColor || '#1a1a2e',
      templateId: currentTemplateId,
      storyId
    });
  }, [selectedSlot, currentSlot, currentTemplateId, bannerData?.categoryType, storyId]);

  // Main banner name - ALWAYS from user input in form (bannerData.name)
  const mainBannerName: string = bannerData?.name || "";
  const MAX_NAME_LENGTH = 20;
  const truncatedMainName = mainBannerName.length > MAX_NAME_LENGTH ? mainBannerName.slice(0, MAX_NAME_LENGTH) + "..." : mainBannerName;

  // Bottom profile name - ALWAYS from user profile (never changes)
  const profileName: string = profile?.name || "";
  const truncatedProfileName = profileName.length > MAX_NAME_LENGTH ? profileName.slice(0, MAX_NAME_LENGTH) + "..." : profileName;

  // Display contact - auto-load from user profile
  const displayContact: string = profile?.mobile || profile?.whatsapp || "";

  // Display rank - auto-load from user profile
  const displayRank: string = (profile?.rank || "").replace(/[-–—]/g, ' ');

  // Display uplines - use bannerData.uplines if provided, otherwise fall back to user's saved banner settings
  const displayUplines: Upline[] = bannerData?.uplines && bannerData.uplines.length > 0 ? bannerData.uplines : (bannerSettings?.upline_avatars || []).map((u, idx) => ({
    id: `settings-${idx}`,
    name: u.name || '',
    avatar: u.avatar_url || ''
  }));

  // Get primary profile photo - prioritize uploaded photo from banner creation for LEFT side
  // FESTIVAL, MOTIVATIONAL & STORY CATEGORIES: Skip auto-loading achiever image completely
  const primaryPhoto: string | null = bannerData?.categoryType === 'festival' || bannerData?.categoryType === 'motivational' || bannerData?.categoryType === 'story' ? bannerData?.photo || null : bannerData?.photo || profile?.profile_photo || profilePhotos[0]?.photo_url || null;

  // Get mentor/upline photo (RIGHT-BOTTOM) - ONLY use profile photos, never uploads
  const mentorPhoto: string | null = profilePhotos[selectedMentorPhotoIndex]?.photo_url || profilePhotos[0]?.photo_url || profile?.profile_photo || null;

  // Fetch selected stickers - removed, now using slotStickers structure
  // Each slot has its own stickers independently

  // *** PURE PROXY MODE: No asset preloading - preview uses proxy assets only ***
  // Real assets load ONLY at download time for instant preview performance
  
  // *** MOBILE-FIRST FIXED CANVAS ARCHITECTURE ***
  // Static layers load once, never re-render - critical for mobile stability
  const [staticLayersReady, setStaticLayersReady] = useState(false);
  const hasInitializedRef = useRef(false);
  
  // *** PREVIEW LOCKED STATE - Prevents ALL re-renders after first load ***
  // Once locked, the preview is in read-only mode - no data refetch, no re-computation
  const [isPreviewLocked, setIsPreviewLocked] = useState(false);
  const previewLockedRef = useRef(false); // Ref for sync checks

  // Check if all required data is loaded
  const isDataReady = userId !== null && profile !== undefined && !backgroundsLoading && bannerDefaults !== undefined;

  // *** PURE PROXY MODE: Instant ready - no asset preloading needed ***
  const isBannerReady = useMemo(() => {
    // If preview is locked, always return true (no more loading)
    if (previewLockedRef.current) return true;
    
    const scaleReady = bannerScale > 0 && isLayoutReady;
    const dataReady = isDataReady && !backgroundsLoading && !stickersLoading;
    // PROXY MODE: No asset loading required - instant display
    return scaleReady && dataReady;
  }, [bannerScale, isLayoutReady, isDataReady, backgroundsLoading, stickersLoading]);

  // *** STATIC LAYER MEMOIZATION - Load once, never re-render ***
  // These values are captured on first load and FROZEN - critical for mobile stability
  const staticLayers = useMemo(() => {
    // CRITICAL: Only compute once when data is ready, then freeze
    if (!isDataReady || !profile) return null;
    if (hasInitializedRef.current) return null; // Already initialized, skip re-computation
    
    return {
      // User photo - locked on init
      primaryPhoto: bannerData?.categoryType === 'festival' || bannerData?.categoryType === 'motivational' || bannerData?.categoryType === 'story' 
        ? bannerData?.photo || null 
        : bannerData?.photo || profile?.profile_photo || profilePhotos[0]?.photo_url || null,
      // Mentor photo - locked on init  
      mentorPhoto: profilePhotos[selectedMentorPhotoIndex]?.photo_url || profilePhotos[0]?.photo_url || profile?.profile_photo || null,
      // Uplines - locked on init
      uplines: bannerData?.uplines && bannerData.uplines.length > 0 
        ? bannerData.uplines 
        : (bannerSettings?.upline_avatars || []).map((u, idx) => ({
            id: `settings-${idx}`,
            name: u.name || '',
            avatar: u.avatar_url || ''
          })),
      // Logos - locked on init
      logoLeft: bannerSettings?.logo_left,
      logoRight: bannerSettings?.logo_right,
      congratsImage: bannerDefaults?.congratulations_image,
      // Text content - locked on init
      mainName: bannerData?.name || "",
      teamCity: bannerData?.teamCity || "",
      chequeAmount: bannerData?.chequeAmount || "",
      profileName: profile?.name || "",
      profileRank: (profile?.rank || "").replace(/[-–—]/g, ' '),
      displayContact: profile?.mobile || profile?.whatsapp || "",
      message: bannerData?.message || "",
      quote: bannerData?.quote || "",
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDataReady]); // INTENTIONALLY minimal deps - compute once only

  // *** AUTO-SELECT FIRST SLOT + LOCK PREVIEW - ONE TIME ONLY ***
  useEffect(() => {
    if (isBannerReady && !hasInitializedRef.current && globalBackgroundSlots.length > 0) {
      // CRITICAL: Mark as initialized IMMEDIATELY to prevent re-runs
      hasInitializedRef.current = true;
      previewLockedRef.current = true; // Lock preview sync
      setStaticLayersReady(true);
      setIsPreviewLocked(true); // Lock preview state
      
      // Auto-select slot 1 (index 0) on first load - instant, no animation
      setSelectedTemplate(0);
      
      console.log('🔒 Banner LOCKED - no more re-renders, stable preview mode activated');
    }
  }, [isBannerReady, globalBackgroundSlots.length]);

  // *** PURE PROXY MODE: Asset config removed - no preloading needed ***
  // Real assets load ONLY at download time for instant preview performance

  // Trigger scale update immediately on mount
  // Using useLayoutEffect ensures scale is applied before browser paint - no flicker
  useLayoutEffect(() => {
    // Calculate scale immediately for layout readiness
    updateBannerScale();
  }, [updateBannerScale]);

  // NOTE: Duplicate ResizeObserver removed - already handled above with RAF debouncing
  if (!bannerData) {
    navigate("/rank-selection");
    return null;
  }

  // *** PURE PROXY MODE: Minimal loading - instant display ***
  // No asset preloading needed - preview uses proxy assets only
  if (!isBannerReady) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Minimal loading indicator - no heavy animations */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              Loading Banner
            </h2>
            <p className="text-xs text-muted-foreground">
              Preparing preview...
            </p>
          </div>
          
          {/* Hidden container for scale calculation - MUST be in DOM with proper width */}
          <div 
            ref={bannerContainerRef} 
            className="fixed left-0 top-0 w-[calc(100vw-32px)] max-w-[500px] aspect-square opacity-0 pointer-events-none"
            style={{ zIndex: -1 }}
          />
        </div>
      </div>
    );
  }

  // Category-specific content render function
  const renderCategoryContent = () => {
    const category = bannerData.categoryType || 'rank';
    switch (category) {
      case 'bonanza':
        return <>
            {/* Congratulations Image */}
            {bannerDefaults?.congratulations_image && <div className="absolute z-20" style={{
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
              </div>}


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
              {bannerData.teamCity && <p style={{
              marginTop: '13px',
              color: '#ffffff',
              textAlign: 'center',
              fontSize: '28px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
            }}>
                  {bannerData.teamCity.toUpperCase()}
                </p>}
            </div>
          </>;
      case 'birthday':
        return <>

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
            {bannerData.message && <div className="absolute" style={{
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
              </div>}
          </>;
      case 'anniversary':
        return <>


            {/* Royal Nameplate Container - Fixed Size, Moved Down 12% */}
            <div className="absolute z-30" style={{
            top: '52%',
            left: '978px',
            transform: 'translate(-50%, -50%)',
            width: '696px',
            height: '336px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
              {/* Layer 1: Ornate Frame Background (Fixed Size - 20% larger) */}
              <img src={anniversaryNameplateFrame} alt="Royal Frame" style={{
              width: '696px',
              height: '336px',
              position: 'absolute',
              top: 0,
              left: 0,
              objectFit: 'contain',
              pointerEvents: 'none',
              zIndex: 1
            }} />
              
              {/* Layer 2: Grouped Text Content (Name + Team) - Centered with equal padding */}
              <div style={{
              position: 'relative',
              zIndex: 10,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              height: '100%',
              padding: '40px'
            }}>
                
                {/* Achiever Name - Centered, Auto-scaling (Max 20 chars), moved 5% down */}
                <h2 style={{
                color: '#ffffff',
                fontSize: truncatedMainName.length > 15 ? '30px' : truncatedMainName.length > 10 ? '36px' : '42px',
                fontWeight: '700',
                textShadow: '3px 3px 10px rgba(0,0,0,0.9)',
                margin: 0,
                marginTop: '5%',
                letterSpacing: '2px',
                fontFamily: "'Playfair Display', 'Georgia', serif",
                maxWidth: '480px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}>
                  {truncatedMainName.length > 20 ? truncatedMainName.substring(0, 20).toUpperCase() : truncatedMainName.toUpperCase()}
                </h2>

                {/* Team Name / Tagline - Hidden for anniversary */}
              </div>
            </div>

            {/* Anniversary Message */}
            {bannerData.message && <div className="absolute" style={{
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
              </div>}
          </>;
      case 'meeting':
        return <>
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
              {bannerData.eventDate && <p style={{
              color: '#ffffff',
              textAlign: 'center',
              fontSize: '26px',
              textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
              margin: '8px 0'
            }}>
                  📆 {bannerData.eventDate}
                </p>}
              {bannerData.eventVenue && <p style={{
              color: '#ffffff',
              textAlign: 'center',
              fontSize: '24px',
              textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
              margin: '8px 0'
            }}>
                  📍 {bannerData.eventVenue}
                </p>}
            </div>
          </>;
      case 'festival':
        return <>

            {/* Name - Only show if name exists */}
            {truncatedMainName && <div className="absolute" style={{
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
                {bannerData.teamCity && <p style={{
              marginTop: '13px',
              color: '#ffffff',
              textAlign: 'center',
              fontSize: '28px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
            }}>
                    {bannerData.teamCity.toUpperCase()}
                  </p>}
              </div>}

            {/* Festival Message */}
            {bannerData.message && <div className="absolute" style={{
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
              </div>}
          </>;
      case 'motivational':
        return <>
            {/* Motivational Icon */}
            

            {/* Motivational Title */}
            <div className="absolute z-20" style={{
            top: '270px',
            left: '978px',
            transform: 'translateX(-50%)',
            width: '648px',
            textAlign: 'center'
          }}>
              
            </div>

            {/* Quote/Message */}
            {bannerData.quote && <div className="absolute" style={{
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
              </div>}

            {/* Name Attribution - Only show if name exists */}
            {truncatedMainName && <div className="absolute" style={{
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
              </div>}
          </>;
      case 'story':
        // Story category - NO congratulation sticker, NO achiever name, NO team name
        return <></>;
      default:
        // 'rank' category - Bonanza layout applied
        return <>
            {/* Congratulations Image */}
            {bannerDefaults?.congratulations_image && <div className="absolute z-20" style={{
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
              </div>}

            {/* Rank Achievement Title - Removed */}

            {/* Nameplate Border behind Achiever Name */}
            <div className="absolute z-20" style={{
            top: '205px',
            left: '978px',
            transform: 'translateX(-50%)',
            width: '2769px',
            height: '346px'
          }}>
              <img src="/assets/nameplate-border.png" alt="Nameplate Border" style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
            }} className="object-contain" />
            </div>

            {/* Achiever Name */}
            <div className="absolute z-30" style={{
            top: '340px',
            left: '978px',
            transform: 'translateX(-50%)',
            width: '648px',
            height: '81px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 50px'
          }}>
              <h2 style={{
              color: '#ffffff',
              textAlign: 'center',
              fontSize: truncatedMainName.length > 18 ? '36px' : truncatedMainName.length > 14 ? '42px' : truncatedMainName.length > 10 ? '48px' : '54px',
              fontWeight: '700',
              textShadow: '3px 3px 10px rgba(0,0,0,0.9)',
              letterSpacing: '1px',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              lineHeight: 1
            }}>
                {truncatedMainName.toUpperCase()}
              </h2>
            </div>

            {/* Team Name */}
            <div className="absolute" style={{
            top: '423px',
            left: '978px',
            transform: 'translateX(-50%)',
            width: '648px',
            padding: '0 27px'
          }}>
              {bannerData.teamCity && <p style={{
              marginTop: '13px',
              color: '#ffffff',
              textAlign: 'center',
              fontSize: '28px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
            }}>
                  {bannerData.teamCity.toUpperCase()}
                </p>}
            </div>

            {/* Income Section */}
            {bannerData.chequeAmount && <div className="absolute" style={{
            bottom: '164px', /* Moved down 10% (was 182px) */
            left: '62px', /* Moved left 8% (was 67px) */
            width: '743px',
            minWidth: '743px',
            maxWidth: '743px'
          }}>
                <p style={{
              fontSize: '32px', /* Reduced by 10% (was 36px) */
              textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
              color: '#ffffff',
              fontWeight: '500',
              letterSpacing: '1px',
              textAlign: 'left',
              margin: 0,
              marginBottom: '25px' /* Adjusted for new spacing */
            }}>
                  THIS WEEK INCOME 
                </p>
                {/* Premium Amount with Sparkle Effect */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <p style={{
                fontSize: (() => {
                  const amount = Number(bannerData.chequeAmount);
                  const formattedLength = amount.toLocaleString('en-IN').length;
                  // Start at 4XL (72px) scaled up by 35%, and scale down based on digit count
                  if (formattedLength <= 5) return 'clamp(65px, 10.8vw, 97px)';     // Up to 9,999
                  if (formattedLength <= 7) return 'clamp(57px, 9.5vw, 86px)';      // Up to 9,99,999
                  if (formattedLength <= 9) return 'clamp(49px, 8.1vw, 76px)';      // Up to 9,99,99,999
                  if (formattedLength <= 12) return 'clamp(41px, 6.8vw, 65px)';     // Up to 9,99,99,99,999
                  return 'clamp(32px, 5.4vw, 54px)';                                 // Larger amounts
                })(),
                width: 'fit-content',
                maxWidth: Number(bannerData.chequeAmount) <= 1000000000 ? 'auto' : '540px',
                lineHeight: '1',
                fontWeight: '800', /* Increased weight */
                letterSpacing: '2px',
                textAlign: 'center',
                margin: 0,
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontStyle: 'normal',
                background: 'linear-gradient(90deg, #FFD700 0%, #FFF8DC 35%, #FFD700 50%, #FFFACD 70%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 4px 8px rgba(255,215,0,0.3))',
                whiteSpace: 'nowrap',
                transform: 'scale(1) translateX(-8%)',
                transformOrigin: 'center center'
              }} className="font-extrabold">
                    ₹{Number(bannerData.chequeAmount).toLocaleString('en-IN')}/-
                  </p>
                  {/* Sparkle/Glitter Effects */}
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-12px',
                    width: '24px',
                    height: '24px',
                    background: 'radial-gradient(circle, #FFFFFF 0%, #FFD700 40%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'sparkle 1.5s ease-in-out infinite',
                    opacity: 0.9
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '15%',
                    right: '5%',
                    width: '16px',
                    height: '16px',
                    background: 'radial-gradient(circle, #FFFFFF 0%, #FFF8DC 40%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'sparkle 2s ease-in-out infinite 0.3s',
                    opacity: 0.8
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '15%',
                    width: '12px',
                    height: '12px',
                    background: 'radial-gradient(circle, #FFFFFF 0%, #FFD700 40%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'sparkle 1.8s ease-in-out infinite 0.6s',
                    opacity: 0.7
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '40%',
                    right: '-5px',
                    width: '10px',
                    height: '10px',
                    background: 'radial-gradient(circle, #FFFFFF 0%, #FFFACD 40%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'sparkle 2.2s ease-in-out infinite 0.9s',
                    opacity: 0.85
                  }} />
                </div>
              </div>}
          </>;
    }
  };

  // Handle sticker dragging - Admin only
  const handleStickerMouseDown = (e: React.MouseEvent, stickerId: string) => {
    if (!isAdmin || !isDragMode) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedStickerId(stickerId);
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
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
      const newImages = {
        ...prev
      };
      Object.keys(newImages).forEach(slot => {
        newImages[parseInt(slot)] = newImages[parseInt(slot)].map(sticker => {
          if (sticker.id === selectedStickerId) {
            const currentX = (sticker.position_x ?? 77) / 100 * 1350;
            const currentY = (sticker.position_y ?? 62) / 100 * 1350;
            const newX = Math.max(0, Math.min(1350, currentX + deltaX));
            const newY = Math.max(0, Math.min(1350, currentY + deltaY));
            return {
              ...sticker,
              position_x: newX / 1350 * 100,
              position_y: newY / 1350 * 100
            };
          }
          return sticker;
        });
      });
      return newImages;
    });
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
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
        setStickerScale(prev => ({
          ...prev,
          [sticker.id]: scale
        }));
      });
    } else {
      setStickerScale(prev => ({
        ...prev,
        [selectedStickerId]: scale
      }));
    }
  };
  const handleSaveSticker = async () => {
    if (!selectedStickerId) {
      toast.error("Please select a sticker first");
      return;
    }
    const currentSlot = selectedTemplate + 1;
    const stickersInSlot = stickerImages[currentSlot] || [];
    const selectedSticker = stickersInSlot.find(s => s.id === selectedStickerId);
    if (!selectedSticker) {
      toast.error("Sticker not found");
      return;
    }
    setIsSavingSticker(true);
    try {
      // Only update transform properties (position, scale, rotation) - don't update slot_number or banner_category
      // as those are already set and updating them can cause unique constraint violations
      const {
        data,
        error
      } = await supabase.from("stickers").update({
        position_x: selectedSticker.position_x ?? 50,
        position_y: selectedSticker.position_y ?? 50,
        scale: stickerScale[selectedStickerId] ?? 2.5,
        rotation: selectedSticker.rotation ?? 0,
        updated_at: new Date().toISOString()
      }).eq("id", selectedStickerId).select('*').single();
      if (error) throw error;
      console.log('✅ Sticker saved successfully:', data);

      // Store current state as original after successful save
      setOriginalStickerStates(prev => ({
        ...prev,
        [selectedStickerId]: {
          position_x: selectedSticker.position_x ?? 50,
          position_y: selectedSticker.position_y ?? 50,
          scale: stickerScale[selectedStickerId] ?? 2.5
        }
      }));

      // Update local state with saved data (will also trigger via realtime)
      setStickerImages(prev => ({
        ...prev,
        [currentSlot]: (prev[currentSlot] || []).map(sticker => sticker.id === selectedStickerId ? {
          ...sticker,
          position_x: data.position_x,
          position_y: data.position_y,
          scale: data.scale,
          rotation: data.rotation
        } : sticker)
      }));
      toast.success("Sticker settings saved! Changes synced to all users.");
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
            position_y: originalState.position_y
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
      const { error } = await supabase.from('motivational_profile_defaults').upsert({
        motivational_banner_id: bannerData.motivationalBannerId,
        profile_position_x: profilePicPosition.x,
        profile_position_y: profilePicPosition.y,
        profile_scale: profilePicScale
      }, {
        onConflict: 'motivational_banner_id'
      });
      if (error) throw error;
      toast.dismiss(savingToast);
      toast.success("Profile picture defaults saved!");
      refetchProfileDefaults();
    } catch (error) {
      console.error("Error saving profile defaults:", error);
      toast.dismiss(savingToast);
      toast.error("Failed to save profile defaults");
    }
  };

  // *** DOWNLOAD WITH REAL ASSETS - Loads real images only at download time ***
  const handleDownload = async () => {
    if (!bannerRef.current || !userId || isDownloading) return;

    const categoryName = bannerData?.categoryType 
      ? bannerData.categoryType.charAt(0).toUpperCase() + bannerData.categoryType.slice(1) 
      : bannerData?.rankName || "Banner";

    // Quick balance check (non-admins only)
    if (!isAdmin) {
      const { data: credits } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .single();
      if ((credits?.balance || 0) < 10) {
        setShowInsufficientBalanceModal(true);
        return;
      }
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      // Phase 1: Load real assets (0-30%)
      setDownloadProgress(5);
      
      // Get real background URL for current slot
      const realBackgroundUrl = currentSlot?.imageUrl || null;
      const realPrimaryPhoto = primaryPhoto;
      const realMentorPhoto = mentorPhoto;
      
      // Preload real assets before rendering
      const assetsToPreload: string[] = [];
      if (realBackgroundUrl) assetsToPreload.push(realBackgroundUrl);
      if (realPrimaryPhoto) assetsToPreload.push(realPrimaryPhoto);
      if (realMentorPhoto) assetsToPreload.push(realMentorPhoto);
      
      // Preload upline avatars
      displayUplines.forEach(u => {
        if (u.avatar) assetsToPreload.push(u.avatar);
      });
      
      setDownloadProgress(10);
      
      // Load all assets in parallel
      await Promise.all(assetsToPreload.map(url => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continue even if image fails
          img.src = url;
        });
      }));
      
      setDownloadProgress(30);
      
      // Phase 2: Temporarily swap proxy to real assets in DOM
      const bannerElement = bannerRef.current;
      const FIXED_SIZE = 1350;
      
      // Store original values
      const originalTransform = bannerElement.style.transform;
      const originalWidth = bannerElement.style.width;
      const originalHeight = bannerElement.style.height;
      
      // Find and update background layer with real image
      const bgLayer = bannerElement.querySelector('.banner-dynamic-layer') as HTMLElement;
      const originalBgStyle = bgLayer?.style.cssText || '';
      if (bgLayer && realBackgroundUrl) {
        bgLayer.style.backgroundImage = `url(${realBackgroundUrl})`;
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
      }
      
      // Find and update all proxy images with real photos
      const proxyImages = bannerElement.querySelectorAll('img[alt="Preview Model"]') as NodeListOf<HTMLImageElement>;
      const originalProxySrcs: string[] = [];
      
      proxyImages.forEach((img, index) => {
        originalProxySrcs.push(img.src);
        // Use real photo based on position - achiever photo for left, mentor for bottom-right
        if (index === 0 && realPrimaryPhoto) {
          img.src = realPrimaryPhoto;
        } else if (realMentorPhoto) {
          img.src = realMentorPhoto;
        }
      });
      
      // Update upline avatar images with real photos
      const uplineImages = bannerElement.querySelectorAll('div[style*="borderRadius: 60px"] img') as NodeListOf<HTMLImageElement>;
      const originalUplineSrcs: string[] = [];
      
      uplineImages.forEach((img, index) => {
        originalUplineSrcs.push(img.src);
        if (displayUplines[index]?.avatar) {
          img.src = displayUplines[index].avatar;
        }
      });
      
      setDownloadProgress(40);
      
      // Wait for images to load in DOM
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Phase 3: Render with real assets (40-60%)
      setDownloadProgress(50);
      bannerElement.style.transform = 'scale(1)';
      bannerElement.style.width = `${FIXED_SIZE}px`;
      bannerElement.style.height = `${FIXED_SIZE}px`;

      const dataUrl = await toJpeg(bannerElement, {
        cacheBust: true,
        width: FIXED_SIZE,
        height: FIXED_SIZE,
        canvasWidth: FIXED_SIZE,
        canvasHeight: FIXED_SIZE,
        pixelRatio: 1.5,
        quality: 0.92,
        backgroundColor: '#000000',
        filter: node => {
          if (node.classList?.contains("slot-selector") || 
              node.classList?.contains("control-buttons") || 
              node.classList?.contains("whatsapp-float") || 
              node.id === "ignore-download" || 
              node.id === "brand-watermark-preview" || 
              node.id === "mobile-watermark-permanent") {
            return false;
          }
          return true;
        }
      });

      setDownloadProgress(60);
      
      // Phase 4: Restore proxy assets immediately after render
      bannerElement.style.transform = originalTransform;
      bannerElement.style.width = originalWidth;
      bannerElement.style.height = originalHeight;
      
      // Restore background to proxy
      if (bgLayer) {
        bgLayer.style.cssText = originalBgStyle;
      }
      
      // Restore proxy images
      proxyImages.forEach((img, index) => {
        if (originalProxySrcs[index]) {
          img.src = originalProxySrcs[index];
        }
      });
      
      // Restore upline proxy images
      uplineImages.forEach((img, index) => {
        if (originalUplineSrcs[index]) {
          img.src = originalUplineSrcs[index];
        }
      });

      // Phase 5: Processing wallet (60-75%)
      setDownloadProgress(70);
      const templateId = currentTemplateId || bannerData?.templateId;
      const { success, insufficientBalance } = await checkAndDeductBalance(
        userId, categoryName, dataUrl, templateId, isAdmin
      );

      if (insufficientBalance) {
        setShowInsufficientBalanceModal(true);
        setIsDownloading(false);
        setDownloadProgress(0);
        return;
      }

      if (!success) {
        setIsDownloading(false);
        setDownloadProgress(0);
        return;
      }

      // Phase 6: Compressing (75-90%)
      setDownloadProgress(80);
      const timestamp = new Date().getTime();
      const filename = `ReBusiness-Banner-${categoryName}-${timestamp}.jpg`;
      const { blob } = await compressToTargetRange(dataUrl, 2, 5, 0.92);
      
      // Phase 7: Downloading (90-100%)
      setDownloadProgress(95);
      await triggerDownload(blob, filename);
      setDownloadProgress(100);

      // Store downloaded image for preview and show success screen
      setDownloadedImageUrl(dataUrl);
      setDownloadComplete(true);

      setTimeout(() => cleanupBannerMemory(bannerRef.current), 500);

    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed");
      setDownloadProgress(0);
    } finally {
      setIsDownloading(false);
    }
  };

  // *** DOWNLOAD SUCCESS SCREEN - Clean, Premium, Mobile-First ***
  if (downloadComplete && downloadedImageUrl) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Success Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </div>
          
          {/* Success Message */}
          <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
            Download Successful
          </h1>
          <p className="text-muted-foreground text-sm mb-8 text-center">
            Your banner has been saved to your device
          </p>
          
          {/* Downloaded Image Preview */}
          <div className="w-full max-w-[320px] mx-auto mb-10">
            <div className="relative rounded-2xl overflow-hidden border-4 border-primary/50 shadow-[0_8px_32px_rgba(255,215,0,0.15)]">
              <img 
                src={downloadedImageUrl} 
                alt="Downloaded Banner" 
                className="w-full aspect-square object-cover"
              />
            </div>
          </div>
          
          {/* Premium Home Button */}
          <button
            onClick={handleGoHome}
            className="group relative px-10 py-4 rounded-2xl font-semibold text-lg overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #F4A100 50%, #FFD700 100%)',
              boxShadow: '0 8px 32px rgba(255, 215, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            }}
          >
            {/* Inner glow effect */}
            <span 
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100"
              style={{
                background: 'linear-gradient(135deg, #FFE55C 0%, #FFD700 100%)',
                transition: 'opacity 0.2s ease',
              }}
            />
            {/* Button content */}
            <span className="relative flex items-center gap-3 text-[#0B0E15]">
              <Home className="w-5 h-5" strokeWidth={2.5} />
              <span>Go to Dashboard</span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  // *** BANNER IS NOW READY - Render instantly without animations ***
  return <div className="h-screen overflow-hidden bg-background flex flex-col">
      {/* Header - Fixed */}
      <header className="bg-background/95 backdrop-blur-sm z-40 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-[600px] mx-auto">
          {/* Back button: SPA navigation - instant, no page reload */}
          <button 
            onClick={handleGoBack} 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 border-foreground flex items-center justify-center hover:bg-foreground/10 touch-target"
            style={{ transition: 'none' }}
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
          </button>
          
          <h1 className="text-base sm:text-xl md:text-2xl font-bold text-foreground tracking-widest">BANNER PREVIEW</h1>
          
          {isAdmin && <button onClick={() => setIsStickersOpen(true)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 border-primary bg-primary/10 flex items-center justify-center hover:bg-primary/20 touch-target" style={{ transition: 'none' }}>
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </button>}
          {!isAdmin && <div className="w-10 h-10 sm:w-12 sm:h-12" />}
        </div>
      </header>

      {/* *** DOWNLOAD PROGRESS OVERLAY - Luxury Style *** */}
      {isDownloading && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-xs px-6">
            {/* Premium Progress Container */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4 border border-primary/30 shadow-[0_0_30px_rgba(255,215,0,0.15)]">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">
                Processing Banner
              </h2>
              <p className="text-xs text-muted-foreground">
                {downloadProgress < 30 ? 'Preparing...' : 
                 downloadProgress < 60 ? 'Rendering...' : 
                 downloadProgress < 85 ? 'Compressing...' : 
                 'Saving...'}
              </p>
            </div>
            
            {/* Luxury Progress Bar */}
            <div className="relative w-full h-3 bg-muted/50 rounded-full overflow-hidden border border-primary/20 shadow-inner">
              <div 
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-yellow-400 to-primary"
                style={{
                  width: `${downloadProgress}%`,
                  transition: 'width 0.15s ease-out',
                  boxShadow: '0 0 12px rgba(255, 215, 0, 0.5)'
                }}
              />
            </div>
            
            {/* Percentage Display */}
            <p className="text-center mt-3 text-lg font-bold text-primary">
              {Math.round(downloadProgress)}%
            </p>
          </div>
        </div>
      )}

      {/* *** MOBILE-FIRST UNIVERSAL BANNER CONTAINER ***
          - Same visual on ALL devices (mobile, tablet, desktop)
          - Fixed reference width (1350px) scaled to fit
          - Never overflows, never flickers, never re-renders */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 bg-background overflow-hidden">
        {/* Universal wrapper - consistent max-width for all screens */}
        <div className="relative w-full max-w-[500px] mx-auto overflow-hidden">
          {/* Gold border container - premium frame */}
          <div className="border-4 border-primary rounded-2xl shadow-2xl overflow-hidden banner-preview-frame">
            {/* Aspect ratio container - maintains 1:1 ratio universally */}
            <div ref={bannerContainerRef} className="w-full aspect-square relative overflow-hidden flex items-center justify-center bg-background/50">
              {/* *** MOBILE-FIRST UNIVERSAL CANVAS ***
                  - FIXED 1350x1350px canvas scaled to fit container
                  - GPU-safe transforms for all devices
                  - Same visual appearance on mobile, tablet, desktop
                  - Static layers load once, dynamic layers switch instantly */}
              <div 
                className="banner-scale-container" 
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '1350px',
                  height: '1350px',
                  // GPU-safe transform - universal scaling
                  transform: `translate(-50%, -50%) scale(${bannerScale})`,
                  transformOrigin: 'center center',
                  // Mobile-safe rendering
                  imageRendering: 'auto',
                  willChange: 'auto',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  WebkitFontSmoothing: 'antialiased',
                  // Strict containment - no overflow
                  overflow: 'hidden',
                  contain: 'strict',
                }}
              >
                <div ref={bannerRef} id="banner-canvas" onMouseMove={isAdmin ? handleStickerMouseMove : undefined} onMouseUp={isAdmin ? handleStickerMouseUp : undefined} onMouseLeave={isAdmin ? handleStickerMouseUp : undefined} style={{
                position: 'relative',
                width: '1350px',
                height: '1350px',
                background: templateColors[selectedTemplate].bgGradient,
                overflow: 'hidden',
                cursor: isAdmin && isDragMode ? 'crosshair' : 'default',
                transition: 'none'
              }}>
              {/* *** LAYER 1: DYNAMIC BACKGROUND - Updates on slot change ONLY *** */}
              {/* GPU-accelerated with blur overlay for non-story banners */}
              <div 
                className="absolute inset-0 banner-dynamic-layer" 
                style={{
                  ...backgroundStyle,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: !['story', 'festival'].includes(bannerData.categoryType || '') ? 'scale(1.05) translateZ(0)' : 'translateZ(0)',
                  // Blur ONLY for non-story/non-festival banners - creates depth effect
                  ...(!['story', 'festival'].includes(bannerData.categoryType || '') ? {
                    filter: 'blur(6px)',
                  } : {}),
                }}
              />

              {/* Dark Transparent Blur Overlay - Creates premium depth effect */}
              {/* Always visible for non-story banners - restored from previous version */}
              {!['story', 'festival'].includes(bannerData.categoryType || '') && (
                <div 
                  className="absolute inset-0 pointer-events-none banner-overlay-layer"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.4))',
                    zIndex: 1,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                />
              )}

              {/* *** LAYER 2: STATIC CONTENT - Loads once, never re-renders on slot change *** */}
              {/* User photo, nameplate, logos, uplines, text - all memoized */}
              <div className="absolute inset-0 banner-static-layer" style={{ zIndex: 2 }}>

                {/* Story Category: Three Dark-Theme Upper Bars */}
                {bannerData.categoryType === 'story' && <>
                    {/* Upper Bar 1 - Top */}
                    <div className="absolute z-10" style={{
                      top: '40px',
                      left: 0,
                      right: 0,
                      height: '50px'
                    }}>
                      
                      
                      
                    </div>

                    {/* Upper Bar 2 - Mid */}
                    <div className="absolute z-10" style={{
                      top: '110px',
                      left: 0,
                      right: 0,
                      height: '50px'
                    }}>
                      
                      
                      
                    </div>

                    {/* Upper Bar 3 - Lower */}
                    
                  </>}

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

                {/* Top - Upline avatars - FIXED SIZE AND POSITION - Auto-loaded from profile settings */}
                {/* *** REAL DATA MODE: Show real upline avatars in main preview *** */}
                <div className="absolute z-20" style={{
                    top: '10px',
                    left: '675px',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '12px'
                  }}>
                  {displayUplines?.slice(0, 5).map((upline, idx) => <div key={upline.id} style={{
                      width: '120px',
                      height: '120px',
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
                      <img src={upline.avatar || slotDefaultModel} alt={upline.name} style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'cover',
                        imageRendering: 'crisp-edges',
                        border: 'none',
                        outline: 'none',
                        WebkitBackfaceVisibility: 'hidden',
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)',
                        WebkitFontSmoothing: 'antialiased'
                      }} />
                    </div>)}
                </div>

                {/* LEFT - Main User Photo - FIXED SIZE AND POSITION - 3:4 RATIO - REDUCED BY 12% */}
                {/* *** REAL DATA MODE: Show real achiever photo in main preview *** */}
                {/* Real photo shown for categories that need person/image (excludes story, festival, motivational) */}
                {(bannerData.categoryType === 'rank' || bannerData.categoryType === 'bonanza' || bannerData.categoryType === 'birthday' || bannerData.categoryType === 'anniversary' || bannerData.categoryType === 'meeting') && (
                  <div className="absolute overflow-hidden" style={{
                    left: '40px',
                    top: '162px',
                    width: '594px',
                    height: '792px',
                    minWidth: '594px',
                    minHeight: '792px',
                    maxWidth: '594px',
                    maxHeight: '792px',
                    borderRadius: '24px',
                    border: 'none'
                  }}>
                    <img src={primaryPhoto || slotDefaultModel} alt="Achiever Photo" style={{
                      width: '594px',
                      height: '792px',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      imageRendering: 'crisp-edges',
                      border: 'none',
                      outline: 'none',
                      WebkitBackfaceVisibility: 'hidden',
                      backfaceVisibility: 'hidden',
                      transform: `translateZ(0)${isPhotoFlipped ? ' scaleX(-1)' : ''}`,
                      WebkitFontSmoothing: 'antialiased'
                    }} onClick={() => setIsPhotoFlipped(!isPhotoFlipped)} />
                  </div>
                )}

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
                    ...(bannerData.categoryType === 'motivational' ? {
                      right: '27px',
                      textAlign: 'right' as const
                    } : {
                      left: '27px'
                    }),
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
                {/* *** PROXY MODE: Motivational category keeps original behavior - uses real mentor photo *** */}
                {mentorPhoto && bannerData.categoryType === 'motivational' && <div className="absolute overflow-hidden transition-transform duration-500 ease-in-out" onClick={() => !isDraggingProfile && setIsMentorPhotoFlipped(!isMentorPhotoFlipped)} onMouseDown={e => {
                    if (isAdmin) {
                      e.stopPropagation();
                      setIsDraggingProfile(true);
                      setProfileDragStart({
                        x: e.clientX - profilePicPosition.x,
                        y: e.clientY - profilePicPosition.y
                      });
                    }
                  }} style={{
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
                      pointerEvents: 'none',
                      imageRendering: 'crisp-edges',
                      border: 'none',
                      outline: 'none',
                      WebkitBackfaceVisibility: 'hidden',
                      backfaceVisibility: 'hidden',
                      transform: 'translateZ(0)',
                      WebkitFontSmoothing: 'antialiased'
                    }} />
                  </div>}

                {/* BOTTOM RIGHT - Mentor Photo - FIXED SIZE AND POSITION - SQUARE 1:1 RATIO - All Categories including Story */}
                {/* *** REAL DATA MODE: Show real mentor/user photo in main preview *** */}
                {(bannerData.categoryType === 'rank' || bannerData.categoryType === 'bonanza' || bannerData.categoryType === 'birthday' || bannerData.categoryType === 'anniversary' || bannerData.categoryType === 'meeting') && (
                  <div className="absolute overflow-hidden" style={{
                    bottom: 0,
                    right: 0,
                    width: '540px',
                    height: '540px',
                    minWidth: '540px',
                    minHeight: '540px',
                    maxWidth: '540px',
                    maxHeight: '540px',
                    borderRadius: '16px',
                    border: 'none',
                    zIndex: 5
                  }}>
                    <img src={mentorPhoto || slotDefaultModel} alt="Mentor Photo" style={{
                      width: '540px',
                      height: '540px',
                      objectFit: 'cover',
                      objectPosition: 'center top',
                      imageRendering: 'crisp-edges',
                      border: 'none',
                      outline: 'none',
                      WebkitBackfaceVisibility: 'hidden',
                      backfaceVisibility: 'hidden',
                      transform: `translateZ(0)${isMentorPhotoFlipped ? ' scaleX(-1)' : ''}`,
                      WebkitFontSmoothing: 'antialiased'
                    }} onClick={() => setIsMentorPhotoFlipped(!isMentorPhotoFlipped)} />
                  </div>
                )}


                {/* ALL CATEGORIES (EXCEPT MOTIVATIONAL): Lower-Third Redesigned - Clean Modern Layout */}
                {bannerData.categoryType !== 'motivational' && (() => {
                    // Calculate variant based on slot number (0-15) in repeating sequence
                    const slotNumber = selectedTemplate; // selectedTemplate is 0-indexed
                    const variantIndex = slotNumber % 3 + 1; // 1, 2, or 3

                    // Helper function to capitalize first letter of each word
                    const capitalizeWords = (str: string) => {
                      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
                    };

                    // Define three color variants: red, orange, teal
                    const variants = {
                      1: {
                        borderColor: '#ef4444',
                        tabColor: '#ef4444',
                        shadowColor: 'rgba(239, 68, 68, 0.5)',
                        name: 'Red'
                      },
                      2: {
                        borderColor: '#f97316',
                        tabColor: '#f97316',
                        shadowColor: 'rgba(249, 115, 22, 0.5)',
                        name: 'Orange'
                      },
                      3: {
                        borderColor: '#14b8a6',
                        tabColor: '#14b8a6',
                        shadowColor: 'rgba(20, 184, 166, 0.5)',
                        name: 'Teal'
                      }
                    };
                    const currentVariant = variants[variantIndex as keyof typeof variants];
                    return <div className="absolute" style={{
                      bottom: '30px',
                      left: '20px',
                      right: '20px',
                      height: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      zIndex: 4
                    }}>
                      {/* Left Curved Tag with Contact Info */}
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        height: '100%',
                        width: '300px',
                        background: currentVariant.tabColor,
                        clipPath: 'polygon(0% 0, 85% 0, 95% 50%, 85% 100%, 0% 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingRight: '50px',
                        boxShadow: `0 8px 24px ${currentVariant.shadowColor}, 0 0 0 2px rgba(0,0,0,0.3)`,
                        zIndex: 2
                      }}>
                        <div style={{
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#ffffff',
                            marginBottom: '4px',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                          }}>
                            CALL FOR MENTORSHIP
                          </div>
                          <div style={{
                            fontSize: '24px',
                            fontWeight: '900',
                            color: '#ffffff',
                            letterSpacing: '0.5px',
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
                          }}>
                            {displayContact ? displayContact.startsWith('+91') ? `+91 ${displayContact.slice(3)}` : displayContact.startsWith('91') ? `+91 ${displayContact.slice(2)}` : `+91 ${displayContact}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Main Dark Panel with Neon Border */}
                      <div style={{
                        position: 'absolute',
                        left: '270px',
                        right: '0',
                        height: '100%',
                        background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)',
                        borderRadius: '12px 60px 60px 12px',
                        border: `3px solid ${currentVariant.borderColor}`,
                        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.6), 0 0 30px ${currentVariant.shadowColor}, inset 0 2px 8px rgba(0,0,0,0.3)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        zIndex: 1
                      }}>
                        {/* User Info - Center Aligned, 20% from Left */}
                        <div style={{
                          textAlign: 'center',
                          paddingLeft: '20%'
                        }}>
                          <div style={{
                            fontSize: '32px',
                            fontWeight: '900',
                            color: '#ffffff',
                            marginBottom: '2px',
                            letterSpacing: '0.5px',
                            textShadow: '0 3px 8px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255,255,255,0.1)'
                          }}>
                            {profileName ? capitalizeWords(profileName) : 'Dilip Singh Rathore'}
                          </div>
                          <div style={{
                            fontSize: '22px',
                            fontWeight: '700',
                            color: '#ffffff',
                            letterSpacing: '1.5px',
                            textTransform: 'capitalize',
                            textShadow: '0 2px 6px rgba(0, 0, 0, 0.6)'
                          }}>
                            {displayRank || 'Royal Ambassador'}
                          </div>
                        </div>
                      </div>
                    </div>;
                  })()}

                {/* MOTIVATIONAL CONTACT STRIP BANNER - Three Variant Sequencing */}
                {bannerData.categoryType === 'motivational' && (() => {
                    // Calculate variant based on slot number (1-16) in repeating sequence
                    const slotNumber = selectedTemplate + 1; // selectedTemplate is 0-indexed, slots are 1-16
                    const variantIndex = (slotNumber - 1) % 3 + 1; // 1, 2, or 3

                    // Define three variants with strict color isolation
                    const variants = {
                      1: {
                        borderColor: '#e63946',
                        // Red/Crimson
                        tabColor: '#e63946',
                        shadowColor: 'rgba(230, 57, 70, 0.4)'
                      },
                      2: {
                        borderColor: '#f77f00',
                        // Orange
                        tabColor: '#f77f00',
                        shadowColor: 'rgba(247, 127, 0, 0.4)'
                      },
                      3: {
                        borderColor: '#06d6a0',
                        // Teal/Cyan
                        tabColor: '#06d6a0',
                        shadowColor: 'rgba(6, 214, 160, 0.4)'
                      }
                    };
                    const currentVariant = variants[variantIndex as keyof typeof variants];
                    return <div className="absolute" style={{
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
                        {/* User Info Centered */}
                        <div style={{
                          position: 'absolute',
                          left: '24%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '30px',
                            fontWeight: '800',
                            color: '#ffffff',
                            marginBottom: '0px',
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
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                            textTransform: 'capitalize',
                            marginTop: '-4px'
                          }}>
                            {displayRank?.toLowerCase() || 'Rank'}
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
                        <div style={{
                          textAlign: 'center'
                        }}>
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
                    </div>;
                  })()}

                {/* BOTTOM CENTER - Profile Name & Rank - FIXED FONTS AND POSITION (Only for non-motivational) */}
                {bannerData.categoryType !== 'motivational' && <div className="absolute text-center" style={{
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
                  </div>}

                {/* *** LAYER 3: DYNAMIC STICKERS - Updates on slot change ONLY *** */}
                {/* Stickers are slot-specific and update instantly with background */}
                {stickerImages[selectedTemplate + 1]?.map((sticker, index) => {
                    const finalScale = stickerScale[sticker.id] ?? sticker.scale ?? 9.3;
                    const isSelected = selectedStickerId === sticker.id;
                    return <img key={sticker.id} src={sticker.url} alt="Achievement Sticker" className={`absolute banner-dynamic-layer ${isAdmin && isDragMode ? 'cursor-move' : 'pointer-events-none'} ${isAdmin && isSelected ? 'ring-4 ring-primary ring-offset-2 ring-offset-background' : ''}`} onMouseDown={isAdmin ? e => handleStickerMouseDown(e, sticker.id) : undefined} onClick={isAdmin ? e => {
                      if (isDragMode) {
                        e.stopPropagation();
                        setSelectedStickerId(sticker.id);
                      }
                    } : undefined} style={{
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
                      willChange: 'auto',
                      backfaceVisibility: 'hidden'
                    }} />;
                  })}

                {/* BOTTOM RIGHT - Mentor Name and Title (Moved to bottom-most position) */}
                

                {/* WATERMARKS - Two layers for preview and download */}
                <BannerWatermarks showBrandWatermark={true} // Preview only - excluded during download via filter
                  showMobileWatermark={true} // Permanent - included in final download
                  />

              </div>
              {/* Close Foreground Container */}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Profile Avatars (Left) + Download Button (Right) - Always visible */}
        <div className="flex items-center justify-between px-2 sm:px-4 mt-3 sm:mt-4 gap-2">
            {/* Left: Profile Images Row - Clickable to change main photo */}
            <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
              {profilePhotos.slice(0, 6).map((photo, idx) => <button key={photo.id} onClick={() => {
            setSelectedMentorPhotoIndex(idx);
            setIsMentorPhotoFlipped(!isMentorPhotoFlipped);
          }} className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 object-cover flex-shrink-0 shadow-lg ${selectedMentorPhotoIndex === idx ? 'border-[#FFD700] ring-2 ring-[#FFD700] ring-offset-2 ring-offset-[#0B0E15]' : 'border-gray-500'}`}>
                  <img src={photo.photo_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                </button>)}
              {profilePhotos.length > 6 && <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-[#FFD700] bg-[#111827] flex items-center justify-center text-[#FFD700] text-[10px] sm:text-xs font-bold flex-shrink-0">
                  +{profilePhotos.length - 6}
                </div>}
            </div>

            {/* Right: Download Button - Always visible */}
            <button onClick={handleDownload} disabled={isDownloading} className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
              <img src={downloadIcon} alt="Download" className="h-12 w-auto sm:h-16" />
            </button>
          </div>
      </div>

      {/* Scrollable Slot Selector Box - Always visible */}
      {/* INSTANT SLOT SWITCHING: Uses handleSlotChange callback for zero-delay updates */}
      {globalBackgroundSlots.length > 0 && <div className="flex-1 min-h-0 px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="h-full overflow-y-auto rounded-2xl sm:rounded-3xl bg-[#111827]/50 border-2 border-[#FFD700]/20 p-3 sm:p-4 shadow-[0_0_30px_rgba(255,215,0,0.1)] scrollbar-thin scrollbar-thumb-[#FFD700]/30 scrollbar-track-transparent">
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {globalBackgroundSlots.map(slot => {
            const isSelected = selectedTemplate === slot.slotNumber - 1;
            // ALL 16 slots show static dummy/proxy content - no user data in mini previews
            // Only the main banner preview shows real achiever data
            return <SlotPreviewMini key={slot.slotNumber} slot={slot} isSelected={isSelected} onClick={() => handleSlotChange(slot.slotNumber - 1)} categoryType={bannerData?.categoryType}
            // No user/achiever data passed - all slots remain proxy-only
            rankName="" name="" teamCity="" chequeAmount="" tripName="" message="" quote="" congratulationsImage={undefined} logoLeft={undefined} logoRight={undefined} uplines={[]} stickers={stickerImages[slot.slotNumber] || []} profileName="" profileRank="" />;
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
      {isAdmin && stickerImages[selectedTemplate + 1]?.length > 0 && <StickerControl onAddSticker={handleAddSticker} onResizeSticker={handleResizeSticker} onToggleDragMode={setIsDragMode} onSave={handleSaveSticker} onReset={handleResetSticker} currentScale={getCurrentScale()} isDragMode={isDragMode} isSaving={isSavingSticker} isAdmin={true} />}

      {/* Profile Picture Control Panel - Admin Only - Motivational Only */}
      {isAdmin && bannerData.categoryType === 'motivational' && mentorPhoto && <>
          {/* Minimized State - Floating Icon */}
          {isProfileControlMinimized && <button onClick={() => setIsProfileControlMinimized(false)} className="fixed bottom-6 right-6 z-40 bg-[#0f1720] rounded-full p-4 shadow-2xl border border-primary/30 hover:bg-[#1a1f2e] transition-colors" title="Expand Profile Controls">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>}

          {/* Expanded State - Full Control Panel */}
          {!isProfileControlMinimized && <div className="fixed bottom-6 right-6 z-40 bg-[#0f1720] rounded-2xl p-4 shadow-2xl border border-primary/30 w-[320px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Profile Picture</h3>
                </div>
                <button onClick={() => setIsProfileControlMinimized(true)} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-secondary/30" title="Minimize">
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
                  <input type="range" min="0.5" max="1.5" step="0.05" value={profilePicScale} onChange={e => setProfilePicScale(parseFloat(e.target.value))} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer" />
                </div>

                {/* Instructions */}
                <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-primary font-semibold">Drag</span> the profile picture to reposition it within the banner.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfileDefaults} size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                    Save Defaults
                  </Button>
                  <Button onClick={() => {
              setProfilePicPosition({
                x: 0,
                y: 0
              });
              setProfilePicScale(1);
              toast.success("Profile picture reset to default");
            }} variant="outline" size="sm" className="flex-1">
                    Reset
                  </Button>
                </div>
              </div>
            </div>}
        </>}

      {/* Insufficient Balance Modal */}
      <InsufficientBalanceModal open={showInsufficientBalanceModal} onClose={() => setShowInsufficientBalanceModal(false)} />
    </div>;
}