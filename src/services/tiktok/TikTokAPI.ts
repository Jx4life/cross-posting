
export interface TikTokConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface TikTokTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  open_id: string;
}

export interface TikTokUserInfo {
  open_id: string;
  union_id: string;
  avatar_url: string;
  display_name: string;
  username: string;
}

export interface TikTokVideoInitResponse {
  data: {
    publish_id: string;
    upload_url: string;
  };
}

export interface TikTokPublishResponse {
  data: {
    publish_id: string;
    share_url?: string;
  };
}

export interface TikTokStatusResponse {
  data: {
    status: 'PROCESSING' | 'PUBLISHED' | 'FAILED';
    fail_reason?: string;
  };
}

export class TikTokAPI {
  private config: TikTokConfig;
  private baseUrl = 'https://open.tiktokapis.com';
  
  constructor(config: TikTokConfig) {
    // Use sandbox credentials
    this.config = {
      ...config,
      clientId: 'sbawjmn8p4yrizyuis',
      clientSecret: 'F51RS5h2sDaZUUxLbDWoe9p5TXEalKxj'
    };
  }
  
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_key: this.config.clientId,
      scope: this.config.scopes.join(','),
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      state: state || Math.random().toString(36).substring(7)
    });
    
    // Use the correct TikTok OAuth authorization endpoint
    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  }
  
  async exchangeCodeForToken(code: string): Promise<TikTokTokenResponse> {
    const response = await fetch(`${this.baseUrl}/v2/oauth/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`TikTok token exchange failed: ${data.error_description || data.error}`);
    }
    
    return data;
  }
  
  async refreshToken(refreshToken: string): Promise<TikTokTokenResponse> {
    const response = await fetch(`${this.baseUrl}/v2/oauth/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`TikTok token refresh failed: ${data.error_description || data.error}`);
    }
    
    return data;
  }
  
  async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    const response = await fetch(`${this.baseUrl}/v2/user/info/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: ['open_id', 'union_id', 'avatar_url', 'display_name', 'username']
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`TikTok user info failed: ${data.error?.message || 'Unknown error'}`);
    }
    
    return data.data.user;
  }
  
  /**
   * Initialize video upload with TikTok API
   */
  async initializeVideoUpload(
    accessToken: string,
    videoSize: number,
    title: string,
    description?: string
  ): Promise<TikTokVideoInitResponse> {
    const response = await fetch(`${this.baseUrl}/v2/post/publish/video/init/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title,
          description: description || '',
          privacy_level: 'SELF_ONLY',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: videoSize,
          total_chunk_count: 1
        }
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`TikTok video init failed: ${data.error?.message || 'Unknown error'}`);
    }
    
    return data;
  }
  
  /**
   * Upload video file to TikTok's servers
   */
  async uploadVideoFile(uploadUrl: string, videoBuffer: ArrayBuffer): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes 0-${videoBuffer.byteLength-1}/${videoBuffer.byteLength}`,
        'Content-Length': videoBuffer.byteLength.toString(),
      },
      body: videoBuffer
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TikTok video upload failed: ${response.statusText} - ${errorText}`);
    }
  }
  
  /**
   * Publish the uploaded video
   */
  async publishVideo(accessToken: string, publishId: string): Promise<TikTokPublishResponse> {
    const response = await fetch(`${this.baseUrl}/v2/post/publish/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publish_id: publishId
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`TikTok video publish failed: ${data.error?.message || 'Unknown error'}`);
    }
    
    return data;
  }
  
  /**
   * Check the status of a published video
   */
  async getPublishStatus(accessToken: string, publishId: string): Promise<TikTokStatusResponse> {
    const response = await fetch(`${this.baseUrl}/v2/post/publish/status/fetch/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publish_id: publishId
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`TikTok status check failed: ${data.error?.message || 'Unknown error'}`);
    }
    
    return data;
  }
  
  /**
   * Complete video upload workflow - convenience method
   */
  async uploadAndPublishVideo(
    accessToken: string,
    videoFile: File,
    title: string,
    description?: string
  ): Promise<{ publishId: string; shareUrl?: string; status: string }> {
    // Convert File to ArrayBuffer
    const videoBuffer = await videoFile.arrayBuffer();
    
    // Step 1: Initialize upload
    const initResult = await this.initializeVideoUpload(
      accessToken,
      videoBuffer.byteLength,
      title,
      description
    );
    
    // Step 2: Upload video file
    await this.uploadVideoFile(initResult.data.upload_url, videoBuffer);
    
    // Step 3: Publish video
    const publishResult = await this.publishVideo(accessToken, initResult.data.publish_id);
    
    // Step 4: Wait for processing and check status
    let status = 'PROCESSING';
    let attempts = 0;
    const maxAttempts = 10;
    
    while (status === 'PROCESSING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const statusResult = await this.getPublishStatus(accessToken, initResult.data.publish_id);
        status = statusResult.data.status;
        
        if (status === 'PUBLISHED' || status === 'FAILED') {
          break;
        }
      } catch (error) {
        console.warn('Status check failed:', error);
      }
      
      attempts++;
    }
    
    return {
      publishId: initResult.data.publish_id,
      shareUrl: publishResult.data.share_url,
      status
    };
  }
}
