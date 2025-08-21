
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
    mediaType?: 'image' | 'video' | null,
    mediaUrls?: string[]
  ) => {
    // Debug logging
    console.log('🔍 Auth Debug - Starting crossPost');
    console.log('🔍 Auth Debug - User:', user);
    console.log('🔍 Auth Debug - Platforms:', platforms);
    
    // Check if user has Facebook credentials for Facebook posting
    const facebookCredentials = JSON.parse(localStorage.getItem('facebook_credentials') || '{}');
    const hasFacebookAuth = facebookCredentials.accessToken;
    console.log('🔍 Auth Debug - Facebook credentials:', { hasFacebookAuth, credentials: facebookCredentials });
    
    // Allow posting if user is logged in OR has Facebook auth and only posting to Facebook
    const onlyFacebookSelected = platforms.facebook && !platforms.twitter && !platforms.lens && 
                                !platforms.farcaster && !platforms.instagram && !platforms.tiktok && !platforms.youtubeShorts;
    console.log('🔍 Auth Debug - Only Facebook selected:', onlyFacebookSelected);
    
    if (!user && !(hasFacebookAuth && onlyFacebookSelected)) {
      console.log('🔍 Auth Debug - Authentication failed');
      toast({
        title: "Authentication Required", 
        description: hasFacebookAuth 
          ? "Please enable only Facebook to post, or sign up for full access to all platforms"
          : "You must be logged in to post",
        variant: "destructive"
      });
      return [];
    }
    
    console.log('🔍 Auth Debug - Authentication passed, proceeding with post');
    
    if (!content.trim() && !mediaUrl && (!mediaUrls || mediaUrls.length === 0)) {
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
        // Twitter doesn't support photo carousels the same way, use single media
        const twitterMediaUrl = mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : mediaUrl;
        const twitterMediaType = mediaUrls && mediaUrls.length > 0 ? 'image' : mediaType;
        platformPromises.push(platformPoster.postToTwitter(content, twitterMediaUrl, twitterMediaType));
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
        
        // Lens supports single media
        const lensMediaUrl = mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : mediaUrl;
        const lensMediaType = mediaUrls && mediaUrls.length > 0 ? 'image' : mediaType;
        platformPromises.push(platformPoster.postToLens(content, lensMediaUrl, lensMediaType));
      }
      
      if (platforms.farcaster) {
        // Farcaster supports single media
        const farcasterMediaUrl = mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : mediaUrl;
        const farcasterMediaType = mediaUrls && mediaUrls.length > 0 ? 'image' : mediaType;
        platformPromises.push(platformPoster.postToFarcaster(content, farcasterMediaUrl, farcasterMediaType));
      }
      
      if (platforms.facebook) {
        // Facebook supports single media for now
        const fbMediaUrl = mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : mediaUrl;
        const fbMediaType = mediaUrls && mediaUrls.length > 0 ? 'image' : mediaType;
        platformPromises.push(platformPoster.postToFacebook(content, fbMediaUrl, fbMediaType));
      }
      
      if (platforms.instagram) {
        // Instagram supports single media for now
        const igMediaUrl = mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : mediaUrl;
        const igMediaType = mediaUrls && mediaUrls.length > 0 ? 'image' : mediaType;
        platformPromises.push(platformPoster.postToInstagram(content, igMediaUrl, igMediaType));
      }
      
      if (platforms.tiktok) {
        // TikTok supports both single media and photo carousels
        platformPromises.push(platformPoster.postToTikTok(content, mediaUrl, mediaType, mediaUrls));
      }
      
      if (platforms.youtubeShorts) {
        // YouTube Shorts only supports video
        if (mediaType === 'video' && mediaUrl) {
          platformPromises.push(platformPoster.postToYouTubeShorts(content, mediaUrl, mediaType));
        }
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
    mediaType?: 'image' | 'video' | null,
    mediaUrls?: string[]
  ): Promise<SchedulePostResult> => {
    // Scheduling requires full Supabase authentication
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must sign up to schedule posts",
        variant: "destructive"
      });
      return { success: false, message: "Authentication required" };
    }
    
    if (!content.trim() && !mediaUrl && (!mediaUrls || mediaUrls.length === 0)) {
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
          mediaType,
          mediaUrls
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
