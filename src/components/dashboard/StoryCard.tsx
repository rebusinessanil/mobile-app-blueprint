import { Link } from "react-router-dom";
import { useState } from "react";

interface StoryCardProps {
  id: string;
  title: string;
  imageUrl: string;
  isActive?: boolean;
  linkTo: string;
  isPreview?: boolean;
  previewLabel?: string;
}

export default function StoryCard({
  id,
  title,
  imageUrl,
  isActive = true,
  linkTo,
  isPreview = false,
  previewLabel = "Coming Soon"
}: StoryCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const content = (
    <div className="gold-border bg-card rounded-2xl overflow-hidden">
      {/* Responsive aspect ratio container */}
      <div className="w-full aspect-square relative bg-secondary/30">
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
        {isPreview ? (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-medium">
              {previewLabel}
            </span>
          </div>
        ) : (
          <div 
            className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 ${
              isActive ? 'bg-green-500' : 'bg-yellow-500'
            } rounded-full border-2 border-white shadow-lg`} 
          />
        )}
      </div>
      <div className="p-1.5 text-center">
        <p className="text-[10px] font-semibold text-foreground leading-tight line-clamp-2">
          {title}
        </p>
      </div>
    </div>
  );

  if (isPreview) {
    return (
      <div className="w-full transition-all opacity-75">
        {content}
      </div>
    );
  }

  return (
    <Link
      to={linkTo}
      className="w-full transition-all hover:scale-105 active:scale-95"
    >
      {content}
    </Link>
  );
}
