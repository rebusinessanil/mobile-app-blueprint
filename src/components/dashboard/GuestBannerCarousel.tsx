import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBannerCarousel } from '@/hooks/useBannerCarousel';
import PremiumGlobalLoader from '@/components/PremiumGlobalLoader';

const GuestBannerCarousel = () => {
  const { data: images, isLoading } = useBannerCarousel();
  const [currentIndex, setCurrentIndex] = useState(1); // Start at 1 because of cloned first slide
  const [isTransitioning, setIsTransitioning] = useState(true);
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);

  const totalSlides = images?.length || 0;

  const nextSlide = useCallback(() => {
    if (!totalSlides) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (!totalSlides) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, [totalSlides]);

  // Handle infinite loop jump
  useEffect(() => {
    if (!totalSlides) return;
    
    const handleTransitionEnd = () => {
      // If we're at the cloned last slide (index 0), jump to real last slide
      if (currentIndex === 0) {
        setIsTransitioning(false);
        setCurrentIndex(totalSlides);
      }
      // If we're at the cloned first slide (index totalSlides + 1), jump to real first slide
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
  }, [currentIndex, totalSlides]);

  const handleCarouselClick = () => {
    navigate('/login');
  };

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (!totalSlides || totalSlides <= 1) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [totalSlides, nextSlide]);

  if (isLoading) {
    return (
      <div className="w-full aspect-[16/9] bg-background/20 rounded-2xl flex items-center justify-center">
        <PremiumGlobalLoader size="md" showMessage={false} fullScreen={false} />
      </div>
    );
  }

  if (!images?.length) {
    return null;
  }

  // Create slides array with clones for infinite loop: [lastClone, ...originals, firstClone]
  const slides = [
    images[images.length - 1], // Clone of last slide
    ...images,
    images[0], // Clone of first slide
  ];

  // Get real index for dot indicators (0-based)
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
            src={image.image_url}
            alt={`Banner ${index + 1}`}
            className="w-full h-full object-cover flex-shrink-0"
          />
        ))}
      </div>

      {/* Navigation arrows - only show if more than 1 image */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-border/30 text-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-border/30 text-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dot indicators */}
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
                index === getRealIndex()
                  ? 'bg-primary w-4'
                  : 'bg-foreground/40 hover:bg-foreground/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GuestBannerCarousel;
