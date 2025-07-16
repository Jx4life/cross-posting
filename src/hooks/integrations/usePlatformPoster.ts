
import { supabase } from "@/integrations/supabase/client";

export interface PostResult {
  success: boolean;
  platform: string;
  message: string;
  id?: string;
}

export const usePlatformPoster = () => {
  const postToTwitter = async (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null
  ): Promise<PostResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('post-to-twitter', {
        body: { 
          content, 
          mediaUrl, 
          mediaType 
        }
      });
      
      if (error) throw error;
      
      return {
        success: data.success,
        platform: 'Twitter',
        message: data.success ? 'Posted successfully' : data.error,
        id: data.id
      };
    } catch (error: any) {
      return {
        success: false,
        platform: 'Twitter',
        message: error.message || 'Failed to post'
      };
    }
  };

  const postToLens = async (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null
  ): Promise<PostResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('post-to-lens', {
        body: { 
          content, 
          mediaUrl, 
          mediaType 
        }
      });
      
      if (error) throw error;
      
      return {
        success: data.success,
        platform: 'Lens',
        message: data.success ? 'Posted successfully' : data.error,
        id: data.id
      };
    } catch (error: any) {
      return {
        success: false,
        platform: 'Lens',
        message: error.message || 'Failed to post'
      };
    }
  };

  const postToFarcaster = async (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null
  ): Promise<PostResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('post-to-farcaster', {
        body: { 
          content, 
          mediaUrl, 
          mediaType 
        }
      });
      
      if (error) throw error;
      
      return {
        success: data.success,
        platform: 'Farcaster',
        message: data.success ? 'Posted successfully' : data.error,
        id: data.id
      };
    } catch (error: any) {
      return {
        success: false,
        platform: 'Farcaster',
        message: error.message || 'Failed to post'
      };
    }
  };

  const postToFacebook = async (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null
  ): Promise<PostResult> => {
    // Facebook posting implementation would go here
    return {
      success: false,
      platform: 'Facebook',
      message: 'Facebook posting not yet implemented'
    };
  };

  const postToInstagram = async (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null
  ): Promise<PostResult> => {
    // Instagram posting implementation would go here
    return {
      success: false,
      platform: 'Instagram',
      message: 'Instagram posting not yet implemented'
    };
  };

  const postToTikTok = async (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null,
    mediaUrls?: string[]
  ): Promise<PostResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('post-to-tiktok', {
        body: { 
          content, 
          mediaUrl, 
          mediaType,
          mediaUrls // Support for photo carousel
        }
      });
      
      if (error) throw error;
      
      return {
        success: data.success,
        platform: 'TikTok',
        message: data.success ? data.message || 'Posted successfully' : data.error,
        id: data.data?.publish_id
      };
    } catch (error: any) {
      return {
        success: false,
        platform: 'TikTok',
        message: error.message || 'Failed to post'
      };
    }
  };

  const postToYouTubeShorts = async (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null
  ): Promise<PostResult> => {
    // YouTube Shorts posting implementation would go here
    return {
      success: false,
      platform: 'YouTube Shorts',
      message: 'YouTube Shorts posting not yet implemented'
    };
  };

  return {
    postToTwitter,
    postToLens,
    postToFarcaster,
    postToFacebook,
    postToInstagram,
    postToTikTok,
    postToYouTubeShorts
  };
};
