import { QueryClient } from '@tanstack/react-query';

/**
 * Ultra-optimized QueryClient for instant page loads
 * - Aggressive caching with long stale times
 * - Offline-first network mode
 * - Smart background refetching
 */
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 10 minutes (increased for faster loads)
        staleTime: 10 * 60 * 1000,
        // Keep unused data in cache for 1 hour
        gcTime: 60 * 60 * 1000,
        // Don't refetch on window focus (saves bandwidth)
        refetchOnWindowFocus: false,
        // Only refetch on reconnect if data is stale
        refetchOnReconnect: false,
        // Don't refetch on mount if data exists
        refetchOnMount: false,
        // Only retry once on failure
        retry: 1,
        // Retry after 500ms for faster recovery
        retryDelay: 500,
        // Use previous data while fetching (instant UI)
        placeholderData: (previousData: unknown) => previousData,
        // Offline-first: serve cache immediately
        networkMode: 'offlineFirst',
        // Structure sharing for memory efficiency
        structuralSharing: true,
      },
      mutations: {
        retry: 1,
        retryDelay: 500,
        networkMode: 'offlineFirst',
      },
    },
  });
};

// Shared query client instance - singleton
export const queryClient = createOptimizedQueryClient();

/**
 * Prefetch common queries on app initialization
 */
export const prefetchCommonData = async (userId?: string) => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  // Prefetch ranks (used everywhere)
  queryClient.prefetchQuery({
    queryKey: ['ranks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ranks')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 mins for static data
  });

  // Prefetch template categories
  queryClient.prefetchQuery({
    queryKey: ['template-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('template_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });

  // Prefetch user profile if logged in
  if (userId) {
    queryClient.prefetchQuery({
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
  }
};
