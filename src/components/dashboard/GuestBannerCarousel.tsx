import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBannerCarousel } from '@/hooks/useBannerCarousel';
import { isIOS, getOptimizedImageUrl, shouldDisableAnimations } from '@/lib/adaptiveAssets';

const GuestBannerCarousel = () => {
  const { data: images, isLoading } = useBannerCarousel();
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const [isiOSDevice] = useState(() => isIOS());
  const [animationsDisabled] = useState(() => shouldDisableAnimations());

  const totalSlides = images?.length || 0;

  const nextSlide = useCallback(() => {
    if (!totalSlides || isiOSDevice || animationsDisabled) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, [totalSlides, isiOSDevice, animationsDisabled]);

  const prevSlide = useCallback(() => {
    if (!totalSlides || isiOSDevice || animationsDisabled) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, [totalSlides, isiOSDevice, animationsDisabled]);

  // Handle infinite loop jump - disabled on iOS/mobile stability mode
  useEffect(() => {
    if (!totalSlides || isiOSDevice || animationsDisabled) return;

    const handleTransitionEnd = () => {
      if (currentIndex === 0) {
        setIsTransitioning(false);
        setCurrentIndex(totalSlides);
      }
      if (currentIndex === totalSlides + 1) {
        setIsTransitioning(false);
        setCurrentIndex(1);
      }
    };

    const track = trackRef.current;
    if (track) {
      track.addEventListener('transitionend', handleTransitionEnd);
      return () => track.removeEventListener('transitionend', handleTransitionEnd);
    }
  }, [currentIndex, totalSlides, isiOSDevice, animationsDisabled]);

  const handleCarouselClick = () => {
    navigate('/login');
  };

  // Auto-advance every 4 seconds - disabled for stability mode
  useEffect(() => {
    if (!totalSlides || totalSlides <= 1 || isiOSDevice || animationsDisabled) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [totalSlides, nextSlide, isiOSDevice, animationsDisabled]);

  if (isLoading) {
    return (
      <div className="w-full aspect-[16/9] bg-background/20 rounded-2xl animate-pulse flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!images?.length) {
    return null;
  }

  // iOS/mobile stability mode: Static single image display - no carousel, no timers, no transitions
  if (isiOSDevice || animationsDisabled) {
    return (
      <div
        className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl cursor-pointer"
        onClick={handleCarouselClick}
      >
        <img
          src={getOptimizedImageUrl(images[0].image_url)}
          alt="Banner"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <span
                key={index}
                className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-primary w-4' : 'bg-foreground/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full carousel with animations
  const slides = [images[images.length - 1], ...images, images[0]];

  const getRealIndex = () => {
    if (currentIndex === 0) return totalSlides - 1;
    if (currentIndex === totalSlides + 1) return 0;
    return currentIndex - 1;
  };

  return (
    <div
      className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl group cursor-pointer"
      onClick={handleCarouselClick}
    >
      <div
        ref={trackRef}
        className={`flex h-full ${isTransitioning ? 'transition-transform duration-300 ease-out' : ''}`}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((image, index) => (
          <img
            key={`${image.id}-${index}`}
            src={getOptimizedImageUrl(image.image_url)}
            alt={`Banner ${index + 1}`}
            className="w-full h-full object-cover flex-shrink-0"
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/60 border border-border/30 text-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/60 border border-border/30 text-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setIsTransitioning(true);
                setCurrentIndex(index + 1);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === getRealIndex() ? 'bg-primary w-4' : 'bg-foreground/40 hover:bg-foreground/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GuestBannerCarousel;

