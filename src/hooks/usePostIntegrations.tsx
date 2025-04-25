import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  
  const crossPost = async (
    content: string, 
    platforms: { 
      twitter: boolean; 
      lens: boolean; 
      farcaster: boolean; 
    },
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null
  ) => {
    if (!user) {
      toast.error("You must be logged in to post");
      return [];
    }
    
    if (!content.trim() && !mediaUrl) {
      toast.error("Please enter content or upload media");
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
          toast.warning("Please connect your wallet and Lens account first (click settings icon)");
        }
        
        platformPromises.push(postToLens(content, mediaUrl, mediaType));
      }
      
      if (platforms.farcaster) {
        platformPromises.push(postToFarcaster(content, mediaUrl, mediaType));
      }
      
      const postResults = await Promise.all(platformPromises);
      
      postResults.forEach(result => {
        results.push(result);
        if (result.success) {
          toast.success(`Posted to ${result.platform} successfully`);
        } else {
          toast.error(`Failed to post to ${result.platform}: ${result.message}`);
        }
      });
      
    } catch (error: any) {
      console.error('Cross posting error:', error);
      toast.error(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsPosting(false);
    }
    
    return results;
  };
  
  const schedulePost = async (
    content: string, 
    platforms: { 
      twitter: boolean; 
      lens: boolean; 
      farcaster: boolean; 
    },
    scheduledAt: Date,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null
  ): Promise<SchedulePostResult> => {
    if (!user) {
      toast.error("You must be logged in to schedule posts");
      return { success: false, message: "Authentication required" };
    }
    
    if (!content.trim() && !mediaUrl) {
      toast.error("Please enter content or upload media to schedule");
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
      toast.error(`Error scheduling post: ${error.message || 'Unknown error occurred'}`);
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
