import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Group, Image as KonvaImage, Text, Circle, Rect } from 'react-konva';
import Konva from 'konva';

// Types for the banner data
interface UplineData {
  id: string;
  name: string;
  avatar?: string;
}

interface BannerData {
  achieverImg: string;
  bgImg: string;
  uplineImgs: UplineData[];
  rankLabel: string;
  incomeAmount: string;
  userName: string;
  userMobile: string;
  footerImg?: string;
  rankStickerImg?: string;
  congratsText?: string;
}

interface KonvaBannerPreviewProps {
  data: BannerData;
  width?: number;
  height?: number;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

// Canvas dimensions (standard banner size)
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;

/**
 * Preload a single image and return a Promise
 * Handles errors gracefully by returning null instead of breaking the chain
 */
const preloadImage = (src: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      resolve(img);
    };
    
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      resolve(null); // Resolve with null instead of rejecting
    };
    
    img.src = src;
  });
};

/**
 * Preload multiple images in parallel
 */
const preloadImages = async (sources: string[]): Promise<(HTMLImageElement | null)[]> => {
  return Promise.all(sources.map(preloadImage));
};

/**
 * KonvaBannerPreview Component
 * Implements strict "Load All, Then Show" policy using react-konva
 */
const KonvaBannerPreview: React.FC<KonvaBannerPreviewProps> = ({
  data,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
  onReady,
  onError,
}) => {
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadedAssets, setLoadedAssets] = useState<{
    background: HTMLImageElement | null;
    achiever: HTMLImageElement | null;
    footer: HTMLImageElement | null;
    rankSticker: HTMLImageElement | null;
    uplines: (HTMLImageElement | null)[];
  } | null>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate scale to fit container
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newScale = Math.min(containerWidth / CANVAS_WIDTH, 1);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Preload all assets before rendering
  useEffect(() => {
    const loadAllAssets = async () => {
      try {
        setIsAssetsLoaded(false);
        setLoadingProgress(0);

        // Collect all image sources
        const uplineSources = data.uplineImgs
          .map((u) => u.avatar)
          .filter((src): src is string => !!src);

        const allSources = [
          data.bgImg,
          data.achieverImg,
          data.footerImg || '',
          data.rankStickerImg || '',
          ...uplineSources,
        ].filter(Boolean);

        const totalImages = allSources.length;
        let loadedCount = 0;

        // Load all images in parallel with progress tracking
        const loadWithProgress = async (src: string): Promise<HTMLImageElement | null> => {
          const result = await preloadImage(src);
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / totalImages) * 100));
          return result;
        };

        // Load all images
        const [background, achiever, footer, rankSticker, ...uplines] = await Promise.all([
          loadWithProgress(data.bgImg),
          loadWithProgress(data.achieverImg),
          data.footerImg ? loadWithProgress(data.footerImg) : Promise.resolve(null),
          data.rankStickerImg ? loadWithProgress(data.rankStickerImg) : Promise.resolve(null),
          ...uplineSources.map(loadWithProgress),
        ]);

        setLoadedAssets({
          background,
          achiever,
          footer,
          rankSticker,
          uplines,
        });

        setIsAssetsLoaded(true);
        onReady?.();
      } catch (error) {
        console.error('Failed to load banner assets:', error);
        onError?.(error instanceof Error ? error : new Error('Asset loading failed'));
      }
    };

    if (data.bgImg || data.achieverImg) {
      loadAllAssets();
    }
  }, [data, onReady, onError]);

  // Export function for downloading
  const exportToImage = useCallback(() => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `banner-${Date.now()}.png`;
      link.href = uri;
      link.click();
    }
  }, []);

  // Loading spinner component
  if (!isAssetsLoaded) {
    return (
      <div 
        ref={containerRef}
        className="relative flex items-center justify-center bg-background/50 rounded-xl overflow-hidden"
        style={{ 
          width: '100%', 
          aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
          maxWidth: width,
        }}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Animated spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div 
              className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"
              style={{ animationDuration: '0.8s' }}
            />
          </div>
          
          {/* Progress text */}
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Loading Banner Assets</p>
            <p className="text-xs text-muted-foreground mt-1">{loadingProgress}%</p>
          </div>

          {/* Progress bar */}
          <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!loadedAssets) return null;

  // Upline circle configuration
  const UPLINE_CIRCLE_SIZE = 90;
  const UPLINE_SPACING = 20;
  const UPLINE_Y = 60;
  const UPLINE_START_X = (CANVAS_WIDTH - (5 * UPLINE_CIRCLE_SIZE + 4 * UPLINE_SPACING)) / 2;

  // Achiever image configuration
  const ACHIEVER_WIDTH = 550;
  const ACHIEVER_HEIGHT = 700;
  const ACHIEVER_X = 80;
  const ACHIEVER_Y = CANVAS_HEIGHT - ACHIEVER_HEIGHT - 50;

  // Text configuration
  const TEXT_X = CANVAS_WIDTH / 2 + 100;
  const TEXT_WIDTH = CANVAS_WIDTH / 2 - 200;

  return (
    <div 
      ref={containerRef} 
      className="relative rounded-xl overflow-hidden shadow-2xl"
      style={{ width: '100%', maxWidth: width }}
    >
      <Stage
        ref={stageRef}
        width={CANVAS_WIDTH * scale}
        height={CANVAS_HEIGHT * scale}
        scaleX={scale}
        scaleY={scale}
        style={{ backgroundColor: '#0a0a0a' }}
      >
        <Layer>
          {/* Master Group - All elements inside for easy scaling */}
          <Group>
            {/* 1. Background Image */}
            {loadedAssets.background && (
              <KonvaImage
                image={loadedAssets.background}
                x={0}
                y={0}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
              />
            )}

            {/* 2. Top Header - Upline Circles */}
            <Group x={UPLINE_START_X} y={UPLINE_Y}>
              {[0, 1, 2, 3, 4].map((index) => {
                const uplineImg = loadedAssets.uplines[index];
                const xPos = index * (UPLINE_CIRCLE_SIZE + UPLINE_SPACING);
                const radius = UPLINE_CIRCLE_SIZE / 2;

                return (
                  <Group key={index} x={xPos} y={0}>
                    {/* Circle border/background */}
                    <Circle
                      x={radius}
                      y={radius}
                      radius={radius + 3}
                      fill="#D4AF37"
                      shadowColor="rgba(0,0,0,0.3)"
                      shadowBlur={8}
                      shadowOffsetY={3}
                    />
                    
                    {/* Clipped upline image */}
                    {uplineImg ? (
                      <Group
                        clipFunc={(ctx) => {
                          ctx.beginPath();
                          ctx.arc(radius, radius, radius, 0, Math.PI * 2, false);
                          ctx.closePath();
                        }}
                      >
                        <KonvaImage
                          image={uplineImg}
                          x={0}
                          y={0}
                          width={UPLINE_CIRCLE_SIZE}
                          height={UPLINE_CIRCLE_SIZE}
                        />
                      </Group>
                    ) : (
                      // Placeholder circle
                      <Circle
                        x={radius}
                        y={radius}
                        radius={radius}
                        fill="#2a2a2a"
                      />
                    )}
                  </Group>
                );
              })}
            </Group>

            {/* 3. Achiever Image (Left Side) */}
            {loadedAssets.achiever && (
              <KonvaImage
                image={loadedAssets.achiever}
                x={ACHIEVER_X}
                y={ACHIEVER_Y}
                width={ACHIEVER_WIDTH}
                height={ACHIEVER_HEIGHT}
                shadowColor="rgba(0,0,0,0.5)"
                shadowBlur={20}
                shadowOffsetX={10}
                shadowOffsetY={10}
              />
            )}

            {/* 4. Center/Right Text Content */}
            <Group x={TEXT_X} y={200}>
              {/* Congratulations Text */}
              <Text
                text={data.congratsText || "CONGRATULATIONS"}
                fontSize={42}
                fontFamily="Poppins, sans-serif"
                fontStyle="bold"
                fill="#FFD700"
                width={TEXT_WIDTH}
                align="center"
                shadowColor="rgba(0,0,0,0.5)"
                shadowBlur={4}
                shadowOffsetY={2}
              />

              {/* Achiever Name */}
              <Text
                text={data.userName}
                fontSize={72}
                fontFamily="Poppins, sans-serif"
                fontStyle="bold"
                fill="#FFFFFF"
                y={60}
                width={TEXT_WIDTH}
                align="center"
                shadowColor="rgba(0,0,0,0.5)"
                shadowBlur={6}
                shadowOffsetY={3}
              />

              {/* Rank Label */}
              <Text
                text={data.rankLabel}
                fontSize={56}
                fontFamily="Poppins, sans-serif"
                fontStyle="bold"
                fill="#FFD700"
                y={150}
                width={TEXT_WIDTH}
                align="center"
                shadowColor="rgba(0,0,0,0.5)"
                shadowBlur={4}
                shadowOffsetY={2}
              />

              {/* Income Amount */}
              {data.incomeAmount && (
                <Group y={240}>
                  <Rect
                    x={(TEXT_WIDTH - 400) / 2}
                    y={0}
                    width={400}
                    height={80}
                    fill="rgba(212, 175, 55, 0.15)"
                    cornerRadius={12}
                    stroke="#D4AF37"
                    strokeWidth={2}
                  />
                  <Text
                    text={`₹ ${data.incomeAmount}`}
                    fontSize={48}
                    fontFamily="Poppins, sans-serif"
                    fontStyle="bold"
                    fill="#FFFFFF"
                    y={16}
                    width={TEXT_WIDTH}
                    align="center"
                  />
                </Group>
              )}

              {/* Rank Sticker/Logo */}
              {loadedAssets.rankSticker && (
                <KonvaImage
                  image={loadedAssets.rankSticker}
                  x={(TEXT_WIDTH - 150) / 2}
                  y={350}
                  width={150}
                  height={150}
                />
              )}
            </Group>

            {/* 5. Footer Strip */}
            <Group y={CANVAS_HEIGHT - 80}>
              {/* Footer background */}
              <Rect
                x={0}
                y={0}
                width={CANVAS_WIDTH}
                height={80}
                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                fillLinearGradientEndPoint={{ x: CANVAS_WIDTH, y: 0 }}
                fillLinearGradientColorStops={[0, '#1a1a1a', 0.5, '#2a2a2a', 1, '#1a1a1a']}
              />

              {/* Footer content */}
              <Group x={CANVAS_WIDTH / 2} y={40}>
                <Text
                  text={data.userMobile}
                  fontSize={24}
                  fontFamily="Inter, sans-serif"
                  fontStyle="600"
                  fill="#FFD700"
                  offsetX={60}
                  offsetY={12}
                />
              </Group>

              {/* Footer image (if provided) */}
              {loadedAssets.footer && (
                <KonvaImage
                  image={loadedAssets.footer}
                  x={CANVAS_WIDTH - 150}
                  y={10}
                  width={60}
                  height={60}
                />
              )}
            </Group>
          </Group>
        </Layer>
      </Stage>

      {/* Export button overlay */}
      <button
        onClick={exportToImage}
        className="absolute bottom-4 right-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-lg hover:bg-primary/90 transition-colors"
      >
        Download Banner
      </button>
    </div>
  );
};

export default KonvaBannerPreview;
