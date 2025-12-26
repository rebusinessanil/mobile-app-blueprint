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
const preloadImage = (src: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
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

    // Build URL key to prevent unnecessary reloads - includes all image sources
    const uplineSources = data.uplineImgs?.map((u) => u.avatar).filter((src): src is string => !!src) || [];
    const stickerSources = data.stickers?.map((s) => s.url).filter(Boolean) || [];
    
    const urlKey = [
      data.bgImg,
      data.achieverImg,
      data.mentorPhoto,
      data.logoLeft,
      data.logoRight,
      data.congratsImage,
      ...uplineSources,
      ...stickerSources,
    ].filter(Boolean).join('|');

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
        ].filter(Boolean);

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

  // Render category-specific content
  const renderCategoryContent = () => {
    const category = data.categoryType || 'rank';
    const userName = data.userName || '';
    const truncatedName = userName.length > 20 ? userName.slice(0, 20) + '...' : userName;
    const nameFontSize = truncatedName.length > 18 ? 36 : truncatedName.length > 14 ? 42 : truncatedName.length > 10 ? 48 : 54;

    switch (category) {
      case 'birthday':
        return (
          <Group x={978} y={140}>
            <Text text="🎂" fontSize={120} x={-60} />
            <Text 
              text="HAPPY BIRTHDAY" 
              fontSize={52} 
              fill="#FFD700" 
              fontStyle="bold" 
              y={160}
              align="center"
              width={300}
              x={-150}
            />
            <Text 
              text={truncatedName.toUpperCase()} 
              fontSize={44} 
              fill="white" 
              fontStyle="600" 
              y={250}
              align="center"
              width={400}
              x={-200}
            />
            {data.message && (
              <Text 
                text={data.message} 
                fontSize={24} 
                fill="white" 
                fontStyle="italic" 
                y={320}
                align="center"
                width={500}
                x={-250}
              />
            )}
          </Group>
        );

      case 'anniversary':
        return (
          <Group x={978} y={140}>
            <Text text="💞" fontSize={120} x={-60} />
            <Text 
              text="HAPPY ANNIVERSARY" 
              fontSize={48} 
              fill="#FFD700" 
              fontStyle="bold" 
              y={160}
              align="center"
              width={400}
              x={-200}
            />
            <Text 
              text={truncatedName.toUpperCase()} 
              fontSize={44} 
              fill="white" 
              fontStyle="600" 
              y={250}
              align="center"
              width={400}
              x={-200}
            />
          </Group>
        );

      case 'festival':
        return (
          <Group x={978} y={140}>
            <Text text="🎉" fontSize={120} x={-60} />
            <Text 
              text="FESTIVAL GREETINGS" 
              fontSize={48} 
              fill="#FFD700" 
              fontStyle="bold" 
              y={160}
              align="center"
              width={400}
              x={-200}
            />
            {truncatedName && (
              <Text 
                text={truncatedName.toUpperCase()} 
                fontSize={44} 
                fill="white" 
                fontStyle="600" 
                y={250}
                align="center"
                width={400}
                x={-200}
              />
            )}
          </Group>
        );

      case 'story':
        return null;

      default:
        // Rank/Bonanza - Default layout
        return (
          <Group>
            {/* Congratulations Image */}
            {loadedAssets?.congratsImage && (
              <KonvaImage 
                image={loadedAssets.congratsImage} 
                x={978 - 324} 
                y={162}
                width={648}
                height={162}
              />
            )}

            {/* Achiever Name */}
            <Group x={978} y={340}>
              <Text 
                text={truncatedName.toUpperCase()} 
                fontSize={nameFontSize} 
                fill="white" 
                fontStyle="bold" 
                align="center"
                width={648}
                x={-324}
              />
            </Group>

            {/* Team City */}
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
              />
            )}

            {/* Income Section */}
            {data.chequeAmount && (
              <Group x={67} y={CANVAS_HEIGHT - 330}>
                <Text 
                  text="THIS WEEK INCOME" 
                  fontSize={36} 
                  fill="white" 
                  fontStyle="500"
                />
                <Text 
                  text={Number(data.chequeAmount).toLocaleString('en-IN')} 
                  fontSize={62} 
                  fill="#FFD600" 
                  fontStyle="bold" 
                  y={50}
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

              {/* 5. Uplines - Top center */}
              <Group x={675 - (5 * 132 / 2)} y={10}> 
                {[0, 1, 2, 3, 4].map((i) => {
                  const img = loadedAssets.uplines[i];
                  return (
                    <Group key={i} x={i * 132}>
                      <Circle radius={60} fill="#ffffff" x={60} y={60} shadowBlur={6} />
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
