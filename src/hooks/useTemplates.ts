import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Rank {
  id: string;
  name: string;
  color: string;
  gradient: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  category_id: string;
  rank_id: string | null;
  trip_id: string | null;
  birthday_id: string | null;
  anniversary_id: string | null;
  motivational_banner_id: string | null;
  festival_id: string | null;
  name: string;
  description: string | null;
  cover_thumbnail_url: string;
  gradient_colors: string[] | null;
  required_fields: any;
  layout_config: any;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  ranks?: {
    name: string;
    color: string;
    icon: string;
  } | null;
}


export const useTemplateCategories = () => {
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('template_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

    // Set up real-time subscription for instant category updates
    const channel = supabase
      .channel(`template-categories-changes-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'template_categories',
        },
        (payload) => {
          console.log('📡 Category update received:', payload);
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { categories, loading, error };
};

export const useTemplates = (categoryId?: string, tripId?: string, rankId?: string, birthdayId?: string, anniversaryId?: string, motivationalBannerId?: string, festivalId?: string, storiesEventsId?: string) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('templates')
          .select('*, ranks(name, color, icon)')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        if (tripId) {
          query = query.eq('trip_id', tripId);
        }

      if (rankId) {
        query = query.eq('rank_id', rankId);
      }

      if (birthdayId) {
        query = query.eq('birthday_id', birthdayId);
      }

      if (anniversaryId) {
        query = query.eq('anniversary_id', anniversaryId);
      }

      if (motivationalBannerId) {
        query = query.eq('motivational_banner_id', motivationalBannerId);
      }

      if (festivalId) {
        query = query.eq('festival_id', festivalId);
      }

      if (storiesEventsId) {
        query = query.eq('stories_events_id', storiesEventsId);
      }

      const { data, error } = await query;

        if (error) throw error;
        setTemplates(data || []);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching templates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();

    // Real-time subscription for instant cover updates
    const filterKey = tripId 
      ? `trip_id=eq.${tripId}` 
      : rankId 
      ? `rank_id=eq.${rankId}`
      : birthdayId
      ? `birthday_id=eq.${birthdayId}`
      : anniversaryId
      ? `anniversary_id=eq.${anniversaryId}`
      : motivationalBannerId
      ? `motivational_banner_id=eq.${motivationalBannerId}`
      : festivalId
      ? `festival_id=eq.${festivalId}`
      : storiesEventsId
      ? `stories_events_id=eq.${storiesEventsId}`
      : categoryId 
      ? `category_id=eq.${categoryId}` 
      : undefined;
    const channel = supabase
      .channel(`templates-changes-${categoryId || tripId || rankId || birthdayId || anniversaryId || motivationalBannerId || festivalId || storiesEventsId || 'all'}-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'templates',
          filter: filterKey,
        },
        (payload) => {
          console.log('📡 Template update received:', payload);
          fetchTemplates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [categoryId, tripId, rankId, birthdayId, anniversaryId, motivationalBannerId, festivalId, storiesEventsId]);

  return { templates, loading, error };
};


export const useAdminTemplates = () => {
  const updateCategoryCover = async (
    categoryId: string,
    file: File
  ) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `category-${categoryId}-${Date.now()}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('template-covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('template-covers')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('template_categories')
        .update({ cover_image_url: publicUrl })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateTemplateCover = async (
    templateId: string,
    file: File
  ) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `template-${templateId}-${Date.now()}.${fileExt}`;
      const filePath = `templates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('template-covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('template-covers')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('templates')
        .update({ cover_thumbnail_url: publicUrl })
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const createTemplate = async (
    categoryId: string,
    name: string,
    file: File,
    description?: string,
    rankId?: string
  ) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `template-${Date.now()}.${fileExt}`;
      const filePath = `templates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('template-covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('template-covers')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('templates')
        .insert({
          category_id: categoryId,
          name,
          description,
          cover_thumbnail_url: publicUrl,
          rank_id: rankId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  return { updateCategoryCover, updateTemplateCover, createTemplate };
};

export const useRanks = () => {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRanks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setRanks(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanks();
  }, []);

  return { ranks, loading, error, refetch: fetchRanks };
};
