import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getISTDateString } from "@/lib/istUtils";

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
  // Computed field for IST-aware status
  computed_is_live?: boolean;
}

export interface StoriesEvent {
  id: string;
  event_type: string;
  event_date: string;
  start_date: string | null;
  end_date: string | null;
  person_name: string;
  poster_url: string;
  description?: string;
  is_active?: boolean;
  story_status: boolean | null;
  title?: string;
  created_at?: string;
  // Computed field for IST-aware status
  computed_is_live?: boolean;
}

export interface StoriesFestival {
  id: string;
  festival_name: string;
  festival_date: string;
  poster_url: string;
  description?: string;
  is_active?: boolean;
  story_status: boolean | null;
  start_date: string | null;
  end_date: string | null;
  created_at?: string;
  // Computed field for IST-aware status
  computed_is_live?: boolean;
}

/**
 * Compute IST-aware live status for a story
 * This ensures stories show as Live on their event_date even if DB hasn't updated yet
 */
function computeISTLiveStatus(eventDate: string, storyStatus: boolean | null): boolean {
  const istToday = getISTDateString();
  
  // If event_date matches today (IST), it should be LIVE
  if (eventDate === istToday) {
    return true;
  }
  
  // If event_date is in the past, it's expired
  if (eventDate < istToday) {
    return false; // Will be filtered out by story_status = null check
  }
  
  // Future event - check story_status from DB
  return storyStatus === true;
}

// Hook for fetching generated stories (Admin sees ALL, regular users see only visible)
export const useGeneratedStories = (adminMode: boolean = true) => {
  const [stories, setStories] = useState<GeneratedStory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    try {
      let query = supabase
        .from("stories_generated")
        .select("*")
        .order("event_date", { ascending: true });

      // Only filter for non-admin users
      if (!adminMode) {
        query = query.not("story_status", "is", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Add computed_is_live based on IST date comparison
      const storiesWithComputed = (data || []).map((story: GeneratedStory) => ({
        ...story,
        computed_is_live: computeISTLiveStatus(story.event_date, story.story_status)
      }));
      
      setStories(storiesWithComputed);
    } catch (error) {
      console.error("Error fetching generated stories:", error);
    } finally {
      setLoading(false);
    }
  }, [adminMode]);

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

// Hook for fetching stories events (Admin sees ALL, regular users see only visible)
export const useStoriesEvents = (adminMode: boolean = true) => {
  const [events, setEvents] = useState<StoriesEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      let query = supabase
        .from("stories_events")
        .select("*")
        .order("event_date", { ascending: true });

      // Only filter for non-admin users
      if (!adminMode) {
        query = query.not("story_status", "is", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Add computed_is_live based on IST date comparison
      const eventsWithComputed = (data || []).map((event: StoriesEvent) => ({
        ...event,
        computed_is_live: computeISTLiveStatus(event.event_date, event.story_status)
      }));
      
      setEvents(eventsWithComputed);
    } catch (error) {
      console.error("Error fetching stories events:", error);
    } finally {
      setLoading(false);
    }
  }, [adminMode]);

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

// Hook for fetching stories festivals (Admin sees ALL, regular users see only visible)
export const useStoriesFestivals = (adminMode: boolean = true) => {
  const [festivals, setFestivals] = useState<StoriesFestival[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFestivals = useCallback(async () => {
    try {
      let query = supabase
        .from("stories_festivals")
        .select("*")
        .order("festival_date", { ascending: true });

      // Only filter for non-admin users
      if (!adminMode) {
        query = query.not("story_status", "is", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Add computed_is_live based on IST date comparison for festivals
      const festivalsWithComputed = (data || []).map((festival: StoriesFestival) => ({
        ...festival,
        computed_is_live: computeISTLiveStatus(festival.festival_date, festival.story_status)
      }));
      
      setFestivals(festivalsWithComputed);
    } catch (error) {
      console.error("Error fetching stories festivals:", error);
    } finally {
      setLoading(false);
    }
  }, [adminMode]);

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
