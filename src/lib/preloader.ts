/**
 * Ultra-fast preloading system for instant page loads
 * - Preloads critical modules in background
 * - Prefetches images, fonts, and API data
 * - Smart caching with priority queues
 */

// Track what's been preloaded to avoid duplicates
const preloadedModules = new Set<string>();
const preloadedImages = new Set<string>();

/**
 * Preload critical page modules in background
 */
export const preloadCriticalModules = () => {
  // High priority - Banner system (most used)
  const bannerModules = [
    () => import('@/pages/BannerPreview'),
    () => import('@/pages/RankSelection'),
    () => import('@/pages/RankBannerCreate'),
    () => import('@/pages/BirthdayBannerCreate'),
    () => import('@/pages/BonanzaBannerCreate'),
    () => import('@/pages/FestivalBannerCreate'),
    () => import('@/pages/MotivationalBannerCreate'),
    () => import('@/pages/MeetingBannerCreate'),
    () => import('@/pages/AnniversaryBannerCreate'),
    () => import('@/pages/UniversalBannerCreate'),
    () => import('@/pages/StoryBannerCreate'),
  ];

  // Medium priority - Category pages
  const categoryModules = [
    () => import('@/pages/Categories'),
    () => import('@/pages/BonanzaTripsSelection'),
    () => import('@/pages/BirthdaysSelection'),
    () => import('@/pages/FestivalSelection'),
    () => import('@/pages/MotivationalBannersSelection'),
    () => import('@/pages/AnniversariesSelection'),
  ];

  // Low priority - Other pages
  const otherModules = [
    () => import('@/pages/Profile'),
    () => import('@/pages/Wallet'),
    () => import('@/pages/MyDownloads'),
    () => import('@/pages/BannerSettings'),
  ];

  // Use requestIdleCallback for non-blocking preload
  const preloadWithPriority = (modules: (() => Promise<unknown>)[], delay: number) => {
    setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
          modules.forEach(load => load().catch(() => {}));
        });
      } else {
        modules.forEach(load => load().catch(() => {}));
      }
    }, delay);
  };

  // Stagger preloads to avoid blocking main thread
  preloadWithPriority(bannerModules, 100);
  preloadWithPriority(categoryModules, 500);
  preloadWithPriority(otherModules, 1000);
};

/**
 * Preload Banner Preview system completely
 */
export const preloadBannerPreviewSystem = async () => {
  if (preloadedModules.has('banner-preview-system')) return;
  preloadedModules.add('banner-preview-system');

  try {
    // Preload all banner-related modules in parallel
    await Promise.all([
      import('@/pages/BannerPreview'),
      import('@/hooks/useTemplates'),
      import('@/hooks/useProfile'),
      import('@/hooks/useBannerSettings'),
      import('@/hooks/useProfilePhotos'),
      import('@/hooks/useTemplateBackgrounds'),
      import('@/hooks/useStickers'),
      import('@/hooks/useWalletDeduction'),
    ]);
  } catch (e) {
    console.warn('Banner preload partial failure:', e);
  }
};

/**
 * Preload images for faster rendering
 */
export const preloadImage = (url: string): Promise<void> => {
  if (!url || preloadedImages.has(url)) return Promise.resolve();
  preloadedImages.add(url);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
};

/**
 * Preload multiple images in parallel
 */
export const preloadImages = (urls: string[]) => {
  const validUrls = urls.filter(url => url && !preloadedImages.has(url));
  return Promise.all(validUrls.map(preloadImage));
};

/**
 * Preload fonts for instant text rendering
 */
export const preloadFonts = () => {
  const fonts = [
    { family: 'Poppins', weight: '400' },
    { family: 'Poppins', weight: '600' },
    { family: 'Poppins', weight: '700' },
    { family: 'Inter', weight: '400' },
    { family: 'Inter', weight: '500' },
  ];

  fonts.forEach(font => {
    document.fonts.load(`${font.weight} 1rem ${font.family}`).catch(() => {});
  });
};

/**
 * Prefetch API data into React Query cache
 */
export const prefetchApiData = async (queryClient: unknown, userId?: string) => {
  if (!userId) return;
  
  // Dynamic import to avoid circular deps
  const { supabase } = await import('@/integrations/supabase/client');
  const qc = queryClient as import('@tanstack/react-query').QueryClient;

  // Prefetch profile
  qc.prefetchQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Prefetch ranks
  qc.prefetchQuery({
    queryKey: ['ranks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ranks')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Prefetch template categories
  qc.prefetchQuery({
    queryKey: ['template-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('template_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Initialize all preloading on app start
 */
export const initializePreloading = (queryClient?: unknown, userId?: string) => {
  // Start font preloading immediately
  preloadFonts();
  
  // Preload critical modules after initial render
  preloadCriticalModules();
  
  // Prefetch API data if user is logged in
  if (userId && queryClient) {
    prefetchApiData(queryClient, userId);
  }
};

/**
 * Hook to trigger preloading on route hover/focus
 */
export const preloadOnHover = (route: string) => {
  const routeModules: Record<string, () => Promise<unknown>> = {
    '/banner-preview': () => preloadBannerPreviewSystem(),
    '/rank-selection': () => import('@/pages/RankSelection'),
    '/categories': () => import('@/pages/Categories'),
    '/profile': () => import('@/pages/Profile'),
    '/wallet': () => import('@/pages/Wallet'),
  };

  const preloader = routeModules[route];
  if (preloader) {
    preloader().catch(() => {});
  }
};
