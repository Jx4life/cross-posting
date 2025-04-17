
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

export const usePostIntegrations = () => {
  const { user } = useAuth();
  const [isPosting, setIsPosting] = useState(false);
  
  const postToTwitter = async (content: string): Promise<PostResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('post-to-twitter', {
        body: { content }
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
  
  const postToFarcaster = async (content: string): Promise<PostResult> => {
    // This would be implemented once we have a Farcaster API integration
    return {
      platform: 'farcaster',
      success: false,
      message: 'Farcaster integration coming soon'
    };
  };
  
  const postToLens = async (content: string): Promise<PostResult> => {
    // This would be implemented once we have a Lens API integration
    return {
      platform: 'lens',
      success: false,
      message: 'Lens integration coming soon'
    };
  };
  
  const crossPost = async (content: string, platforms: { 
    twitter: boolean; 
    lens: boolean; 
    farcaster: boolean; 
  }) => {
    if (!user) {
      toast.error("You must be logged in to post");
      return [];
    }
    
    if (!content.trim()) {
      toast.error("Please enter content to post");
      return [];
    }
    
    setIsPosting(true);
    const results: PostResult[] = [];
    
    try {
      const platformPromises: Promise<PostResult>[] = [];
      
      if (platforms.twitter) {
        platformPromises.push(postToTwitter(content));
      }
      
      if (platforms.lens) {
        platformPromises.push(postToLens(content));
      }
      
      if (platforms.farcaster) {
        platformPromises.push(postToFarcaster(content));
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
  
  return {
    isPosting,
    crossPost
  };
};
