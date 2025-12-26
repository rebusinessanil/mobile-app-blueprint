import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Stage, Layer, Group, Image as KonvaImage, Text, Circle, Rect } from 'react-konva';
import Konva from 'konva';

// --- Types ---
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
  width?: number | string;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;

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

const KonvaBannerPreview: React.FC<KonvaBannerPreviewProps> = ({
  data,
  width = '100%',
  onReady,
  onError,
}) => {
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  // Start with scale 0 to prevent "Big Flash" glitch
  const [scale, setScale] = useState(0);
  
  const [loadedAssets, setLoadedAssets] = useState<{
    background: HTMLImageElement | null;
    achiever: HTMLImageElement | null;
    footer: HTMLImageElement | null;
    rankSticker: HTMLImageElement | null;
    uplines: (HTMLImageElement | null)[];
  } | null>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // --- Asset Loading Logic ---
  useEffect(() => {
    let isMounted = true;

    const loadAllAssets = async () => {
      try {
        if (!loadedAssets) {
          setIsAssetsLoaded(false);
          setLoadingProgress(0);
        }

        const uplineSources = data.uplineImgs.map((u) => u.avatar).filter((src): src is string => !!src);
        
        const criticalSources = [
          data.bgImg, 
          data.achieverImg, 
          ...uplineSources
        ].filter(Boolean);

        const totalImages = criticalSources.length + (data.footerImg ? 1 : 0) + (data.rankStickerImg ? 1 : 0);
        let loadedCount = 0;

        const loadWithProgress = async (src: string) => {
          const result = await preloadImage(src);
          if (isMounted) {
            loadedCount++;
            setLoadingProgress(Math.round((loadedCount / totalImages) * 100));
          }
          return result;
        };

        const [background, achiever, footer, rankSticker, ...uplines] = await Promise.all([
          loadWithProgress(data.bgImg),
          loadWithProgress(data.achieverImg),
          data.footerImg ? loadWithProgress(data.footerImg) : Promise.resolve(null),
          data.rankStickerImg ? loadWithProgress(data.rankStickerImg) : Promise.resolve(null),
          ...uplineSources.map(loadWithProgress),
        ]);

        if (isMounted) {
          setLoadedAssets({ background, achiever, footer, rankSticker, uplines });
          setIsAssetsLoaded(true);
          onReady?.();
        }
      } catch (error) {
        console.error('Failed load', error);
        onError?.(error as Error);
      }
    };

    loadAllAssets();

    return () => { isMounted = false; };
  }, [data.bgImg, data.achieverImg, data.userName, data.incomeAmount]); 

  const exportToImage = useCallback(() => {
    if (stageRef.current) {
      const pixelRatio = window.devicePixelRatio || 1; 
      const uri = stageRef.current.toDataURL({ pixelRatio: pixelRatio });
      const link = document.createElement('a');
      link.download = `banner-${Date.now()}.png`;
      link.href = uri;
      link.click();
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-background"
      style={{ 
        width: '100%', 
        aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
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
      {loadedAssets && (
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
              {/* 1. Background */}
              {loadedAssets.background && (
                <KonvaImage image={loadedAssets.background} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
              )}

              {/* 2. Uplines */}
              <Group x={(CANVAS_WIDTH - (5 * 110)) / 2} y={60}> 
                {[0, 1, 2, 3, 4].map((i) => {
                  const img = loadedAssets.uplines[i];
                  return (
                    <Group key={i} x={i * 110}>
                      <Circle radius={45} fill="#D4AF37" x={45} y={45} shadowBlur={10} />
                      {img ? (
                        <Group clipFunc={(ctx) => ctx.arc(45, 45, 45, 0, Math.PI * 2, false)}>
                          <KonvaImage image={img} width={90} height={90} />
                        </Group>
                      ) : (
                        <Circle radius={45} fill="#333" x={45} y={45} />
                      )}
                    </Group>
                  );
                })}
              </Group>

              {/* 3. Achiever Image */}
              {loadedAssets.achiever && (
                <KonvaImage 
                  image={loadedAssets.achiever} 
                  x={80} y={CANVAS_HEIGHT - 750} 
                  width={550} height={700} 
                  shadowBlur={20}
                />
              )}

              {/* 4. Text Info */}
              <Group x={CANVAS_WIDTH / 2 + 50} y={200}>
                <Text text="CONGRATULATIONS" fontSize={42} fill="#FFD700" fontStyle="bold" fontFamily="sans-serif" />
                <Text text={data.userName} fontSize={70} fill="white" fontStyle="bold" y={60} fontFamily="sans-serif" width={700} wrap="none" ellipsis={true}/>
                <Text text={data.rankLabel} fontSize={50} fill="#FFD700" y={150} fontStyle="bold" fontFamily="sans-serif" />
                
                <Rect x={0} y={230} width={400} height={80} fill="rgba(212, 175, 55, 0.2)" cornerRadius={10} stroke="#D4AF37" />
                <Text text={`₹ ${data.incomeAmount}`} fontSize={45} fill="white" y={245} x={20} fontStyle="bold" fontFamily="sans-serif" />
                
                {loadedAssets.rankSticker && (
                  <KonvaImage image={loadedAssets.rankSticker} x={50} y={350} width={150} height={150} />
                )}
              </Group>

              {/* 5. Footer */}
              <Group y={CANVAS_HEIGHT - 100}>
                <Rect width={CANVAS_WIDTH} height={100} fill="#111" />
                <Text text={data.userMobile} fontSize={30} fill="#FFD700" x={CANVAS_WIDTH / 2} y={35} fontStyle="bold" />
                {loadedAssets.footer && (
                  <KonvaImage image={loadedAssets.footer} x={CANVAS_WIDTH - 150} y={10} width={80} height={80} />
                )}
              </Group>
            </Group>
          </Layer>
        </Stage>
      )}
      
      <button
        onClick={exportToImage}
        className="absolute bottom-2 right-2 z-20 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-lg active:scale-95 transition-transform"
      >
        Download
      </button>
    </div>
  );
};

export default KonvaBannerPreview;
