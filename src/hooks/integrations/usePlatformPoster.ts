
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
      // Get the connected user's signer UUID from localStorage
      let signerUuid: string | null = null;
      try {
        const farcasterCredentials = localStorage.getItem('farcaster_credentials');
        if (farcasterCredentials) {
          const credentials = JSON.parse(farcasterCredentials);
          signerUuid = credentials.accessToken; // accessToken stores the signer_uuid
          console.log('Using connected user signer UUID:', signerUuid?.substring(0, 8) + '...');
        }
      } catch (error) {
        console.warn('Could not get Farcaster signer from localStorage:', error);
      }

      const { data, error } = await supabase.functions.invoke('post-to-farcaster', {
        body: { 
          content, 
          mediaUrl, 
          mediaType,
          signer_uuid: signerUuid // Pass the connected user's signer UUID
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
      const credentialsStr = localStorage.getItem('facebook_credentials');
      console.log('🔍 Checking Facebook credentials...');
      
      const credentials = JSON.parse(credentialsStr || '{}');
      
      if (!credentials.accessToken) {
        throw new Error('Facebook not connected. Please connect your Facebook account first.');
      }

      // Get Facebook target selection from localStorage
      const savedTarget = localStorage.getItem('facebookPostTarget');
      let pageId = null;
      let pageAccessToken = null;
      
      if (savedTarget) {
        try {
          const target = JSON.parse(savedTarget);
          if (target.type === 'page' && target.pageAccessToken) {
            pageId = target.pageId;
            pageAccessToken = target.pageAccessToken;
            console.log('✅ Using Facebook page:', target.pageName);
          }
        } catch (error) {
          console.error('Error parsing saved Facebook target:', error);
        }
      }

      // Fallback: Check if user has pages available in credentials for backward compatibility
      if (!pageId && credentials.pages && credentials.pages.length > 0) {
        const selectedPage = credentials.selectedPageId 
          ? credentials.pages.find((p: any) => p.id === credentials.selectedPageId)
          : credentials.pages[0];

        if (selectedPage && selectedPage.access_token) {
          pageId = selectedPage.id;
          pageAccessToken = selectedPage.access_token;
          console.log('✅ Using fallback Facebook page:', selectedPage.name);
        }
      }

      // Facebook requires page posting for most apps - personal timeline has strict limitations
      if (!pageId || !pageAccessToken) {
        throw new Error('Please select a Facebook page to post to. Personal timeline posting requires special app permissions that are not available for most applications.');
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

      console.log('📤 Facebook post response:', { data, error });

      if (error) {
        console.error('❌ Supabase function invoke error:', error);
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
