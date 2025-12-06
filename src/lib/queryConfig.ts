import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized QueryClient configuration for mobile performance
 * - Aggressive caching
 * - Reduced refetch frequency
 * - Optimized garbage collection
 */
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep unused data in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Don't refetch on window focus (saves bandwidth)
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect automatically
        refetchOnReconnect: 'always',
        // Only retry once on failure
        retry: 1,
        // Retry after 1 second
        retryDelay: 1000,
        // Use previous data while fetching new data
        placeholderData: (previousData: unknown) => previousData,
        // Network mode: always try cache first
        networkMode: 'offlineFirst',
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        retryDelay: 1000,
        networkMode: 'offlineFirst',
      },
    },
  });
};

// Shared query client instance
export const queryClient = createOptimizedQueryClient();
