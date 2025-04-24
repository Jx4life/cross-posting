
import React from 'react';
import { Card } from './ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

interface ScheduledPost {
  id: string;
  content: string;
  platforms: { twitter?: boolean; lens?: boolean; farcaster?: boolean };
  scheduled_at: string;
  status: string;
}

export const PostsHistory = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['scheduled-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      return data as ScheduledPost[];
    }
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'completed': return 'success';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const renderPlatforms = (platforms: ScheduledPost['platforms']) => {
    const activePlatforms = Object.entries(platforms)
      .filter(([_, enabled]) => enabled)
      .map(([platform]) => platform);
    
    return activePlatforms.join(', ');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Posts History</h2>
      {posts && posts.length === 0 ? (
        <p className="text-center text-gray-500">No scheduled posts yet.</p>
      ) : (
        posts?.map((post) => (
          <Card key={post.id} className="p-4 flex justify-between items-center">
            <div>
              <p>{post.content}</p>
              <div className="text-sm text-gray-500 mt-2">
                Platforms: {renderPlatforms(post.platforms)}
                <span className="ml-2">
                  Scheduled for: {format(new Date(post.scheduled_at), 'PPp')}
                </span>
              </div>
            </div>
            <Badge variant={getStatusBadgeVariant(post.status)}>
              {post.status}
            </Badge>
          </Card>
        ))
      )}
    </div>
  );
};

export default PostsHistory;
