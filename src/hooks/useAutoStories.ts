import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GeneratedStory {
  id: string;
  source_type: string;
  source_id: string;
  status: string;
  story_status: boolean | null; // false = Upcoming, true = Active, null = Hidden
  poster_url: string;
  title: string;
  event_date: string;
  expires_at: string;
  created_at: string;
}

export interface StoriesEvent {
  id: string;
  event_type: string;
  event_date: string;
  person_name: string;
  poster_url: string;
  description?: string;
  is_active?: boolean;
  story_status: boolean | null;
}

export interface StoriesFestival {
  id: string;
  festival_name: string;
  festival_date: string;
  poster_url: string;
  description?: string;
  is_active?: boolean;
  story_status: boolean | null;
}

// Hook for fetching generated stories (only non-null story_status)
export const useGeneratedStories = () => {
  const [stories, setStories] = useState<GeneratedStory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("stories_generated")
        .select("*")
        .not("story_status", "is", null) // Only fetch visible stories
        .order("event_date", { ascending: true });

      if (error) throw error;
      setStories((data as GeneratedStory[]) || []);
    } catch (error) {
      console.error("Error fetching generated stories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();

    const channel = supabase
      .channel("stories-generated-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories_generated",
        },
        () => {
          console.log("📡 Stories generated update received");
          fetchStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStories]);

  return { stories, loading, refetch: fetchStories };
};

// Hook for fetching stories events (only non-null story_status)
export const useStoriesEvents = () => {
  const [events, setEvents] = useState<StoriesEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("stories_events")
        .select("*")
        .not("story_status", "is", null) // Only fetch visible events
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents((data as StoriesEvent[]) || []);
    } catch (error) {
      console.error("Error fetching stories events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel("stories-events-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories_events",
        },
        () => {
          console.log("📡 Stories events update received");
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  return { events, loading, refetch: fetchEvents };
};

// Hook for fetching stories festivals (only non-null story_status)
export const useStoriesFestivals = () => {
  const [festivals, setFestivals] = useState<StoriesFestival[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFestivals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("stories_festivals")
        .select("*")
        .not("story_status", "is", null) // Only fetch visible festivals
        .order("festival_date", { ascending: true });

      if (error) throw error;
      setFestivals((data as StoriesFestival[]) || []);
    } catch (error) {
      console.error("Error fetching stories festivals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFestivals();

    const channel = supabase
      .channel("stories-festivals-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories_festivals",
        },
        () => {
          console.log("📡 Stories festivals update received");
          fetchFestivals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFestivals]);

  return { festivals, loading, refetch: fetchFestivals };
};
