import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
}

export const useUnifiedStories = () => {
  const [stories, setStories] = useState<UnifiedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllStories = async () => {
    try {
      setLoading(true);

      // Fetch stories where story_status is NOT null (only visible stories)
      const { data: generatedStories, error: generatedError } = await supabase
        .from("stories_generated")
        .select("*")
        .not("story_status", "is", null) // Only fetch non-null story_status
        .order("event_date", { ascending: true });

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
          console.log("📡 Generated story update received");
          fetchAllStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(generatedChannel);
    };
  }, []);

  return { stories, loading, error, refetch: fetchAllStories };
};
