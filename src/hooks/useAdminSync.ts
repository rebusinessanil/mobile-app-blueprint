import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/logger";

/**
 * Tables that should trigger real-time updates in the User App
 * when modified by Admin App
 */
const SYNCED_TABLES = [
  // Template & Content
  "templates",
  "template_categories", 
  "template_backgrounds",
  
  // Stickers
  "stickers",
  "sticker_categories",
  
  // Stories
  "stories",
  "stories_events",
  "stories_festivals",
  "stories_generated",
  "stories_settings",
  "story_background_slots",
  
  // Ranks & Categories
  "ranks",
  "bonanza_trips",
  "Birthday",
  "Anniversary",
  "Motivational Banner",
  
  // Banner Defaults
  "banner_defaults",
] as const;

type SyncedTable = typeof SYNCED_TABLES[number];

/**
 * Query key mapping for each table to invalidate the correct React Query cache
 */
const TABLE_TO_QUERY_KEYS: Record<SyncedTable, string[][]> = {
  templates: [["templates"], ["template"]],
  template_categories: [["categories"], ["template-categories"]],
  template_backgrounds: [["template-backgrounds"], ["backgrounds"]],
  stickers: [["stickers"], ["unified-sticker-slots"]],
  sticker_categories: [["sticker-categories"]],
  stories: [["stories"], ["unified-stories"]],
  stories_events: [["stories-events"], ["unified-stories"], ["auto-stories"]],
  stories_festivals: [["stories-festivals"], ["unified-stories"], ["festivals"]],
  stories_generated: [["stories-generated"], ["unified-stories"]],
  stories_settings: [["stories-settings"]],
  story_background_slots: [["story-backgrounds"], ["story-background-slots"]],
  ranks: [["ranks"]],
  bonanza_trips: [["bonanza-trips"], ["trips"]],
  Birthday: [["birthdays"], ["birthday"]],
  Anniversary: [["anniversaries"], ["anniversary"]],
  "Motivational Banner": [["motivational-banners"], ["motivational"]],
  banner_defaults: [["banner-defaults"]],
};

interface UseAdminSyncOptions {
  enabled?: boolean;
  onUpdate?: (table: string, payload: any) => void;
}

/**
 * Hook that subscribes to real-time updates from admin-managed tables
 * and automatically invalidates React Query cache for instant UI updates
 */
export function useAdminSync(options: UseAdminSyncOptions = {}) {
  const { enabled = true, onUpdate } = options;
  const queryClient = useQueryClient();

  const handleChange = useCallback(
    (table: SyncedTable, payload: any) => {
      logger.log(`[AdminSync] ${payload.eventType} on ${table}`, payload);
      
      // Get the query keys to invalidate for this table
      const queryKeys = TABLE_TO_QUERY_KEYS[table];
      
      if (queryKeys) {
        queryKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      
      // Call optional callback
      onUpdate?.(table, payload);
    },
    [queryClient, onUpdate]
  );

  useEffect(() => {
    if (!enabled) return;

    logger.log("[AdminSync] Setting up real-time subscriptions for admin updates");

    // Create a single channel for all table subscriptions
    const channel = supabase.channel("admin-sync");

    // Subscribe to all synced tables
    SYNCED_TABLES.forEach((table) => {
      channel.on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: table,
        },
        (payload) => handleChange(table as SyncedTable, payload)
      );
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        logger.log("[AdminSync] Real-time subscriptions active");
      } else if (status === "CHANNEL_ERROR") {
        logger.error("[AdminSync] Channel error, will retry");
      }
    });

    return () => {
      logger.log("[AdminSync] Cleaning up real-time subscriptions");
      supabase.removeChannel(channel);
    };
  }, [enabled, handleChange]);
}

/**
 * Hook to sync a specific table's changes in real-time
 * More granular than useAdminSync for specific use cases
 */
export function useTableSync<T = any>(
  tableName: string,
  options: {
    enabled?: boolean;
    onInsert?: (record: T) => void;
    onUpdate?: (record: T, oldRecord: T) => void;
    onDelete?: (oldRecord: T) => void;
  } = {}
) {
  const { enabled = true, onInsert, onUpdate, onDelete } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`table-sync-${tableName}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: tableName,
        },
        (payload) => {
          logger.log(`[TableSync:${tableName}] ${payload.eventType}`, payload);

          switch (payload.eventType) {
            case "INSERT":
              onInsert?.(payload.new as T);
              break;
            case "UPDATE":
              onUpdate?.(payload.new as T, payload.old as T);
              break;
            case "DELETE":
              onDelete?.(payload.old as T);
              break;
          }

          // Also invalidate any queries that might reference this table
          const tableKey = tableName as SyncedTable;
          if (TABLE_TO_QUERY_KEYS[tableKey]) {
            TABLE_TO_QUERY_KEYS[tableKey].forEach((key) => {
              queryClient.invalidateQueries({ queryKey: key });
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, tableName, queryClient, onInsert, onUpdate, onDelete]);
}
