import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HowToUseCard {
  image: string;
  title: string;
  description: string;
}

export interface Feature {
  image: string;
  title: string;
  description: string;
}

export interface Benefit {
  text: string;
}

export interface TrustBadge {
  image: string;
  text: string;
}

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  hero_title: string;
  hero_subtitle: string | null;
  hero_image: string | null;
  hero_cta_text: string;
  product_ids: string[];
  how_to_use_cards: HowToUseCard[];
  show_reviews: boolean;
  video_url: string | null;
  video_title: string | null;
  features: Feature[];
  benefits: Benefit[];
  trust_badges: TrustBadge[];
  accent_color: string | null;
  secondary_cta_text: string | null;
  countdown_end_date: string | null;
  offer_text: string | null;
  
  // Section 2
  section2_badge?: string | null;
  section2_title?: string | null;
  section2_subtitle?: string | null;
  section2_images?: string[];
  section2_image?: string | null;
  section2_overlay_text?: string | null;
  section2_cta_text?: string | null;
  section2_phone_text?: string | null;
  
  // Section 3
  section3_badge?: string | null;
  section3_title?: string | null;
  
  // Section 4
  section4_title?: string | null;
  section4_subtitle?: string | null;
  section4_image?: string | null;
  section4_cta_text?: string | null;
  
  // Section 5
  section5_image?: string | null;
  
  // Section 6
  section6_title?: string | null;
  section6_subtitle?: string | null;
  section6_packages?: any[];
  section6_show_sticky_bar?: boolean;
  section6_sticky_text?: string | null;
  section6_sticky_countdown?: string | null;

  created_at: string;
  updated_at: string;
}

const mapLandingPage = (d: any): LandingPage => ({
  ...d,
  how_to_use_cards: d.how_to_use_cards || [],
  features: d.features || [],
  benefits: d.benefits || [],
  trust_badges: d.trust_badges || [],
  section2_images: d.section2_images || [],
  section6_packages: d.section6_packages || [],
  accent_color: d.accent_color || '#ef4444',
  video_title: d.video_title || 'Product Showcase',
  secondary_cta_text: d.secondary_cta_text || 'Buy Now',
  section6_show_sticky_bar: d.section6_show_sticky_bar ?? true,
});

export const useLandingPages = () => {
  return useQuery({
    queryKey: ['landing_pages'],
    queryFn: async () => {
      // Explicitly select columns to avoid errors if some are missing in DB
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapLandingPage);
    },
  });
};

export const useLandingPage = (slug: string) => {
  return useQuery({
    queryKey: ['landing_page', slug],
    queryFn: async () => {
      // Explicitly select columns to avoid errors if some are missing in DB
      // Note: Add new columns to this list once migration is applied
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapLandingPage(data);
    },
    enabled: !!slug,
  });
};


export const useCreateLandingPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (page: Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('landing_pages')
        .insert({
          ...page,
          how_to_use_cards: JSON.parse(JSON.stringify(page.how_to_use_cards)),
          features: JSON.parse(JSON.stringify(page.features)),
          benefits: JSON.parse(JSON.stringify(page.benefits)),
          trust_badges: JSON.parse(JSON.stringify(page.trust_badges)),
          section2_images: JSON.parse(JSON.stringify(page.section2_images || [])),
          section6_packages: JSON.parse(JSON.stringify(page.section6_packages || [])),
        } as any)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Failed to create landing page - check permissions');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landing_pages'] });
      toast.success('Landing page created');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });
};

export const useUpdateLandingPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...page }: Partial<LandingPage> & { id: string }) => {
      const payload: any = { ...page };
      if (page.how_to_use_cards) payload.how_to_use_cards = JSON.parse(JSON.stringify(page.how_to_use_cards));
      if (page.features) payload.features = JSON.parse(JSON.stringify(page.features));
      if (page.benefits) payload.benefits = JSON.parse(JSON.stringify(page.benefits));
      if (page.trust_badges) payload.trust_badges = JSON.parse(JSON.stringify(page.trust_badges));
      if (page.section2_images) payload.section2_images = JSON.parse(JSON.stringify(page.section2_images));
      if (page.section6_packages) payload.section6_packages = JSON.parse(JSON.stringify(page.section6_packages));
      
      const { data, error } = await supabase
        .from('landing_pages')
        .update(payload)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Failed to update landing page - check permissions');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landing_pages'] });
      toast.success('Landing page updated');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });
};

export const useDeleteLandingPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landing_pages'] });
      toast.success('Landing page deleted');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });
};
