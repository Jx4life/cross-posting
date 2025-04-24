
import React, { useState } from 'react';
import { Card } from './ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, History, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from './ui/pagination';

interface ScheduledPost {
  id: string;
  content: string;
  platforms: { twitter?: boolean; lens?: boolean; farcaster?: boolean };
  scheduled_at: string;
  status: string;
  created_at: string;
}

const POSTS_PER_PAGE = 5;

export const PostsHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: postsData, isLoading } = useQuery({
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

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'completed': return 'default';
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

  const totalPages = postsData ? Math.ceil(postsData.length / POSTS_PER_PAGE) : 0;
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = postsData?.slice(startIndex, startIndex + POSTS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <History className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Posts History</h2>
      </div>

      {(!postsData || postsData.length === 0) ? (
        <Card className="p-8">
          <p className="text-center text-gray-500">No scheduled posts yet.</p>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedPosts?.map((post) => (
              <Card key={post.id} className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm text-gray-500">
                      Created {format(new Date(post.created_at), 'PPp')}
                    </p>
                    <p className="text-base">{post.content}</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(post.status)}>
                    {post.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Scheduled for: {format(new Date(post.scheduled_at), 'PPp')}
                  </div>
                  <div>
                    Platforms: {renderPlatforms(post.platforms)}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default PostsHistory;
