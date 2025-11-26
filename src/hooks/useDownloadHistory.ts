import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DownloadRecord {
  id: string;
  category_name: string;
  banner_url: string | null;
  template_id: string | null;
  downloaded_at: string;
}

export function useDownloadHistory(userId?: string) {
  return useQuery({
    queryKey: ["download-history", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("banner_downloads")
        .select("*")
        .eq("user_id", userId)
        .order("downloaded_at", { ascending: false });

      if (error) throw error;
      return data as DownloadRecord[];
    },
    enabled: !!userId,
  });
}
