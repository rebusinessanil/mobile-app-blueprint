import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  initializePreloading,
  preloadBannerPreviewSystem,
  preloadImages,
  preloadOnHover,
} from '@/lib/preloader';

/**
 * Custom hook for intelligent preloading based on user navigation patterns
 */
export const usePreloader = () => {
  const location = useLocation();
  const queryClient = useQueryClient();

  // Initialize preloading on first render
  useEffect(() => {
    let userId: string | undefined;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;
      initializePreloading(queryClient, userId);
    };

    init();
  }, [queryClient]);

  // Preload next likely pages based on current route
  useEffect(() => {
    const path = location.pathname;

    // On Dashboard - preload Banner system and category pages
    if (path === '/dashboard') {
      preloadBannerPreviewSystem();
    }

    // On category selection - preload banner create and preview
    if (path.includes('/categories') || path.includes('/selection')) {
      preloadBannerPreviewSystem();
    }

    // On any banner create page - preload preview system
    if (
      path.includes('/banner-create') ||
      path.includes('/rank-banner-create') ||
      path.includes('/birthday-banner-create') ||
      path.includes('/bonanza-banner-create') ||
      path.includes('/festival-banner-create') ||
      path.includes('/motivational-banner-create') ||
      path.includes('/meeting-banner-create') ||
      path.includes('/anniversary-banner-create') ||
      path.includes('/story-banner-create')
    ) {
      preloadBannerPreviewSystem();
    }

    // On rank selection - preload rank banner create and preview
    if (path === '/rank-selection') {
      preloadBannerPreviewSystem();
    }
  }, [location.pathname]);

  // Preload images when template data is available
  const preloadTemplateImages = useCallback((imageUrls: string[]) => {
    if (imageUrls.length > 0) {
      preloadImages(imageUrls);
    }
  }, []);

  // Preload on link hover
  const handleLinkHover = useCallback((route: string) => {
    preloadOnHover(route);
  }, []);

  return {
    preloadTemplateImages,
    handleLinkHover,
  };
};

export default usePreloader;
