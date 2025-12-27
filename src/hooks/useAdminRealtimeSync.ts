import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/logger";

/**
 * Comprehensive admin realtime sync hook
 * Ensures instant updates with zero ghost data
 */

interface UseAdminRealtimeSyncOptions {
  tables: string[];
  queryKeys: string[][];
  enabled?: boolean;
  onDataChange?: (table: string, eventType: string, payload: any) => void;
}

export function useAdminRealtimeSync({
  tables,
  queryKeys,
  enabled = true,
  onDataChange,
}: UseAdminRealtimeSyncOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const invalidateQueries = useCallback(() => {
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  }, [queryClient, queryKeys]);

  const handleChange = useCallback(
    (table: string, payload: any) => {
      logger.log(`[AdminRealtimeSync] ${payload.eventType} on ${table}`, payload);
      
      // Immediately invalidate all related queries
      invalidateQueries();
      
      // Callback for custom handling
      onDataChange?.(table, payload.eventType, payload);
    },
    [invalidateQueries, onDataChange]
  );

  useEffect(() => {
    if (!enabled || tables.length === 0) return;

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelName = `admin-realtime-${tables.join('-')}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    // Subscribe to all specified tables
    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: table,
        },
        (payload) => handleChange(table, payload)
      );
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        logger.log(`[AdminRealtimeSync] Active on: ${tables.join(', ')}`);
      } else if (status === "CHANNEL_ERROR") {
        logger.error("[AdminRealtimeSync] Channel error, reconnecting...");
        // Retry subscription after error
        setTimeout(() => {
          channel.subscribe();
        }, 2000);
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, tables.join(','), handleChange]);

  return { invalidateQueries };
}

/**
 * Hook specifically for user management with auth polling
 */
export function useAdminUsersSync(
  onUsersChange?: () => void,
  pollInterval = 10000
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up real-time subscriptions for profile/credit/role changes
    const channel = supabase
      .channel('admin-users-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          logger.log('[AdminUsersSync] Profile change detected');
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          onUsersChange?.();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_credits' },
        () => {
          logger.log('[AdminUsersSync] Credits change detected');
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          onUsersChange?.();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => {
          logger.log('[AdminUsersSync] Roles change detected');
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          onUsersChange?.();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.log('[AdminUsersSync] Realtime sync active');
        }
      });

    // Poll for auth changes (auth.users doesn't have realtime)
    const interval = setInterval(() => {
      onUsersChange?.();
    }, pollInterval);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [queryClient, onUsersChange, pollInterval]);
}

/**
 * Hook for template backgrounds with instant sync
 */
export function useAdminBackgroundsSync(
  templateId?: string,
  onBackgroundsChange?: () => void
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!templateId) return;

    const channel = supabase
      .channel(`admin-backgrounds-${templateId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'template_backgrounds',
          filter: `template_id=eq.${templateId}`
        },
        (payload) => {
          logger.log('[AdminBackgroundsSync] Background change detected', payload);
          queryClient.invalidateQueries({ queryKey: ['template-backgrounds', templateId] });
          queryClient.invalidateQueries({ queryKey: ['backgrounds'] });
          onBackgroundsChange?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [templateId, queryClient, onBackgroundsChange]);
}
