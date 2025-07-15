import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { oauthManager } from "@/services/oauth/OAuthManager";

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
    console.log('=== FRONTEND FARCASTER POST (SIMPLE) ===');
    console.log('Posting to Farcaster with:', { content, mediaUrl, mediaType });
    
    try {
      const { data, error } = await supabase.functions.invoke('post-to-farcaster', {
        body: { 
          content, 
          mediaUrl, 
          mediaType
        }
      });
      
      console.log('Supabase function response:', { data, error });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Farcaster API error');
      }
      
      if (!data || !data.success) {
        console.error('Farcaster posting failed:', data);
        throw new Error(data?.error || 'Farcaster posting failed');
      }
      
      console.log('=== FARCASTER POST SUCCESS (SIMPLE) ===');
      console.log('Success data:', JSON.stringify(data, null, 2));
      
      return {
        platform: 'farcaster',
        success: true,
        data,
        message: data.details?.castUrl ? 
          `Posted successfully! View at: ${data.details.castUrl}` : 
          'Posted successfully to Farcaster'
      };
    } catch (error: any) {
      console.error('=== FARCASTER POSTING ERROR (SIMPLE) ===');
      console.error('Error:', error);
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
