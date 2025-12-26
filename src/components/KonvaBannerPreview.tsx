import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Group, Image as KonvaImage, Text, Circle, Rect } from 'react-konva';
import Konva from 'konva';

// --- Types ---
export interface UplineData {
  id: string;
  name: string;
  avatar?: string;
}

export interface StickerData {
  id: string;
  url: string;
  position_x?: number;
  position_y?: number;
  scale?: number;
  rotation?: number;
}

export interface KonvaBannerData {
  // Main content
  achieverImg?: string | null;
  bgImg?: string | null;
  bgColor?: string;
  
  // User info
  userName: string;
  teamCity?: string;
  chequeAmount?: string;
  userMobile?: string;
  profileName?: string;
  profileRank?: string;
  
  // Category-specific
  categoryType?: 'rank' | 'bonanza' | 'birthday' | 'anniversary' | 'meeting' | 'festival' | 'motivational' | 'story';
  rankLabel?: string;
  tripName?: string;
  message?: string;
  quote?: string;
  eventTitle?: string;
  eventDate?: string;
  eventVenue?: string;
  
  // Uplines
  uplineImgs: UplineData[];
  
  // Stickers
  stickers?: StickerData[];
  
  // Logos
  logoLeft?: string | null;
  logoRight?: string | null;
  congratsImage?: string | null;
  
  // Profile photos
  mentorPhoto?: string | null;
  
  // Footer
  footerImg?: string;
  rankStickerImg?: string;
}

export interface KonvaBannerPreviewProps {
  data: KonvaBannerData;
  width?: number | string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  isPhotoFlipped?: boolean;
  isMentorPhotoFlipped?: boolean;
}

export interface KonvaBannerPreviewHandle {
  exportToImage: () => Promise<string>;
  getStage: () => Konva.Stage | null;
}

// 1:1 Aspect ratio - 1350x1350
const CANVAS_WIDTH = 1350;
const CANVAS_HEIGHT = 1350;

// --- Helper Functions ---
const preloadImage = (src: string | null | undefined): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    // Handle all falsy/invalid values
    if (!src || src === 'undefined' || src === 'null' || src.trim() === '') {
      resolve(null);
      return;
    }
    
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    // Timeout to prevent indefinite hanging (10 seconds max)
    const timeout = setTimeout(() => {
      console.warn(`Image load timeout: ${src.substring(0, 50)}...`);
      resolve(null);
    }, 10000);
    
    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      console.warn(`Image failed to load: ${src.substring(0, 50)}...`);
      resolve(null);
    };
    
    img.src = src;
  });
};

