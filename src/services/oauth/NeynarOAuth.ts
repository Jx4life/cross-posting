
export interface NeynarOAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes?: string[];
}

export interface NeynarTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user?: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  };
}

export class NeynarOAuth {
  private config: NeynarOAuthConfig;
  
  constructor(config: NeynarOAuthConfig) {
    this.config = config;
  }
  
  generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes?.join(' ') || 'read write',
    });
    
    return `https://app.neynar.com/oauth/authorize?${params.toString()}`;
  }
  
  async exchangeCodeForToken(code: string): Promise<NeynarTokenResponse> {
    const response = await fetch('https://api.neynar.com/v2/farcaster/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: import.meta.env.VITE_NEYNAR_CLIENT_SECRET,
        code,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Neynar token exchange failed: ${error}`);
    }
    
    return response.json();
  }
}
