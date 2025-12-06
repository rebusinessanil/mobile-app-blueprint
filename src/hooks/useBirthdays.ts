import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface Birthday {
  id: string;
  title: string;
  short_title?: string;
  description?: string;
  Birthday_image_url: string;
  category_id?: string;
  is_active: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export const useBirthdays = () => {
  const queryClient = useQueryClient();

  const { data: birthdays, isLoading, error, refetch } = useQuery({
    queryKey: ['birthdays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Birthday')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Birthday[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('birthdays-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Birthday',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['birthdays'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { 
    birthdays: birthdays || [], 
    loading: isLoading, 
    error 
  };
};

export const useBirthday = (birthdayId?: string) => {
  const { data: birthday, isLoading, error } = useQuery({
    queryKey: ['birthday', birthdayId],
    queryFn: async () => {
      if (!birthdayId) return null;

      const { data, error } = await supabase
        .from('Birthday')
        .select('*')
        .eq('id', birthdayId)
        .single();

      if (error) throw error;
      return data as Birthday;
    },
    enabled: !!birthdayId,
  });

  return { 
    birthday: birthday || null, 
    loading: isLoading, 
    error 
  };
};
