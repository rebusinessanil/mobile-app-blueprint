import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('Birthday')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        setBirthdays(data || []);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching birthdays:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBirthdays();

    // Set up real-time subscription
    const channel = supabase
      .channel('birthdays-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Birthday',
        },
        (payload) => {
          console.log('Birthday changed:', payload);
          fetchBirthdays();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { birthdays, loading, error };
};

export const useBirthday = (birthdayId?: string) => {
  const [birthday, setBirthday] = useState<Birthday | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!birthdayId) {
      setLoading(false);
      return;
    }

    const fetchBirthday = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('Birthday')
          .select('*')
          .eq('id', birthdayId)
          .single();

        if (error) throw error;

        setBirthday(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching birthday:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBirthday();

    // Set up real-time subscription
    const channel = supabase
      .channel(`birthday-${birthdayId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Birthday',
          filter: `id=eq.${birthdayId}`,
        },
        (payload) => {
          console.log('Birthday changed:', payload);
          fetchBirthday();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [birthdayId]);

  return { birthday, loading, error };
};
