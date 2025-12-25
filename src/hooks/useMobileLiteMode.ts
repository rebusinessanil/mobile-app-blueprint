import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * Mobile Lite Mode Hook
 * Detects mobile devices and provides performance optimization flags
 */
export const useMobileLiteMode = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return {
    isMobile,
    // Performance flags
    disableBackdropFilter: isMobile,
    disableComplexAnimations: isMobile,
    useStaticBackgrounds: isMobile,
    useLowQualityImages: isMobile,
  };
};

/**
 * Check if device is mobile (static check for SSR-safe usage)
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
};

/**
 * Check if device has low memory (for aggressive optimizations)
 */
export const isLowMemoryDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  // @ts-ignore - deviceMemory is not in all browsers
  const memory = navigator.deviceMemory;
  return memory !== undefined && memory < 4;
};

export default useMobileLiteMode;
