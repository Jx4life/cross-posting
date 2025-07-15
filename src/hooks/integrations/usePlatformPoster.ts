import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PostResult {
  platform: string;
  success: boolean;
  message?: string;
  data?: any;
}

export const usePlatformPoster = () => {
  // Web3 platforms (actual API implementations)
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
      console.log('=== FRONTEND FARCASTER POST START ===');
      console.log('Attempting to post to Farcaster:', { content, mediaUrl, mediaType });
      
      // Make the edge function call with detailed error catching
      let response;
      try {
        response = await supabase.functions.invoke('post-to-farcaster', {
          body: { content, mediaUrl, mediaType }
        });
        console.log('Raw Supabase function response:', response);
      } catch (invokeError: any) {
        console.error('Supabase invoke error details:', {
          name: invokeError.name,
          message: invokeError.message,
          status: invokeError.status,
          statusText: invokeError.statusText,
          details: invokeError.details,
          hint: invokeError.hint,
          code: invokeError.code,
          context: invokeError.context
        });
        
        // Try to extract more meaningful error information
        let errorMessage = 'Unknown error occurred while calling Farcaster function';
        
        if (invokeError.message) {
          errorMessage = invokeError.message;
        }
        
        if (invokeError.details) {
          errorMessage += ` - Details: ${JSON.stringify(invokeError.details)}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const { data, error } = response;
      console.log('Farcaster function response data:', data);
      console.log('Farcaster function response error:', error);
      
      if (error) {
        console.error('Supabase function returned error:', error);
        throw new Error(`Farcaster API Error: ${error.message || JSON.stringify(error)}`);
      }
      
      if (!data) {
        throw new Error('No response data from Farcaster function');
      }
      
      if (!data.success) {
        console.error('Farcaster function returned unsuccessful result:', data);
        throw new Error(data.error || data.details || data.message || 'Farcaster posting failed - no specific error message');
      }
      
      console.log('=== FRONTEND FARCASTER POST SUCCESS ===');
      return {
        platform: 'farcaster',
        success: true,
        data
      };
    } catch (error: any) {
      console.error('=== FRONTEND FARCASTER POST ERROR ===');
      console.error('Farcaster posting error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        error: error
      });
      
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
  
  // Traditional social media platforms (simulations for now)
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

  return {
    postToTwitter,
    postToFarcaster,
    postToLens,
    postToFacebook,
    postToInstagram,
    postToTikTok,
    postToYouTubeShorts
  };
};
