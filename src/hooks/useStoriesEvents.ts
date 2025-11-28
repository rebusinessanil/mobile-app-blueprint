import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StoryEvent {
  id: string;
  title: string;
  image_url: string;
  story_type: "festival" | "category" | "event" | "offer";
  festival_id?: string | null;
  category_id?: string | null;
  is_active: boolean;
  priority: number;
  start_date: string;
  end_date: string;
  event_type?: string;
  person_name?: string;
  poster_url?: string;
  description?: string | null;
  created_at?: string;
}

export const useStoriesEvents = (limit?: number) => {
  const [stories, setStories] = useState<StoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    try {
      let query = supabase
        .from("stories_events")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", new Date().toISOString().split("T")[0])
        .gte("end_date", new Date().toISOString().split("T")[0])
        .order("priority", { ascending: false })
        .order("start_date", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStories((data as StoryEvent[]) || []);
    } catch (error) {
      console.error("Error fetching stories events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();

    const channel = supabase
      .channel("stories_events_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories_events",
        },
        () => {
          fetchStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { stories, loading, refetch: fetchStories };
};
