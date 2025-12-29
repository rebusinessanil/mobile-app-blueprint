import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStoryStatusIST, getISTDateString } from "@/lib/istUtils";
import { useQueryClient } from "@tanstack/react-query";

export interface UnifiedStory {
  id: string;
  title: string;
  cover_image_url: string;
  story_status: boolean | null; // false = Upcoming, true = Active, null = Hidden
  story_type: "generated";
  source_type?: "event" | "festival";
  event_date?: string;
  expires_at?: string;
  is_active?: boolean;
  created_at: string;
  background_url?: string;
  // IST-based computed status
  ist_status?: { label: string; className: string; isLive: boolean; isUpcoming: boolean; isExpired: boolean };
}

interface UseUnifiedStoriesOptions {
  adminMode?: boolean;
}

export const useUnifiedStories = (options: UseUnifiedStoriesOptions = {}) => {
  const { adminMode = false } = options;
  const [stories, setStories] = useState<UnifiedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  const fetchAllStories = useCallback(async () => {
    try {
      setLoading(true);
      const istToday = getISTDateString();

      // Build query based on mode
      let query = supabase
        .from("stories_generated")
        .select("*")
        .order("event_date", { ascending: true });

      // For user mode: only fetch stories where story_status is NOT null
      if (!adminMode) {
        query = query.not("story_status", "is", null);
      }

      const { data: generatedStories, error: generatedError } = await query;

      if (generatedError) throw generatedError;

      // Fetch first active background for each story
      const storiesWithBackgrounds = await Promise.all(
        (generatedStories || []).map(async (story) => {
          const { data: slots } = await supabase
            .from("story_background_slots")
            .select("image_url")
            .eq("story_id", story.id)
            .eq("is_active", true)
            .order("slot_number", { ascending: true })
            .limit(1);

          return {
            id: story.id,
            title: story.title,
            cover_image_url: story.poster_url,
            story_status: story.story_status as boolean | null,
            story_type: "generated" as const,
            source_type: story.source_type as "event" | "festival",
            event_date: story.event_date,
            expires_at: story.expires_at,
            created_at: story.created_at,
            background_url: slots?.[0]?.image_url || story.poster_url,
            ist_status: getStoryStatusIST(story.event_date, story.story_status as boolean | null),
          };
        })
      );

      // Apply IST-based filtering for user mode
      let filteredStories = storiesWithBackgrounds;
      if (!adminMode) {
        filteredStories = storiesWithBackgrounds.filter(story => {
          // Only show stories that are truly Live (event_date = today) or Upcoming (event_date > today)
          if (story.story_status === true) {
            return story.event_date === istToday; // Live
          } else if (story.story_status === false) {
            return story.event_date && story.event_date > istToday; // Upcoming
          }
          return false;
        });
      }

      setStories(filteredStories);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching unified stories:", err);
    } finally {
      setLoading(false);
    }
  }, [adminMode]);

  useEffect(() => {
    fetchAllStories();

    // Real-time subscription for generated stories
    const generatedChannel = supabase
      .channel("generated-stories-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories_generated",
        },
        () => {
          console.log("📡 Generated story update received - refreshing");
          queryClient.invalidateQueries({ queryKey: ["stories"] });
          queryClient.invalidateQueries({ queryKey: ["stories-generated"] });
          fetchAllStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(generatedChannel);
    };
  }, [fetchAllStories, queryClient]);

  return { stories, loading, error, refetch: fetchAllStories };
};
