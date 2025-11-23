import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BonanzaTrip {
  id: string;
  title: string;
  short_title: string | null;
  trip_image_url: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useBonanzaTrips = () => {
  return useQuery({
    queryKey: ["bonanza-trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bonanza_trips")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as BonanzaTrip[];
    },
  });
};

export const useAllBonanzaTrips = () => {
  return useQuery({
    queryKey: ["all-bonanza-trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bonanza_trips")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as BonanzaTrip[];
    },
  });
};

export const useBonanzaTrip = (tripId: string | null) => {
  return useQuery({
    queryKey: ["bonanza-trip", tripId],
    queryFn: async () => {
      if (!tripId) return null;
      
      const { data, error } = await supabase
        .from("bonanza_trips")
        .select("*")
        .eq("id", tripId)
        .single();

      if (error) throw error;
      return data as BonanzaTrip;
    },
    enabled: !!tripId,
  });
};

export const useCreateBonanzaTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trip: Omit<BonanzaTrip, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("bonanza_trips")
        .insert(trip)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonanza-trips"] });
      queryClient.invalidateQueries({ queryKey: ["all-bonanza-trips"] });
      toast.success("Bonanza trip created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create trip: ${error.message}`);
    },
  });
};

export const useUpdateBonanzaTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BonanzaTrip> & { id: string }) => {
      const { data, error } = await supabase
        .from("bonanza_trips")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonanza-trips"] });
      queryClient.invalidateQueries({ queryKey: ["all-bonanza-trips"] });
      toast.success("Bonanza trip updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update trip: ${error.message}`);
    },
  });
};

export const useDeleteBonanzaTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bonanza_trips")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonanza-trips"] });
      queryClient.invalidateQueries({ queryKey: ["all-bonanza-trips"] });
      toast.success("Bonanza trip deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete trip: ${error.message}`);
    },
  });
};
