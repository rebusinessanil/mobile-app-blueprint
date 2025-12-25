import { useState, useEffect } from 'react';

// Detect if device is mobile for performance optimizations
export function useMobilePerformance() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLowPowerDevice, setIsLowPowerDevice] = useState(false);

  useEffect(() => {
    // Check screen width
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check for low-power indicators
    const checkLowPower = () => {
      const isTouchDevice = 'ontouchstart' in window;
      const isSmallScreen = window.innerWidth < 768;
      const hasLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
      const hasSlowConnection = (navigator as any).connection?.effectiveType === '2g' || 
                                 (navigator as any).connection?.effectiveType === 'slow-2g';
      
      setIsLowPowerDevice(
        (isTouchDevice && isSmallScreen) || hasLowMemory || hasSlowConnection
      );
    };

    checkMobile();
    checkLowPower();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, isLowPowerDevice };
}

// Simple check without hook for CSS-in-JS or one-time checks
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || 'ontouchstart' in window;
}

// Check if we should reduce motion for accessibility/performance
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
