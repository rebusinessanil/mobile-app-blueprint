import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UnifiedStory {
  id: string;
  title: string;
  cover_image_url: string;
  status: "active" | "preview_only" | "inactive" | "expired";
  story_type: "generated" | "event" | "festival";
  source_type?: "event" | "festival" | "birthday" | "anniversary";
  event_date?: string;
  expires_at?: string;
  is_active?: boolean;
  created_at: string;
  background_url?: string; // First active background from story_background_slots
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

      // Fetch stories_events (birthday/anniversary events)
      const { data: eventsStories, error: eventsError } = await supabase
        .from("stories_events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true });

      if (eventsError) throw eventsError;

      // Fetch stories_festivals
      const { data: festivalsStories, error: festivalsError } = await supabase
        .from("stories_festivals")
        .select("*")
        .eq("is_active", true)
        .order("festival_date", { ascending: true });

      if (festivalsError) throw festivalsError;

      // Process generated stories with backgrounds
      const generatedWithBackgrounds = await Promise.all(
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
            status: story.status as "active" | "preview_only" | "expired",
            story_type: "generated" as const,
            source_type: story.source_type as "event" | "festival",
            event_date: story.event_date,
            expires_at: story.expires_at,
            created_at: story.created_at,
            background_url: slots?.[0]?.image_url || story.poster_url,
          };
        })
      );

      // Process events stories with backgrounds
      const eventsWithBackgrounds = await Promise.all(
        (eventsStories || []).map(async (event) => {
          const { data: slots } = await supabase
            .from("story_background_slots")
            .select("image_url")
            .eq("story_id", event.id)
            .eq("is_active", true)
            .order("slot_number", { ascending: true })
            .limit(1);

          return {
            id: event.id,
            title: event.title || event.person_name,
            cover_image_url: event.poster_url,
            status: "active" as const,
            story_type: "event" as const,
            source_type: event.event_type as "birthday" | "anniversary",
            event_date: event.event_date,
            is_active: event.is_active,
            created_at: event.created_at || new Date().toISOString(),
            background_url: slots?.[0]?.image_url || event.poster_url,
          };
        })
      );

      // Process festivals stories with backgrounds
      const festivalsWithBackgrounds = await Promise.all(
        (festivalsStories || []).map(async (festival) => {
          const { data: slots } = await supabase
            .from("story_background_slots")
            .select("image_url")
            .eq("story_id", festival.id)
            .eq("is_active", true)
            .order("slot_number", { ascending: true })
            .limit(1);

          return {
            id: festival.id,
            title: festival.festival_name,
            cover_image_url: festival.poster_url,
            status: "active" as const,
            story_type: "festival" as const,
            event_date: festival.festival_date,
            is_active: festival.is_active,
            created_at: festival.created_at || new Date().toISOString(),
            background_url: slots?.[0]?.image_url || festival.poster_url,
          };
        })
      );

      // Combine all stories and sort by event_date
      const allStories = [
        ...generatedWithBackgrounds,
        ...eventsWithBackgrounds,
        ...festivalsWithBackgrounds,
      ].sort((a, b) => {
        const dateA = new Date(a.event_date || a.created_at);
        const dateB = new Date(b.event_date || b.created_at);
        return dateA.getTime() - dateB.getTime();
      });

      setStories(allStories);
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

    // Real-time subscription for all story tables
    const generatedChannel = supabase
      .channel("unified-stories-changes")
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories_events",
        },
        () => {
          console.log("📡 Stories event update received");
          fetchAllStories();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories_festivals",
        },
        () => {
          console.log("📡 Stories festival update received");
          fetchAllStories();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "story_background_slots",
        },
        () => {
          console.log("📡 Story background slot update received");
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
