
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { type Database } from "@/integrations/supabase/types";

type PostAnalytics = Database['public']['Tables']['post_analytics']['Row'];

export const usePostAnalytics = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const { 
    data: analytics, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['post-analytics', selectedPlatform],
    queryFn: async () => {
      let query = supabase
        .from('post_analytics')
        .select(`
          *,
          scheduled_posts (
            content,
            scheduled_at,
            platforms
          )
        `);

      if (selectedPlatform && selectedPlatform !== 'all') {
        query = query.eq('platform', selectedPlatform);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as (PostAnalytics & { scheduled_posts: any })[];
    }
  });

  return {
    analytics,
    isLoading,
    error,
    selectedPlatform,
    setSelectedPlatform
  };
};
