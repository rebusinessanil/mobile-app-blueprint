import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBannerCarousel } from '@/hooks/useBannerCarousel';

const GuestBannerCarousel = () => {
  const { data: images, isLoading } = useBannerCarousel();
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    if (!images?.length) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images?.length]);

  const prevSlide = useCallback(() => {
    if (!images?.length) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images?.length]);

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (!images?.length || images.length <= 1) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [images?.length, nextSlide]);

  if (isLoading) {
    return (
      <div className="w-full h-40 bg-background/20 rounded-t-2xl animate-pulse flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!images?.length) {
    return null;
  }

  return (
    <div className="relative w-full h-40 overflow-hidden rounded-t-2xl group">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={images[currentIndex].image_url}
          alt={`Banner ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        />
      </AnimatePresence>

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />

      {/* Navigation arrows - only show if more than 1 image */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-border/30 text-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
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
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
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
