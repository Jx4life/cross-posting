import React, { useState } from 'react';
import { Card } from './ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, History, Calendar, Image, Video, Pencil, Trash2, X } from 'lucide-react';
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
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from './ui/textarea';
import { PlatformToggleButtons } from './composer/PlatformToggleButtons';
import { SchedulePicker } from './SchedulePicker';
import { MediaUploader } from './MediaUploader';

interface ScheduledPost {
  id: string;
  content: string;
  platforms: { twitter?: boolean; lens?: boolean; farcaster?: boolean; facebook?: boolean; instagram?: boolean; tiktok?: boolean; youtubeShorts?: boolean };
  scheduled_at: string;
  status: string;
  created_at: string;
  media_url: string | null;
  media_type: string | null;
}

const POSTS_PER_PAGE = 5;

export const PostsHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedPlatforms, setEditedPlatforms] = useState<any>({});
  const [editedScheduleAt, setEditedScheduleAt] = useState<Date | null>(null);
  const [editedMediaUrl, setEditedMediaUrl] = useState<string | null>(null);
  const [editedMediaType, setEditedMediaType] = useState<'image' | 'video' | null>(null);

  const queryClient = useQueryClient();
  
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

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Post deleted",
        description: "The scheduled post has been deleted successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      setDeleteDialogOpen(false);
      setSelectedPost(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: `Failed to delete post: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      content,
      platforms,
      scheduledAt,
      mediaUrl,
      mediaType
    }: {
      id: string;
      content: string;
      platforms: any;
      scheduledAt: Date | null;
      mediaUrl: string | null;
      mediaType: 'image' | 'video' | null;
    }) => {
      if (!scheduledAt) {
        throw new Error("Schedule date is required");
      }

      const { error } = await supabase
        .from('scheduled_posts')
        .update({
          content,
          platforms,
          scheduled_at: scheduledAt.toISOString(),
          media_url: mediaUrl,
          media_type: mediaType,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Post updated",
        description: "The scheduled post has been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      setEditDialogOpen(false);
      setSelectedPost(null);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: `Failed to update post: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const handleDeleteClick = (post: ScheduledPost) => {
    if (post.status !== 'pending') {
      toast({
        title: "Cannot delete",
        description: "Only pending posts can be deleted.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedPost(post);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (post: ScheduledPost) => {
    if (post.status !== 'pending') {
      toast({
        title: "Cannot edit",
        description: "Only pending posts can be edited.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedPost(post);
    setEditedContent(post.content);
    setEditedPlatforms(post.platforms);
    setEditedScheduleAt(new Date(post.scheduled_at));
    setEditedMediaUrl(post.media_url);
    setEditedMediaType(post.media_type as 'image' | 'video' | null);
    setEditDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedPost) {
      deleteMutation.mutate(selectedPost.id);
    }
  };

  const handleConfirmEdit = () => {
    if (selectedPost && editedContent) {
      updateMutation.mutate({
        id: selectedPost.id,
        content: editedContent,
        platforms: editedPlatforms,
        scheduledAt: editedScheduleAt,
        mediaUrl: editedMediaUrl,
        mediaType: editedMediaType
      });
    }
  };

  const handleMediaUpload = (url: string, type: 'image' | 'video') => {
    setEditedMediaUrl(url);
    setEditedMediaType(type);
  };

  const removeMedia = () => {
    setEditedMediaUrl(null);
    setEditedMediaType(null);
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const renderPlatforms = (platforms: ScheduledPost['platforms'] | string) => {
    // Parse platforms if it's a string
    let platformsObj;
    if (typeof platforms === 'string') {
      try {
        platformsObj = JSON.parse(platforms);
      } catch (error) {
        console.error('Error parsing platforms:', error);
        return 'Invalid platform data';
      }
    } else {
      platformsObj = platforms;
    }

    // Get platform display names
    const platformNames: { [key: string]: string } = {
      twitter: 'X',
      lens: 'Lens',
      farcaster: 'Farcaster',
      facebook: 'Facebook',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      youtubeShorts: 'YouTube'
    };

    const activePlatforms = Object.entries(platformsObj)
      .filter(([_, enabled]) => enabled)
      .map(([platform]) => platformNames[platform] || platform);
    
    return activePlatforms.join(', ') || 'No platforms selected';
  };

  const renderMedia = (mediaUrl: string | null, mediaType: string | null) => {
    if (!mediaUrl) return null;

    return (
      <div className="mt-4 rounded-md overflow-hidden">
        {mediaType === 'image' ? (
          <img 
            src={mediaUrl} 
            alt="Post media" 
            className="w-full max-h-64 object-cover"
          />
        ) : mediaType === 'video' ? (
          <video 
            src={mediaUrl} 
            controls 
            className="w-full max-h-64"
          />
        ) : null}
      </div>
    );
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
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(post.status)}>
                      {post.status}
                    </Badge>
                    {post.status === 'pending' && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditClick(post)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteClick(post)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {renderMedia(post.media_url, post.media_type)}
                
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scheduled Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scheduled post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Post Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Post</DialogTitle>
            <DialogDescription>
              Make changes to your scheduled post below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Post Content</label>
              <Textarea 
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[100px]"
                placeholder="What's on your mind?"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Platforms</label>
              <PlatformToggleButtons 
                platforms={editedPlatforms} 
                onChange={setEditedPlatforms} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Schedule</label>
              <SchedulePicker 
                onScheduleChange={setEditedScheduleAt} 
                initialDate={editedScheduleAt}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Media</label>
              {editedMediaUrl ? (
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                    onClick={removeMedia}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {editedMediaType === 'image' ? (
                    <img 
                      src={editedMediaUrl} 
                      alt="Post media" 
                      className="w-full max-h-64 object-cover rounded-md"
                    />
                  ) : (
                    <video 
                      src={editedMediaUrl} 
                      controls 
                      className="w-full max-h-64 rounded-md"
                    />
                  )}
                </div>
              ) : (
                <MediaUploader onMediaUpload={handleMediaUpload} />
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmEdit}
              disabled={!editedContent.trim() || !editedScheduleAt || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostsHistory;
