
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

export interface TikTokVideoUploadResponse {
  video_id: string;
  status: string;
  upload_url?: string;
}

export interface TikTokPostResponse {
  video_id: string;
  share_url: string;
  status: string;
}

export class TikTokAPI {
  private config: TikTokConfig;
  private baseUrl = 'https://open.tiktokapis.com';
  
  constructor(config: TikTokConfig) {
    this.config = config;
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
  
  async uploadVideo(
    accessToken: string,
    videoFile: File,
    title: string,
    description?: string
  ): Promise<TikTokVideoUploadResponse> {
    // First, initialize video upload
    const initResponse = await fetch(`${this.baseUrl}/v2/post/publish/video/init/`, {
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
          video_size: videoFile.size,
          chunk_size: videoFile.size,
          total_chunk_count: 1
        }
      })
    });
    
    const initData = await initResponse.json();
    
    if (!initResponse.ok) {
      throw new Error(`TikTok video init failed: ${initData.error?.message || 'Unknown error'}`);
    }
    
    // Upload video file
    const uploadUrl = initData.data.upload_url;
    const publishId = initData.data.publish_id;
    
    const formData = new FormData();
    formData.append('video', videoFile);
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`TikTok video upload failed: ${uploadResponse.statusText}`);
    }
    
    return {
      video_id: publishId,
      status: 'uploaded',
      upload_url: uploadUrl
    };
  }
  
  async publishVideo(
    accessToken: string,
    publishId: string
  ): Promise<TikTokPostResponse> {
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
    
    return {
      video_id: publishId,
      share_url: data.data.share_url,
      status: data.data.status
    };
  }
  
  async getVideoStatus(accessToken: string, publishId: string): Promise<any> {
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
      throw new Error(`TikTok video status failed: ${data.error?.message || 'Unknown error'}`);
    }
    
    return data.data;
  }
}
