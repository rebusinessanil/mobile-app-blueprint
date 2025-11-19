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

export interface Story {
  id: string;
  category_id: string;
  title: string;
  cover_image_url: string;
  type: string;
  content_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

export const useTemplates = (categoryId?: string) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        let query = supabase
          .from('templates')
          .select('*, ranks(name, color, icon)')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setTemplates(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();

    // Real-time subscription for instant updates
    const channel = supabase
      .channel(`templates-changes-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'templates',
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
  }, [categoryId]);

  return { templates, loading, error };
};

export const useStories = (categoryId?: string) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        let query = supabase
          .from('stories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setStories(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();

    // Real-time subscription
    const channel = supabase
      .channel('stories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
        },
        () => {
          fetchStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [categoryId]);

  return { stories, loading, error };
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
