import { Link } from "react-router-dom";
import { useState } from "react";

interface BannerCardProps {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  fallbackIcon?: string;
  fallbackGradient?: string;
  linkTo: string;
}

export default function BannerCard({
  id,
  title,
  subtitle,
  imageUrl,
  fallbackIcon = "🏆",
  fallbackGradient = "bg-gradient-to-br from-secondary to-card",
  linkTo
}: BannerCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Link
      to={linkTo}
      className="w-[calc(33.333%-8px)] min-w-[110px] max-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all active:scale-95"
    >
      {/* Fixed aspect ratio container to prevent layout shift */}
      <div className="aspect-[4/3] relative bg-secondary/30">
        {imageUrl ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-secondary/50 animate-pulse" />
            )}
            <img
              src={imageUrl}
              alt={title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          </>
        ) : (
          <div className={`w-full h-full ${fallbackGradient} flex items-center justify-center text-3xl`}>
            {fallbackIcon}
          </div>
        )}
      </div>
      <div className="p-2 text-center">
        <p className="text-xs font-semibold text-foreground leading-tight line-clamp-1">
          {title}
        </p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}
