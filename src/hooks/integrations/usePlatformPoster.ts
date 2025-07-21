
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
    try {
      // Get Facebook credentials from local storage
      const credentials = JSON.parse(localStorage.getItem('facebook_credentials') || '{}');
      
      if (!credentials.accessToken) {
        throw new Error('Facebook not connected. Please connect your Facebook account first.');
      }

      let pageId = null;
      let pageAccessToken = null;

      // Check if user has pages
      if (credentials.pages && credentials.pages.length > 0) {
        // Use page posting (recommended)
        const selectedPage = credentials.selectedPageId 
          ? credentials.pages.find((p: any) => p.id === credentials.selectedPageId)
          : credentials.pages[0];

        if (selectedPage) {
          pageId = selectedPage.id;
          pageAccessToken = selectedPage.access_token;
        }
      }

      // If no pages available, we'll try posting to personal timeline
      // Note: This has limited functionality and may not work for all content types
      if (!pageId) {
        console.warn('No Facebook pages found, attempting to post to personal timeline');
      }

      const { data, error } = await supabase.functions.invoke('post-to-facebook', {
        body: {
          content,
          mediaUrl,
          mediaType,
          accessToken: credentials.accessToken,
          pageId: pageId,
          pageAccessToken: pageAccessToken || credentials.accessToken
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to post to Facebook');
      }

      // Track successful post
      try {
        const { facebookSDK } = await import('@/services/oauth/FacebookSDK');
        facebookSDK.trackEvent('fb_post_success', {
          content_type: mediaType || 'text',
          has_media: !!mediaUrl
        });
      } catch (trackError) {
        console.warn('Failed to track Facebook post event:', trackError);
      }

      return {
        success: true,
        platform: 'Facebook',
        message: data.message || 'Posted successfully to Facebook',
        id: data.postId
      };
    } catch (error) {
      console.error('Facebook posting error:', error);
      return {
        success: false,
        platform: 'Facebook',
        message: error.message || 'Failed to post to Facebook'
      };
    }
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
