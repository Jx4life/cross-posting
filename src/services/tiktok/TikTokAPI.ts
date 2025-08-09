
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

export interface TikTokVideoPostResult {
  publishId: string;
  shareUrl?: string;
  status: string;
  method: 'file_upload' | 'direct_url';
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
}
