
import { supabase } from "@/integrations/supabase/client";
import { TikTokAPI } from "./TikTokAPI";

export interface TikTokTokenInfo {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  created_at: number;
  open_id: string;
  scope: string;
}

export class TikTokTokenManager {
  private api: TikTokAPI;
  
  constructor(api: TikTokAPI) {
    this.api = api;
  }
  
  /**
   * Check if access token is expired or will expire soon (within 5 minutes)
   */
  isTokenExpired(tokenInfo: TikTokTokenInfo): boolean {
    const now = Date.now() / 1000; // Current time in seconds
    const expiresAt = tokenInfo.created_at + tokenInfo.expires_in;
    const buffer = 300; // 5 minutes buffer
    
    return now >= (expiresAt - buffer);
  }
  
  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(userId: string): Promise<string> {
    console.log('Getting valid access token for user:', userId);
    
    // Get current token from database
    const { data: config, error } = await supabase
      .from('post_configurations')
      .select('access_token, refresh_token, created_at')
      .eq('user_id', userId)
      .eq('platform', 'tiktok')
      .eq('is_enabled', true)
      .single();
    
    if (error || !config) {
      throw new Error('TikTok account not connected');
    }
    
    if (!config.access_token || !config.refresh_token) {
      throw new Error('TikTok tokens not found');
    }
    
    // Parse token info (assuming we store creation time)
    const tokenInfo: TikTokTokenInfo = {
      access_token: config.access_token,
      refresh_token: config.refresh_token,
      expires_in: 24 * 60 * 60, // 24 hours default
      created_at: config.created_at ? new Date(config.created_at).getTime() / 1000 : 0,
      open_id: '',
      scope: ''
    };
    
    // Check if token needs refresh
    if (this.isTokenExpired(tokenInfo)) {
      console.log('Access token expired, refreshing...');
      return await this.refreshAccessToken(userId, config.refresh_token);
    }
    
    console.log('Access token is still valid');
    return config.access_token;
  }
  
  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
    try {
      console.log('Refreshing TikTok access token for user:', userId);
      
      const tokenResponse = await this.api.refreshToken(refreshToken);
      
      // Update database with new tokens
      const { error: updateError } = await supabase
        .from('post_configurations')
        .update({
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token || refreshToken, // Some APIs don't return new refresh token
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('platform', 'tiktok');
      
      if (updateError) {
        console.error('Failed to update tokens in database:', updateError);
        throw new Error('Failed to save refreshed tokens');
      }
      
      console.log('Successfully refreshed and saved TikTok access token');
      return tokenResponse.access_token;
      
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      
      // If refresh fails, the user needs to re-authenticate
      await this.markTokenAsInvalid(userId);
      throw new Error('TikTok authentication expired. Please reconnect your account.');
    }
  }
  
  /**
   * Validate access token by making a test API call
   */
  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      await this.api.getUserInfo(accessToken);
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }
  
  /**
   * Mark token as invalid and disable the configuration
   */
  async markTokenAsInvalid(userId: string): Promise<void> {
    console.log('Marking TikTok token as invalid for user:', userId);
    
    const { error } = await supabase
      .from('post_configurations')
      .update({
        is_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('platform', 'tiktok');
    
    if (error) {
      console.error('Failed to mark token as invalid:', error);
    }
  }
  
  /**
   * Get user information and update if needed
   */
  async getUserInfoAndUpdate(userId: string): Promise<any> {
    try {
      const accessToken = await this.getValidAccessToken(userId);
      const userInfo = await this.api.getUserInfo(accessToken);
      
      console.log('Retrieved TikTok user info:', {
        open_id: userInfo.open_id,
        display_name: userInfo.display_name,
        username: userInfo.username
      });
      
      return userInfo;
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  }
  
  /**
   * Revoke access token (logout from TikTok)
   */
  async revokeToken(userId: string): Promise<void> {
    try {
      const { data: config } = await supabase
        .from('post_configurations')
        .select('access_token')
        .eq('user_id', userId)
        .eq('platform', 'tiktok')
        .single();
      
      if (config?.access_token) {
        // TikTok doesn't have a standard revoke endpoint in their OAuth guide
        // But we should remove the token from our database
        console.log('Revoking TikTok access for user:', userId);
      }
      
      // Remove from database
      const { error } = await supabase
        .from('post_configurations')
        .delete()
        .eq('user_id', userId)
        .eq('platform', 'tiktok');
      
      if (error) {
        console.error('Failed to revoke TikTok token:', error);
        throw error;
      }
      
      console.log('Successfully revoked TikTok access');
    } catch (error) {
      console.error('Token revocation failed:', error);
      throw error;
    }
  }
}
