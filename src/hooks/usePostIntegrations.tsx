
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { usePlatformPoster, PostResult } from "./integrations/usePlatformPoster";
import { PlatformSettings, SchedulePostResult } from "@/types/platform";

export { type PostResult } from "./integrations/usePlatformPoster";

export const usePostIntegrations = () => {
  const { user } = useAuth();
  const [isPosting, setIsPosting] = useState(false);
  const platformPoster = usePlatformPoster();
  
  const crossPost = async (
    content: string, 
    platforms: PlatformSettings,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to post",
        variant: "destructive"
      });
      return [];
    }
    
    if (!content.trim() && !mediaUrl) {
      toast({
        title: "Missing Content",
        description: "Please enter content or upload media",
        variant: "destructive"
      });
      return [];
    }
    
    setIsPosting(true);
    const results: PostResult[] = [];
    
    try {
      const platformPromises: Promise<PostResult>[] = [];
      
      if (platforms.twitter) {
        platformPromises.push(platformPoster.postToTwitter(content, mediaUrl, mediaType));
      }
      
      if (platforms.lens) {
        const walletAddress = localStorage.getItem('walletAddress');
        const lensHandle = localStorage.getItem('lensHandle');
        
        if (!walletAddress || !lensHandle) {
          toast({
            title: "Lens Configuration Required",
            description: "Please connect your wallet and Lens account first (click settings icon)",
          });
        }
        
        platformPromises.push(platformPoster.postToLens(content, mediaUrl, mediaType));
      }
      
      if (platforms.farcaster) {
        platformPromises.push(platformPoster.postToFarcaster(content, mediaUrl, mediaType));
      }
      
      if (platforms.facebook) {
        platformPromises.push(platformPoster.postToFacebook(content, mediaUrl, mediaType));
      }
      
      if (platforms.instagram) {
        platformPromises.push(platformPoster.postToInstagram(content, mediaUrl, mediaType));
      }
      
      if (platforms.tiktok) {
        platformPromises.push(platformPoster.postToTikTok(content, mediaUrl, mediaType));
      }
      
      if (platforms.youtubeShorts) {
        platformPromises.push(platformPoster.postToYouTubeShorts(content, mediaUrl, mediaType));
      }
      
      const postResults = await Promise.all(platformPromises);
      
      postResults.forEach(result => {
        results.push(result);
        if (result.success) {
          toast({
            title: "Post Successful",
            description: `Posted to ${result.platform} successfully`,
          });
        } else {
          toast({
            title: "Post Failed",
            description: `Failed to post to ${result.platform}: ${result.message}`,
            variant: "destructive"
          });
        }
      });
      
    } catch (error: any) {
      console.error('Cross posting error:', error);
      toast({
        title: "Posting Error",
        description: `${error.message || 'Unknown error occurred'}`,
        variant: "destructive"
      });
    } finally {
      setIsPosting(false);
    }
    
    return results;
  };
  
  const schedulePost = async (
    content: string, 
    platforms: PlatformSettings,
    scheduledAt: Date,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null
  ): Promise<SchedulePostResult> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to schedule posts",
        variant: "destructive"
      });
      return { success: false, message: "Authentication required" };
    }
    
    if (!content.trim() && !mediaUrl) {
      toast({
        title: "Missing Content",
        description: "Please enter content or upload media to schedule",
        variant: "destructive"
      });
      return { success: false, message: "Content or media required" };
    }
    
    setIsPosting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('schedule-post', {
        body: { 
          content,
          platforms,
          scheduledAt: scheduledAt.toISOString(),
          userId: user.id,
          mediaUrl,
          mediaType
        }
      });
      
      if (error) throw error;
      
      return {
        success: true,
        message: "Post scheduled successfully",
        id: data.id
      };
      
    } catch (error: any) {
      console.error('Scheduling error:', error);
      toast({
        title: "Scheduling Error",
        description: `${error.message || 'Unknown error occurred'}`,
        variant: "destructive"
      });
      return {
        success: false,
        message: error.message || 'Error scheduling post'
      };
    } finally {
      setIsPosting(false);
    }
  };
  
  return {
    isPosting,
    crossPost,
    schedulePost
  };
};
