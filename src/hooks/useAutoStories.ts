import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface GeneratedStory {
  id: string;
  source_type: "event" | "festival";
  source_id: string;
  status: "preview_only" | "active" | "expired";
  poster_url: string;
  title: string;
  event_date: string;
  expires_at: string;
  created_at: string;
}

export interface StoriesEvent {
  id: string;
  event_type: "birthday" | "anniversary";
  event_date: string;
  person_name: string;
  poster_url: string;
  description: string | null;
  title: string | null;
  is_active: boolean | null;
}

export interface StoriesFestival {
  id: string;
  festival_name: string;
  festival_date: string;
  poster_url: string;
  description: string | null;
  is_active: boolean;
}

export const useGeneratedStories = () => {
  const [stories, setStories] = useState<GeneratedStory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from("stories_generated")
        .select("*")
        .in("status", ["preview_only", "active"])
        .gte("expires_at", new Date().toISOString())
        .order("event_date", { ascending: true });

      if (error) throw error;
      setStories((data as GeneratedStory[]) || []);
    } catch (error) {
      logger.error("Error fetching generated stories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();

    const channel = supabase
      .channel("stories_generated_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories_generated",
        },
        () => {
          fetchStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stories, loading, refetch: fetchStories };
};

export const useStoriesEvents = () => {
  const [events, setEvents] = useState<StoriesEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("stories_events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents((data as StoriesEvent[]) || []);
    } catch (error) {
      logger.error("Error fetching stories events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel("stories_events_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories_events",
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { events, loading, refetch: fetchEvents };
};

export const useStoriesFestivals = () => {
  const [festivals, setFestivals] = useState<StoriesFestival[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFestivals = async () => {
    try {
      const { data, error } = await supabase
        .from("stories_festivals")
        .select("*")
        .eq("is_active", true)
        .order("festival_date", { ascending: true });

      if (error) throw error;
      setFestivals((data as StoriesFestival[]) || []);
    } catch (error) {
      logger.error("Error fetching stories festivals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFestivals();

    const channel = supabase
      .channel("stories_festivals_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories_festivals",
        },
        () => {
          fetchFestivals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { festivals, loading, refetch: fetchFestivals };
};
