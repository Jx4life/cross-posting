
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/providers/AuthProvider";

interface PostResult {
  platform: string;
  success: boolean;
  message?: string;
  data?: any;
}

interface SchedulePostResult {
  success: boolean;
  message: string;
  id?: string;
}

interface PlatformSettings {
  twitter: boolean;
  lens: boolean;
  farcaster: boolean;
  facebook: boolean;
  instagram: boolean;
  tiktok: boolean;
  youtubeShorts: boolean;
}

export const usePostIntegrations = () => {
  const { user } = useAuth();
  const [isPosting, setIsPosting] = useState(false);
  
  const postToTwitter = async (content: string, mediaUrl?: string | null, mediaType?: 'image' | 'video' | null): Promise<PostResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('post-to-twitter', {
        body: { content, mediaUrl, mediaType }
      });
      
      if (error) throw error;
      
      return {
        platform: 'twitter',
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Twitter posting error:', error);
      return {
        platform: 'twitter',
        success: false,
        message: error.message || 'Error posting to Twitter'
      };
    }
  };
  
  const postToFarcaster = async (content: string, mediaUrl?: string | null, mediaType?: 'image' | 'video' | null): Promise<PostResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('post-to-farcaster', {
        body: { content, mediaUrl, mediaType }
      });
      
      if (error) throw error;
      
      return {
        platform: 'farcaster',
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Farcaster posting error:', error);
      return {
        platform: 'farcaster',
        success: false,
        message: error.message || 'Error posting to Farcaster'
      };
    }
  };
  
  const postToLens = async (content: string, mediaUrl?: string | null, mediaType?: 'image' | 'video' | null): Promise<PostResult> => {
    try {
      const walletAddress = localStorage.getItem('walletAddress');
      const lensHandle = localStorage.getItem('lensHandle');
      
      const { data, error } = await supabase.functions.invoke('post-to-lens', {
        body: { 
          content,
          walletAddress,
          lensHandle,
          mediaUrl,
          mediaType
        }
      });
      
      if (error) throw error;
      
      return {
        platform: 'lens',
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Lens posting error:', error);
      return {
        platform: 'lens',
        success: false,
        message: error.message || 'Error posting to Lens'
      };
    }
  };
  
  const postToFacebook = async (content: string, mediaUrl?: string | null, mediaType?: 'image' | 'video' | null): Promise<PostResult> => {
    try {
      // This would be implemented with a real API in production
      console.log('Posting to Facebook:', { content, mediaUrl, mediaType });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        platform: 'facebook',
        success: true,
        data: { id: 'fb-' + Date.now() }
      };
    } catch (error: any) {
      console.error('Facebook posting error:', error);
      return {
        platform: 'facebook',
        success: false,
        message: error.message || 'Error posting to Facebook'
      };
    }
  };
  
  const postToInstagram = async (content: string, mediaUrl?: string | null, mediaType?: 'image' | 'video' | null): Promise<PostResult> => {
    try {
      // This would be implemented with a real API in production
      console.log('Posting to Instagram:', { content, mediaUrl, mediaType });
      
      // Instagram requires media
      if (!mediaUrl) {
        return {
          platform: 'instagram',
          success: false,
          message: 'Instagram posts require an image or video'
        };
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        platform: 'instagram',
        success: true,
        data: { id: 'ig-' + Date.now() }
      };
    } catch (error: any) {
      console.error('Instagram posting error:', error);
      return {
        platform: 'instagram',
        success: false,
        message: error.message || 'Error posting to Instagram'
      };
    }
  };
  
  const postToTikTok = async (content: string, mediaUrl?: string | null, mediaType?: 'image' | 'video' | null): Promise<PostResult> => {
    try {
      // This would be implemented with a real API in production
      console.log('Posting to TikTok:', { content, mediaUrl, mediaType });
      
      // TikTok requires video
      if (!mediaUrl || mediaType !== 'video') {
        return {
          platform: 'tiktok',
          success: false,
          message: 'TikTok posts require a video'
        };
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        platform: 'tiktok',
        success: true,
        data: { id: 'tt-' + Date.now() }
      };
    } catch (error: any) {
      console.error('TikTok posting error:', error);
      return {
        platform: 'tiktok',
        success: false,
        message: error.message || 'Error posting to TikTok'
      };
    }
  };
  
  const postToYouTubeShorts = async (content: string, mediaUrl?: string | null, mediaType?: 'image' | 'video' | null): Promise<PostResult> => {
    try {
      // This would be implemented with a real API in production
      console.log('Posting to YouTube Shorts:', { content, mediaUrl, mediaType });
      
      // YouTube Shorts requires video
      if (!mediaUrl || mediaType !== 'video') {
        return {
          platform: 'youtubeShorts',
          success: false,
          message: 'YouTube Shorts require a video'
        };
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        platform: 'youtubeShorts',
        success: true,
        data: { id: 'yt-' + Date.now() }
      };
    } catch (error: any) {
      console.error('YouTube Shorts posting error:', error);
      return {
        platform: 'youtubeShorts',
        success: false,
        message: error.message || 'Error posting to YouTube Shorts'
      };
    }
  };
  
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
        platformPromises.push(postToTwitter(content, mediaUrl, mediaType));
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
        
        platformPromises.push(postToLens(content, mediaUrl, mediaType));
      }
      
      if (platforms.farcaster) {
        platformPromises.push(postToFarcaster(content, mediaUrl, mediaType));
      }
      
      if (platforms.facebook) {
        platformPromises.push(postToFacebook(content, mediaUrl, mediaType));
      }
      
      if (platforms.instagram) {
        platformPromises.push(postToInstagram(content, mediaUrl, mediaType));
      }
      
      if (platforms.tiktok) {
        platformPromises.push(postToTikTok(content, mediaUrl, mediaType));
      }
      
      if (platforms.youtubeShorts) {
        platformPromises.push(postToYouTubeShorts(content, mediaUrl, mediaType));
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
