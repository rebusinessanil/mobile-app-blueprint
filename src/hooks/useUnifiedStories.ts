import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UnifiedStory {
  id: string;
  title: string;
  cover_image_url: string;
  event_type: string;
  person_name?: string;
  festival_name?: string;
  is_active: boolean;
  priority?: number;
  event_date: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  background_url?: string;
}

export const useUnifiedStories = () => {
  const [stories, setStories] = useState<UnifiedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllStories = async () => {
    try {
      setLoading(true);

      // Fetch from stories_events - single source of truth
      // Filter: active stories, not expired, limit 16, sorted by priority then start_date
      const today = new Date().toISOString().split('T')[0];
      
      const { data: storiesEvents, error: eventsError } = await supabase
        .from("stories_events")
        .select("*")
        .eq("is_active", true)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order("priority", { ascending: false })
        .order("start_date", { ascending: true })
        .limit(16);

      if (eventsError) throw eventsError;

      // Fetch first active background for each story
      const storiesWithBackgrounds = await Promise.all(
        (storiesEvents || []).map(async (story) => {
          const { data: slots } = await supabase
            .from("story_background_slots")
            .select("image_url")
            .eq("story_id", story.id)
            .eq("is_active", true)
            .order("slot_number", { ascending: true })
            .limit(1);

          return {
            id: story.id,
            title: story.title || `${story.event_type} - ${story.person_name || story.festival_id}`,
            cover_image_url: story.poster_url,
            event_type: story.event_type,
            person_name: story.person_name,
            festival_name: story.festival_id,
            is_active: story.is_active ?? true,
            priority: story.priority,
            event_date: story.event_date,
            start_date: story.start_date,
            end_date: story.end_date,
            created_at: story.created_at,
            background_url: slots?.[0]?.image_url || story.poster_url,
          };
        })
      );

      setStories(storiesWithBackgrounds);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching unified stories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStories();

    // Real-time subscription for stories_events - instant sync
    const storiesChannel = supabase
      .channel("stories-events-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories_events",
        },
        (payload) => {
          console.log("📡 Stories update received:", payload);
          fetchAllStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(storiesChannel);
    };
  }, []);

  return { stories, loading, error, refetch: fetchAllStories };
};
