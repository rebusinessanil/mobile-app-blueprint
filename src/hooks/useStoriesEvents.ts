import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StoryEvent {
  id: string;
  event_type: string;
  event_date: string;
  person_name: string;
  poster_url: string;
  title: string | null;
  description: string | null;
  is_active: boolean | null;
  priority: number | null;
  start_date: string | null;
  end_date: string | null;
}

export const useStoriesEvents = () => {
  const { data: stories = [], isLoading, error, refetch } = useQuery({
    queryKey: ["stories-events-active"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("stories_events")
        .select("*")
        .eq("is_active", true)
        .or(`end_date.gte.${today},end_date.is.null`)
        .order("priority", { ascending: false })
        .order("event_date", { ascending: true })
        .limit(16);

      if (error) throw error;
      return (data || []) as StoryEvent[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time sync
  });

  return {
    stories,
    loading: isLoading,
    error,
    refetch,
  };
};