const KonvaBannerPreview = forwardRef<KonvaBannerPreviewHandle, KonvaBannerPreviewProps>(({
  data,
  width = '100%',
  onReady,
  onError,
  isPhotoFlipped = false,
  isMentorPhotoFlipped = false,
}, ref) => {
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [scale, setScale] = useState(0);
  
  const [loadedAssets, setLoadedAssets] = useState<{
    background: HTMLImageElement | null;
    achiever: HTMLImageElement | null;
    mentor: HTMLImageElement | null;
    logoLeft: HTMLImageElement | null;
    logoRight: HTMLImageElement | null;
    congratsImage: HTMLImageElement | null;
    uplines: (HTMLImageElement | null)[];
    stickers: (HTMLImageElement | null)[];
  } | null>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Stable callback refs to prevent infinite re-renders
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  });

  // Track loaded asset URLs to prevent unnecessary reloads
  const loadedUrlsRef = useRef<string>('');

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    exportToImage: async () => {
      if (!stageRef.current) throw new Error('Stage not ready');
      return stageRef.current.toDataURL({ 
        pixelRatio: 1,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      });
    },
    getStage: () => stageRef.current,
  }));

  // --- Smart Resizing Logic (Mobile Friendly) ---
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const newScale = width / CANVAS_WIDTH;
        setScale(newScale);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // --- Asset Loading Logic with stable URL tracking ---
  useEffect(() => {
    let isMounted = true;

    // Filter helper - only valid URLs
    const isValidUrl = (src: string | null | undefined): src is string => {
      return !!src && src !== 'undefined' && src !== 'null' && src.trim() !== '';
    };

    // Build URL key to prevent unnecessary reloads - includes all image sources
    const uplineSources = data.uplineImgs?.map((u) => u.avatar).filter(isValidUrl) || [];
    const stickerSources = data.stickers?.map((s) => s.url).filter(isValidUrl) || [];
    
    const urlKey = [
      data.bgImg,
      data.achieverImg,
      data.mentorPhoto,
      data.logoLeft,
      data.logoRight,
      data.congratsImage,
      ...uplineSources,
      ...stickerSources,
    ].filter(isValidUrl).join('|');

    // Skip if URLs haven't changed
    if (urlKey === loadedUrlsRef.current && loadedAssets) {
      return;
    }

    const loadAllAssets = async () => {
      try {
        setIsAssetsLoaded(false);
        setLoadingProgress(0);

        const allSources = [
          data.bgImg,
          data.achieverImg,
          data.mentorPhoto,
          data.logoLeft,
          data.logoRight,
          data.congratsImage,
          ...uplineSources,
          ...stickerSources,
        ].filter(isValidUrl);

        // Always have at least 1 to avoid division by zero
        const totalImages = Math.max(allSources.length, 1);
        let loadedCount = 0;

        const loadWithProgress = async (src: string | null | undefined) => {
          if (!src) return null;
          const result = await preloadImage(src);
          if (isMounted) {
            loadedCount++;
            setLoadingProgress(Math.round((loadedCount / totalImages) * 100));
          }
          return result;
        };

        const [background, achiever, mentor, logoLeft, logoRight, congratsImage] = await Promise.all([
          loadWithProgress(data.bgImg),
          loadWithProgress(data.achieverImg),
          loadWithProgress(data.mentorPhoto),
          loadWithProgress(data.logoLeft),
          loadWithProgress(data.logoRight),
          loadWithProgress(data.congratsImage),
        ]);

        const uplines = await Promise.all(uplineSources.map(loadWithProgress));
        const stickers = await Promise.all(stickerSources.map(loadWithProgress));

        if (isMounted) {
          loadedUrlsRef.current = urlKey;
          setLoadedAssets({ 
            background, 
            achiever, 
            mentor, 
            logoLeft, 
            logoRight, 
            congratsImage, 
            uplines, 
            stickers 
          });
          setIsAssetsLoaded(true);
          onReadyRef.current?.();
        }
      } catch (error) {
        console.error('Failed to load assets:', error);
        if (isMounted) {
          onErrorRef.current?.(error as Error);
        }
      }
    };

    loadAllAssets();

    return () => { isMounted = false; };
  }, [data.bgImg, data.achieverImg, data.mentorPhoto, data.logoLeft, data.logoRight, data.congratsImage, data.uplineImgs, data.stickers, loadedAssets]);

  // Render category-specific content - EXACT PIXEL MATCH with HTML version
  const renderCategoryContent = () => {
    const category = data.categoryType || 'rank';
    const userName = data.userName || '';
    const truncatedName = userName.length > 20 ? userName.slice(0, 20) + '...' : userName;
    // Match HTML: fontSize based on name length
    const nameFontSize = truncatedName.length > 18 ? 36 : truncatedName.length > 14 ? 42 : truncatedName.length > 10 ? 48 : 54;

    switch (category) {
      case 'birthday':
        // Match HTML BirthdayBannerCreate layout
        return (
          <Group>
            {/* Birthday Title - positioned like HTML */}
            <Text 
              text="HAPPY BIRTHDAY" 
              fontSize={52} 
              fill="#FFD700" 
              fontStyle="bold" 
              x={978}
              y={236}
              align="center"
              width={648}
              offsetX={324}
              shadowColor="rgba(0,0,0,0.9)"
              shadowBlur={8}
              shadowOffsetX={2}
              shadowOffsetY={2}
            />
            {/* Achiever Name */}
            <Text 
              text={truncatedName.toUpperCase()} 
              fontSize={nameFontSize} 
              fill="white" 
              fontStyle="bold" 
              x={978}
              y={340}
              align="center"
              width={648}
              offsetX={324}
              shadowColor="rgba(0,0,0,0.9)"
              shadowBlur={10}
              shadowOffsetX={3}
              shadowOffsetY={3}
            />
            {/* Message */}
            {data.message && (
              <Text 
                text={data.message} 
                fontSize={28} 
                fill="white" 
                fontStyle="italic" 
                x={978}
                y={420}
                align="center"
                width={548}
                offsetX={274}
                shadowColor="rgba(0,0,0,0.8)"
                shadowBlur={6}
              />
            )}
          </Group>
        );

      case 'anniversary':
        // Match HTML AnniversaryBannerCreate layout
        return (
          <Group>
            {/* Anniversary Title */}
            <Text 
              text="HAPPY ANNIVERSARY" 
              fontSize={48} 
              fill="#FFD700" 
              fontStyle="bold" 
              x={978}
              y={236}
              align="center"
              width={648}
              offsetX={324}
              shadowColor="rgba(0,0,0,0.9)"
              shadowBlur={8}
              shadowOffsetX={2}
              shadowOffsetY={2}
            />
            {/* Achiever Name */}
            <Text 
              text={truncatedName.toUpperCase()} 
              fontSize={nameFontSize} 
              fill="white" 
              fontStyle="bold" 
              x={978}
              y={340}
              align="center"
              width={648}
              offsetX={324}
              shadowColor="rgba(0,0,0,0.9)"
              shadowBlur={10}
              shadowOffsetX={3}
              shadowOffsetY={3}
            />
            {/* Message */}
            {data.message && (
              <Text 
                text={data.message} 
                fontSize={28} 
                fill="white" 
                fontStyle="italic" 
                x={978}
                y={420}
                align="center"
                width={548}
                offsetX={274}
                shadowColor="rgba(0,0,0,0.8)"
                shadowBlur={6}
              />
            )}
          </Group>
        );

      case 'festival':
        // Match HTML FestivalBannerCreate layout - minimal content
        return (
          <Group>
            {/* Festival Greeting - optional name only if provided */}
            {truncatedName && (
              <Text 
                text={truncatedName.toUpperCase()} 
                fontSize={nameFontSize} 
                fill="white" 
                fontStyle="bold" 
                x={978}
                y={340}
                align="center"
                width={648}
                offsetX={324}
                shadowColor="rgba(0,0,0,0.9)"
                shadowBlur={10}
                shadowOffsetX={3}
                shadowOffsetY={3}
              />
            )}
            {/* Greeting Message */}
            {data.message && (
              <Text 
                text={data.message} 
                fontSize={28} 
                fill="white" 
                fontStyle="italic" 
                x={978}
                y={420}
                align="center"
                width={548}
                offsetX={274}
                shadowColor="rgba(0,0,0,0.8)"
                shadowBlur={6}
              />
            )}
          </Group>
        );

      case 'motivational':
        // Motivational layout - Quote centered, name attribution
        return (
          <Group>
            {/* Quote Text */}
            {data.quote && (
              <Text 
                text={`"${data.quote}"`} 
                fontSize={32} 
                fill="white" 
                fontStyle="italic" 
                x={978}
                y={360}
                align="center"
                width={648}
                offsetX={324}
                lineHeight={1.5}
                shadowColor="rgba(0,0,0,0.9)"
                shadowBlur={8}
                shadowOffsetX={2}
                shadowOffsetY={2}
              />
            )}
            {/* Name Attribution */}
            {truncatedName && (
              <Text 
                text={`- ${truncatedName.toUpperCase()}`} 
                fontSize={30} 
                fill="#FFD700" 
                fontStyle="600" 
                x={978}
                y={520}
                align="center"
                width={648}
                offsetX={324}
                shadowColor="rgba(0,0,0,0.9)"
                shadowBlur={6}
              />
            )}
          </Group>
        );

      case 'bonanza':
        // Match HTML bonanza layout exactly
        return (
          <Group>
            {/* Congratulations Image - EXACT: top: 162px, left: 978px centered, 648x162 */}
            {loadedAssets?.congratsImage && (
              <KonvaImage 
                image={loadedAssets.congratsImage} 
                x={978 - 324} // translateX(-50%) of 648px width
                y={162}
                width={648}
                height={162}
              />
            )}

            {/* BONANZA TRIP WINNER Title - EXACT: top: 236px */}
            <Text 
              text="BONANZA TRIP WINNER" 
              fontSize={42} 
              fill="white" 
              fontStyle="600" 
              x={978}
              y={236}
              align="center"
              width={648}
              offsetX={324}
              letterSpacing={1}
              shadowColor="rgba(0,0,0,0.9)"
              shadowBlur={8}
              shadowOffsetX={2}
              shadowOffsetY={2}
            />

            {/* Trip Name - EXACT: top: 337px, color: #FFD700 */}
            <Text 
              text={(data.tripName || 'TRIP DESTINATION').toUpperCase()} 
              fontSize={48} 
              fill="#FFD700" 
              fontStyle="bold" 
              x={978}
              y={337}
              align="center"
              width={648}
              offsetX={324}
              shadowColor="rgba(0,0,0,0.95)"
              shadowBlur={10}
              shadowOffsetX={3}
              shadowOffsetY={3}
            />

            {/* Achiever Name - positioned below trip name */}
            <Text 
              text={truncatedName.toUpperCase()} 
              fontSize={nameFontSize} 
              fill="white" 
              fontStyle="bold" 
              x={978}
              y={430}
              align="center"
              width={648}
              offsetX={324}
              shadowColor="rgba(0,0,0,0.9)"
              shadowBlur={10}
              shadowOffsetX={3}
              shadowOffsetY={3}
            />

            {/* Team City */}
            {data.teamCity && (
              <Text 
                text={data.teamCity.toUpperCase()} 
                fontSize={28} 
                fill="white" 
                x={978}
                y={500}
                align="center"
                width={648}
                offsetX={324}
                shadowColor="rgba(0,0,0,0.9)"
                shadowBlur={4}
              />
            )}
          </Group>
        );

      case 'story':
        // Story - No text overlays (handled by background only)
        return null;

      default:
        // 'rank' category - EXACT MATCH with HTML BannerPreview.tsx default case
        return (
          <Group>
            {/* Congratulations Image - EXACT: top: 162px, left: 978px centered, 648x162 */}
            {loadedAssets?.congratsImage && (
              <KonvaImage 
                image={loadedAssets.congratsImage} 
                x={978 - 324} // translateX(-50%) of 648px width = 654
                y={162}
                width={648}
                height={162}
              />
            )}

            {/* Achiever Name - EXACT: top: 340px, centered at x:978 */}
            <Text 
              text={truncatedName.toUpperCase()} 
              fontSize={nameFontSize} 
              fill="white" 
              fontStyle="bold" 
              x={978}
              y={340}
              align="center"
              width={648}
              offsetX={324}
              letterSpacing={1}
              shadowColor="rgba(0,0,0,0.9)"
              shadowBlur={10}
              shadowOffsetX={3}
              shadowOffsetY={3}
            />

            {/* Team City - EXACT: top: 423px + 13px margin = 436px */}
            {data.teamCity && (
              <Text 
                text={data.teamCity.toUpperCase()} 
                fontSize={28} 
                fill="white" 
                x={978}
                y={436}
                align="center"
                width={648}
                offsetX={324}
                shadowColor="rgba(0,0,0,0.9)"
                shadowBlur={4}
                shadowOffsetX={2}
                shadowOffsetY={2}
              />
            )}

            {/* Income Section - EXACT: bottom: 202px from 1350 = y: 1148, left: 67px */}
            {data.chequeAmount && (
              <Group x={67} y={CANVAS_HEIGHT - 330}>
                <Text 
                  text="THIS WEEK INCOME" 
                  fontSize={36} 
                  fill="white" 
                  fontStyle="500"
                  letterSpacing={1}
                  shadowColor="rgba(0,0,0,0.9)"
                  shadowBlur={4}
                  shadowOffsetX={2}
                  shadowOffsetY={2}
                />
                <Text 
                  text={Number(data.chequeAmount).toLocaleString('en-IN')} 
                  fontSize={62} 
                  fill="#FFD600" 
                  fontStyle="bold" 
                  y={50}
                  letterSpacing={2}
                  shadowColor="rgba(0,0,0,0.95)"
                  shadowBlur={12}
                  shadowOffsetX={4}
                  shadowOffsetY={4}
                />
              </Group>
            )}
          </Group>
        );
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-background"
      style={{ 
        width: '100%', 
        aspectRatio: '1 / 1',
        maxWidth: typeof width === 'number' ? `${width}px` : width 
      }} 
    >
      {/* Loading Screen */}
      {(!isAssetsLoaded || scale === 0) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background text-foreground">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium">Generating Preview...</p>
          {loadingProgress > 0 && <p className="text-xs text-muted-foreground mt-2">{loadingProgress}%</p>}
        </div>
      )}

      {/* Main Stage - Only render when assets exist */}
      {loadedAssets && scale > 0 && (
        <Stage
          ref={stageRef}
          width={CANVAS_WIDTH * scale}
          height={CANVAS_HEIGHT * scale}
          scaleX={scale}
          scaleY={scale}
          listening={false}
        >
          <Layer>
            <Group>
              {/* 1. Background Color fallback */}
              <Rect 
                width={CANVAS_WIDTH} 
                height={CANVAS_HEIGHT} 
                fill={data.bgColor || '#111827'} 
              />

              {/* 2. Background Image */}
              {loadedAssets.background && (
                <KonvaImage 
                  image={loadedAssets.background} 
                  width={CANVAS_WIDTH} 
                  height={CANVAS_HEIGHT} 
                />
              )}

              {/* 3. Top-Left Logo */}
              {loadedAssets.logoLeft && (
                <KonvaImage 
                  image={loadedAssets.logoLeft} 
                  x={24} 
                  y={10} 
                  width={250}
                  height={loadedAssets.logoLeft.height * (250 / loadedAssets.logoLeft.width)}
                />
              )}

              {/* 4. Top-Right Logo */}
              {loadedAssets.logoRight && (
                <KonvaImage 
                  image={loadedAssets.logoRight} 
                  x={CANVAS_WIDTH - 274} 
                  y={10} 
                  width={250}
                  height={loadedAssets.logoRight.height * (250 / loadedAssets.logoRight.width)}
                />
              )}

              {/* 5. Uplines - Top center - EXACT: left: 675px translateX(-50%), gap: 12px, 120x120 each */}
              {/* HTML: 5 avatars × 120px + 4 gaps × 12px = 648px total, centered at x=675 */}
              <Group x={675 - 324} y={10}> 
                {[0, 1, 2, 3, 4].map((i) => {
                  const img = loadedAssets.uplines[i];
                  const xPos = i * 132; // 120px width + 12px gap
                  return (
                    <Group key={i} x={xPos}>
                      {/* White circle background with shadow */}
                      <Circle 
                        radius={60} 
                        fill="#ffffff" 
                        x={60} 
                        y={60} 
                        shadowBlur={12}
                        shadowColor="rgba(0,0,0,0.5)"
                        shadowOffsetY={6}
                      />
                      {img ? (
                        <Group clipFunc={(ctx) => ctx.arc(60, 60, 57, 0, Math.PI * 2, false)}>
                          <KonvaImage image={img} width={120} height={120} />
                        </Group>
                      ) : (
                        <Circle radius={57} fill="#333" x={60} y={60} />
                      )}
                    </Group>
                  );
                })}
              </Group>

              {/* 6. Main Achiever Photo - Left side, 3:4 aspect */}
              {loadedAssets.achiever && (
                <Group 
                  x={40} 
                  y={162}
                  scaleX={isPhotoFlipped ? -1 : 1}
                  offsetX={isPhotoFlipped ? 594 : 0}
                >
                  <KonvaImage 
                    image={loadedAssets.achiever} 
                    width={594}
                    height={792}
                    cornerRadius={24}
                  />
                </Group>
              )}

              {/* 7. Category-specific content */}
              {renderCategoryContent()}

              {/* 8. Mentor Photo - Bottom right, 1:1 */}
              {loadedAssets.mentor && data.categoryType !== 'motivational' && (
                <Group 
                  x={CANVAS_WIDTH - 540} 
                  y={CANVAS_HEIGHT - 540}
                  scaleX={isMentorPhotoFlipped ? -1 : 1}
                  offsetX={isMentorPhotoFlipped ? 540 : 0}
                >
                  <KonvaImage 
                    image={loadedAssets.mentor} 
                    width={540}
                    height={540}
                    cornerRadius={16}
                  />
                </Group>
              )}

              {/* 9. Stickers */}
              {data.stickers?.map((sticker, index) => {
                const img = loadedAssets.stickers[index];
                if (!img) return null;
                const stickerScale = sticker.scale ?? 9.3;
                return (
                  <KonvaImage
                    key={sticker.id}
                    image={img}
                    x={(sticker.position_x ?? 77) / 100 * CANVAS_WIDTH}
                    y={(sticker.position_y ?? 62) / 100 * CANVAS_HEIGHT}
                    width={145}
                    height={145}
                    offsetX={72.5}
                    offsetY={72.5}
                    scaleX={stickerScale}
                    scaleY={stickerScale}
                    rotation={sticker.rotation ?? 0}
                  />
                );
              })}

              {/* 10. Bottom Contact/Profile info */}
              <Group y={CANVAS_HEIGHT - 150}>
                <Rect width={CANVAS_WIDTH} height={150} fill="rgba(0,0,0,0.6)" />
                <Text 
                  text="CALL FOR MENTORSHIP" 
                  fontSize={14} 
                  fill="white" 
                  x={27}
                  y={30}
                  letterSpacing={2}
                />
                <Text 
                  text={`+91 ${data.userMobile || ''}`} 
                  fontSize={32} 
                  fill="white" 
                  fontStyle="bold"
                  x={27}
                  y={50}
                />
                {data.profileName && (
                  <Text 
                    text={data.profileName.toUpperCase()} 
                    fontSize={28} 
                    fill="white" 
                    fontStyle="bold"
                    x={CANVAS_WIDTH / 2}
                    y={40}
                    align="center"
                    width={400}
                    offsetX={200}
                  />
                )}
                {data.profileRank && (
                  <Text 
                    text={data.profileRank.toUpperCase()} 
                    fontSize={24} 
                    fill="#FFD700" 
                    fontStyle="bold"
                    x={CANVAS_WIDTH / 2}
                    y={75}
                    align="center"
                    width={400}
                    offsetX={200}
                  />
                )}
              </Group>
            </Group>
          </Layer>
        </Stage>
      )}
    </div>
  );
});

KonvaBannerPreview.displayName = 'KonvaBannerPreview';

export default KonvaBannerPreview;
