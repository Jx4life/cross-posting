
export interface TikTokConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export class TikTokAPI {
  private config: TikTokConfig;
  private baseUrl = 'https://open-api.tiktok.com';
  
  constructor(config: TikTokConfig) {
    this.config = config;
  }
  
  /**
   * Generate the TikTok OAuth authorization URL
   */
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_key: this.config.clientId,
      response_type: 'code',
      scope: this.config.scopes.join(','),
      redirect_uri: this.config.redirectUri,
      state: state || crypto.randomUUID(),
    });
    
    return `${this.baseUrl}/platform/oauth/connect/?${params.toString()}`;
  }
  
  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string) {
    const url = `${this.baseUrl}/oauth/access_token/`;
    const params = new URLSearchParams({
      client_key: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri,
    });
    
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('TikTok token exchange error:', errorText);
      throw new Error(`TikTok API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`TikTok API error: ${data.error} - ${data.error_description || ''}`);
    }
    
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      open_id: data.open_id,
      scope: data.scope,
    };
  }
  
  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    const url = `${this.baseUrl}/oauth/refresh_token/`;
    const params = new URLSearchParams({
      client_key: this.config.clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('TikTok token refresh error:', errorText);
      throw new Error(`TikTok API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`TikTok API error: ${data.error} - ${data.error_description || ''}`);
    }
    
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_in: data.expires_in,
      open_id: data.open_id,
      scope: data.scope,
    };
  }
  
  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string) {
    const url = `${this.baseUrl}/user/info/`;
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: 'open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link',
    });
    
    const response = await fetch(`${url}?${params.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('TikTok user info error:', errorText);
      throw new Error(`TikTok API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`TikTok API error: ${data.error} - ${data.error_description || ''}`);
    }
    
    return data.user;
  }
  
  /**
   * Post a video to TikTok
   * Note: This is a simplified example. In a real implementation, you'd need to handle
   * video uploads to TikTok's servers first, then create posts with the upload ID.
   */
  async createVideoPost(accessToken: string, caption: string, videoUrl: string) {
    // This is a placeholder - TikTok's actual video upload process is more complex
    // and involves multiple steps including pre-upload, chunk upload, and post creation
    
    console.log('Creating TikTok video post with:', { accessToken, caption, videoUrl });
    
    // In a real implementation, you would:
    // 1. Get an upload URL from TikTok
    // 2. Upload the video in chunks
    // 3. Create the post using the upload ID
    
    return {
      success: true,
      message: 'Video posted successfully (simulated)',
      postId: `tiktok-${Date.now()}`,
    };
  }
}
