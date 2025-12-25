import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CarouselImage {
  id: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useBannerCarousel = () => {
  return useQuery({
    queryKey: ['banner-carousel-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banner_carousel_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data as CarouselImage[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useBannerCarouselAdmin = () => {
  const queryClient = useQueryClient();

  const fetchAllImages = useQuery({
    queryKey: ['banner-carousel-images-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banner_carousel_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as CarouselImage[];
    },
  });

  const addImage = useMutation({
    mutationFn: async (imageUrl: string) => {
      // Get max display order
      const { data: existing } = await supabase
        .from('banner_carousel_images')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);

      const maxOrder = existing?.[0]?.display_order ?? -1;

      const { error } = await supabase
        .from('banner_carousel_images')
        .insert({
          image_url: imageUrl,
          display_order: maxOrder + 1,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner-carousel-images'] });
      queryClient.invalidateQueries({ queryKey: ['banner-carousel-images-admin'] });
      toast.success('Image added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add image: ' + error.message);
    },
  });

  const deleteImage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banner_carousel_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner-carousel-images'] });
      queryClient.invalidateQueries({ queryKey: ['banner-carousel-images-admin'] });
      toast.success('Image deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete image: ' + error.message);
    },
  });

  const reorderImages = useMutation({
    mutationFn: async (images: { id: string; display_order: number }[]) => {
      for (const img of images) {
        const { error } = await supabase
          .from('banner_carousel_images')
          .update({ display_order: img.display_order })
          .eq('id', img.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner-carousel-images'] });
      queryClient.invalidateQueries({ queryKey: ['banner-carousel-images-admin'] });
      toast.success('Order updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to reorder: ' + error.message);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('banner_carousel_images')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner-carousel-images'] });
      queryClient.invalidateQueries({ queryKey: ['banner-carousel-images-admin'] });
      toast.success('Status updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  return {
    images: fetchAllImages.data ?? [],
    isLoading: fetchAllImages.isLoading,
    addImage,
    deleteImage,
    reorderImages,
    toggleActive,
  };
};
