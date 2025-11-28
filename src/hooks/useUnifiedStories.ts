import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UnifiedStory {
  id: string;
  title: string;
  cover_image_url: string;
  status: "active" | "preview_only" | "inactive" | "expired";
  story_type: "generated";
  source_type?: "event" | "festival";
  event_date?: string;
  expires_at?: string;
  is_active?: boolean;
  created_at: string;
}

export const useUnifiedStories = () => {
  const [stories, setStories] = useState<UnifiedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllStories = async () => {
    try {
      setLoading(true);

      // Fetch auto-generated stories
      const { data: generatedStories, error: generatedError } = await supabase
        .from("stories_generated")
        .select("*")
        .in("status", ["preview_only", "active"])
        .gte("expires_at", new Date().toISOString())
        .order("event_date", { ascending: true });

      if (generatedError) throw generatedError;

      // Combine and format stories (only generated stories now)
      const unified: UnifiedStory[] = [
        ...(generatedStories || []).map((story) => ({
          id: story.id,
          title: story.title,
          cover_image_url: story.poster_url,
          status: story.status as "active" | "preview_only" | "expired",
          story_type: "generated" as const,
          source_type: story.source_type as "event" | "festival",
          event_date: story.event_date,
          expires_at: story.expires_at,
          created_at: story.created_at,
        })),
      ];

      setStories(unified);
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
