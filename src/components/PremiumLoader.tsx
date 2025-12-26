import { memo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PremiumLoaderProps {
  isVisible: boolean;
  message?: string;
}

const PremiumLoader = memo(({ isVisible, message = "Unlocking Your Account…" }: PremiumLoaderProps) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Wait for fade-out animation before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center",
        "bg-gradient-to-b from-navy-dark/98 via-navy-dark/95 to-navy-dark/98",
        "backdrop-blur-sm transition-opacity duration-300 ease-out",
        isAnimating ? "opacity-100" : "opacity-0"
      )}
      style={{ willChange: "opacity" }}
    >
      {/* Ambient glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      {/* 3D Gold Coin Container */}
      <div className="relative mb-8" style={{ perspective: "1000px" }}>
        {/* Soft shadow under coin */}
        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-20 h-4 bg-black/40 rounded-full blur-md animate-pulse" />
        
        {/* 3D Spinning Gold Coin */}
        <div 
          className="gold-coin-3d"
          style={{
            width: "80px",
            height: "80px",
            transformStyle: "preserve-3d",
            animation: "goldCoinSpin 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          }}
        >
          {/* Front face */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(ellipse at 30% 30%, #FFE766 0%, #FFD34E 25%, #D4AF37 50%, #B8860B 75%, #8B6914 100%)
              `,
              boxShadow: `
                inset 0 0 20px rgba(255, 227, 102, 0.5),
                inset -2px -2px 10px rgba(139, 105, 20, 0.4),
                inset 2px 2px 10px rgba(255, 255, 200, 0.6),
                0 0 30px rgba(255, 211, 78, 0.4),
                0 0 60px rgba(212, 175, 55, 0.2)
              `,
              transform: "translateZ(4px)",
              backfaceVisibility: "hidden",
            }}
          >
            {/* Inner ring detail */}
            <div 
              className="absolute inset-3 rounded-full"
              style={{
                border: "2px solid rgba(255, 255, 200, 0.3)",
                background: `
                  radial-gradient(ellipse at 40% 40%, rgba(255, 255, 200, 0.2) 0%, transparent 50%)
                `,
              }}
            />
            {/* Star/emblem in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="text-2xl"
                style={{
                  color: "#8B6914",
                  textShadow: "0 1px 2px rgba(255, 255, 200, 0.5)",
                  filter: "drop-shadow(0 0 3px rgba(139, 105, 20, 0.5))",
                }}
              >
                ★
              </div>
            </div>
            {/* Shimmer highlight */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: "linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.4) 50%, transparent 60%)",
                animation: "coinShimmer 2s ease-in-out infinite",
              }}
            />
          </div>

          {/* Back face */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(ellipse at 70% 70%, #FFE766 0%, #FFD34E 25%, #D4AF37 50%, #B8860B 75%, #8B6914 100%)
              `,
              boxShadow: `
                inset 0 0 20px rgba(255, 227, 102, 0.5),
                inset 2px 2px 10px rgba(139, 105, 20, 0.4),
                inset -2px -2px 10px rgba(255, 255, 200, 0.6)
              `,
              transform: "translateZ(-4px) rotateY(180deg)",
              backfaceVisibility: "hidden",
            }}
          >
            {/* Inner ring detail */}
            <div 
              className="absolute inset-3 rounded-full"
              style={{
                border: "2px solid rgba(255, 255, 200, 0.3)",
              }}
            />
            {/* Pattern on back */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="text-xl font-bold"
                style={{
                  color: "#8B6914",
                  textShadow: "0 1px 2px rgba(255, 255, 200, 0.5)",
                }}
              >
                ₹
              </div>
            </div>
          </div>

          {/* Edge (coin thickness) */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 h-full"
            style={{
              width: "8px",
              background: "linear-gradient(to right, #8B6914 0%, #D4AF37 50%, #8B6914 100%)",
              transform: "rotateY(90deg)",
              transformOrigin: "center",
            }}
          />
        </div>
      </div>

      {/* Premium shimmer text */}
      <div className="relative">
        <p 
          className="text-lg font-semibold tracking-wide"
          style={{
            fontFamily: "'Poppins', sans-serif",
            background: "linear-gradient(90deg, #D4AF37 0%, #FFE766 25%, #FFD34E 50%, #FFE766 75%, #D4AF37 100%)",
            backgroundSize: "200% 100%",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "textShimmer 2s linear infinite",
            textShadow: "0 0 30px rgba(212, 175, 55, 0.3)",
          }}
        >
          {message}
        </p>
        {/* Subtle glow under text */}
        <div 
          className="absolute inset-0 blur-lg opacity-30"
          style={{
            background: "linear-gradient(90deg, #D4AF37, #FFD34E, #D4AF37)",
          }}
        />
      </div>

      {/* Floating particles for luxury feel */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
            style={{
              left: `${20 + i * 12}%`,
              top: `${30 + (i % 3) * 20}%`,
              animation: `floatParticle ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
});

PremiumLoader.displayName = "PremiumLoader";

export default PremiumLoader;
