import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { getISTDateString } from "@/lib/istUtils";

export interface GeneratedStory {
  id: string;
  source_type: string;
  source_id: string;
  status: string;
  story_status: boolean | null; // false = Upcoming, true = Active, null = Hidden/Expired
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
  start_date: string | null;
  end_date: string | null;
  person_name: string;
  poster_url: string;
  description?: string;
  is_active?: boolean;
  story_status: boolean | null;
  title?: string;
  created_at?: string;
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
}

/**
 * IST-based client-side filter to verify story is truly Live
 * story_status = true means Live, false means Upcoming, null means Expired/Hidden
 */
const isStoryLiveIST = (eventDate: string | null, storyStatus: boolean | null): boolean => {
  if (storyStatus !== true) return false;
  if (!eventDate) return storyStatus === true;
  
  const istToday = getISTDateString();
  return eventDate === istToday;
};

const isStoryUpcomingIST = (eventDate: string | null, storyStatus: boolean | null): boolean => {
  if (storyStatus !== false) return false;
  if (!eventDate) return storyStatus === false;
  
  const istToday = getISTDateString();
  return eventDate > istToday;
};

// Hook for fetching generated stories (Admin sees ALL, regular users see only Live/Upcoming)
export const useGeneratedStories = (adminMode: boolean = true) => {
  const [stories, setStories] = useState<GeneratedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const fetchStories = useCallback(async () => {
    try {
      let query = supabase
        .from("stories_generated")
        .select("*")
        .order("event_date", { ascending: true });

      // For user mode: only fetch stories where story_status is NOT null (Live or Upcoming)
      if (!adminMode) {
        query = query.not("story_status", "is", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let filteredData = (data as GeneratedStory[]) || [];
      
      // Client-side IST verification for user mode
      if (!adminMode) {
        const istToday = getISTDateString();
        filteredData = filteredData.filter(story => {
          // Only show stories that are truly Live (event_date = today) or Upcoming (event_date > today)
          if (story.story_status === true) {
            return story.event_date === istToday; // Live
          } else if (story.story_status === false) {
            return story.event_date > istToday; // Upcoming
          }
          return false;
        });
      }
      
      setStories(filteredData);
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
          console.log("📡 Stories generated update received - refreshing");
          // Invalidate any related queries
          queryClient.invalidateQueries({ queryKey: ["stories"] });
          queryClient.invalidateQueries({ queryKey: ["stories-generated"] });
          fetchStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStories, queryClient]);

  return { stories, loading, refetch: fetchStories };
};

// Hook for fetching stories events (Admin sees ALL, regular users see only Live/Upcoming with is_active=true)
export const useStoriesEvents = (adminMode: boolean = true) => {
  const [events, setEvents] = useState<StoriesEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const fetchEvents = useCallback(async () => {
    try {
      let query = supabase
        .from("stories_events")
        .select("*")
        .order("event_date", { ascending: true });

      // For user mode: only fetch active events with valid story_status
      if (!adminMode) {
        query = query
          .eq("is_active", true)
          .not("story_status", "is", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let filteredData = (data as StoriesEvent[]) || [];
      
      // Client-side IST verification for user mode
      if (!adminMode) {
        const istToday = getISTDateString();
        filteredData = filteredData.filter(event => {
          // Only show events that are truly Live (event_date = today) or Upcoming (event_date > today)
          if (event.story_status === true) {
            return event.event_date === istToday; // Live
          } else if (event.story_status === false) {
            return event.event_date > istToday; // Upcoming
          }
          return false;
        });
      }
      
      setEvents(filteredData);
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
          console.log("📡 Stories events update received - refreshing");
          queryClient.invalidateQueries({ queryKey: ["stories"] });
          queryClient.invalidateQueries({ queryKey: ["stories-events"] });
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents, queryClient]);

  return { events, loading, refetch: fetchEvents };
};

// Hook for fetching stories festivals (Admin sees ALL, regular users see only Live/Upcoming with is_active=true)
export const useStoriesFestivals = (adminMode: boolean = true) => {
  const [festivals, setFestivals] = useState<StoriesFestival[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const fetchFestivals = useCallback(async () => {
    try {
      let query = supabase
        .from("stories_festivals")
        .select("*")
        .order("festival_date", { ascending: true });

      // For user mode: only fetch active festivals with valid story_status
      if (!adminMode) {
        query = query
          .eq("is_active", true)
          .not("story_status", "is", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let filteredData = (data as StoriesFestival[]) || [];
      
      // Client-side IST verification for user mode
      if (!adminMode) {
        const istToday = getISTDateString();
        filteredData = filteredData.filter(festival => {
          // Only show festivals that are truly Live (festival_date = today) or Upcoming (festival_date > today)
          if (festival.story_status === true) {
            return festival.festival_date === istToday; // Live
          } else if (festival.story_status === false) {
            return festival.festival_date > istToday; // Upcoming
          }
          return false;
        });
      }
      
      setFestivals(filteredData);
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
          console.log("📡 Stories festivals update received - refreshing");
          queryClient.invalidateQueries({ queryKey: ["stories"] });
          queryClient.invalidateQueries({ queryKey: ["festivals"] });
          fetchFestivals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFestivals, queryClient]);

  return { festivals, loading, refetch: fetchFestivals };
};
