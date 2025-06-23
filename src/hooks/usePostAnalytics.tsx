
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { type Database } from "@/integrations/supabase/types";
import { startOfDay, endOfDay, subDays } from 'date-fns';

type PostAnalytics = Database['public']['Tables']['post_analytics']['Row'];

export const usePostAnalytics = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const { 
    data: analytics, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['post-analytics', selectedPlatform, dateRange],
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

      // Add date range filtering
      if (dateRange.from) {
        query = query.gte('created_at', startOfDay(dateRange.from).toISOString());
      }
      
      if (dateRange.to) {
        query = query.lte('created_at', endOfDay(dateRange.to).toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as (PostAnalytics & { scheduled_posts: any })[];
    }
  });

  // Add calculation for aggregated metrics including earnings
  const aggregatedMetrics = {
    totalLikes: analytics?.reduce((sum, item) => sum + (item.likes || 0), 0) || 0,
    totalShares: analytics?.reduce((sum, item) => sum + (item.shares || 0), 0) || 0,
    totalComments: analytics?.reduce((sum, item) => sum + (item.comments || 0), 0) || 0,
    totalImpressions: analytics?.reduce((sum, item) => sum + (item.impressions || 0), 0) || 0,
    totalEarnings: analytics?.reduce((sum, item) => sum + (Number(item.earnings) || 0), 0) || 0,
    averageEngagement: analytics?.length 
      ? (analytics.reduce((sum, item) => sum + (item.engagement_rate || 0), 0) / analytics.length).toFixed(2)
      : '0',
    postCount: analytics?.length || 0
  };

  // Add platform breakdowns including earnings
  const platformBreakdown = analytics?.reduce((acc, item) => {
    const platform = item.platform;
    if (!acc[platform]) {
      acc[platform] = { count: 0, likes: 0, shares: 0, comments: 0, impressions: 0, earnings: 0 };
    }
    acc[platform].count += 1;
    acc[platform].likes += item.likes || 0;
    acc[platform].shares += item.shares || 0;
    acc[platform].comments += item.comments || 0;
    acc[platform].impressions += item.impressions || 0;
    acc[platform].earnings += Number(item.earnings) || 0;
    
    return acc;
  }, {} as Record<string, { count: number, likes: number, shares: number, comments: number, impressions: number, earnings: number }>);

  return {
    analytics,
    isLoading,
    error,
    selectedPlatform,
    setSelectedPlatform,
    dateRange,
    setDateRange,
    refetch,
    aggregatedMetrics,
    platformBreakdown
  };
};
