/**
 * Secure token manager for retrieving encrypted social media tokens
 * This replaces localStorage-based token storage with encrypted database storage
 */

import { supabase } from '@/integrations/supabase/client';
import { getDecryptedTokens } from './tokenEncryption';

interface FacebookCredentials {
  access_token: string;
  expires_in?: number;
  user: {
    id: string;
    name: string;
    picture?: any;
  };
  pages: Array<{
    id: string;
    name: string;
    access_token: string;
    category: string;
    tasks: string[];
    perms: string[];
  }>;
}

interface TwitterCredentials {
  access_token: string;
  refresh_token?: string;
  user?: any;
}

/**
 * Securely retrieve Facebook credentials
 * Falls back to localStorage for backward compatibility
 */
export async function getSecureFacebookCredentials(): Promise<FacebookCredentials | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found');
      return null;
    }

    // Try to get encrypted tokens from database
    const tokens = await getDecryptedTokens(user.id, 'facebook');
    
    if (tokens?.accessToken) {
      // Fetch user and pages data using the decrypted token
      const userResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${tokens.accessToken}`
      );
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,tasks,perms&access_token=${tokens.accessToken}`
        );
        
        const pagesData = pagesResponse.ok ? await pagesResponse.json() : { data: [] };
        
        return {
          access_token: tokens.accessToken,
          user: userData,
          pages: pagesData.data || []
        };
      }
    }
    
    // Fallback to localStorage (legacy support)
    const stored = localStorage.getItem('facebook_credentials');
    if (stored) {
      console.log('Using legacy Facebook credentials from localStorage');
      return JSON.parse(stored);
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving Facebook credentials:', error);
    
    // Final fallback to localStorage
    const stored = localStorage.getItem('facebook_credentials');
    if (stored) {
      console.log('Fallback to localStorage Facebook credentials');
      return JSON.parse(stored);
    }
    
    return null;
  }
}

/**
 * Securely retrieve Twitter credentials
 */
export async function getSecureTwitterCredentials(): Promise<TwitterCredentials | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const tokens = await getDecryptedTokens(user.id, 'twitter');
    
    if (tokens?.accessToken) {
      return {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving Twitter credentials:', error);
    return null;
  }
}

/**
 * Clean up legacy localStorage tokens after migration
 */
export function cleanupLegacyTokens(): void {
  try {
    localStorage.removeItem('facebook_credentials');
    localStorage.removeItem('twitter_credentials');
    localStorage.removeItem('tiktok_credentials');
    console.log('Legacy token storage cleaned up');
  } catch (error) {
    console.error('Error cleaning up legacy tokens:', error);
  }
}