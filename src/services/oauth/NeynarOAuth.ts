
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
    console.log('=== NEYNAR TOKEN EXCHANGE ===');
    console.log('Exchanging code for token:', code);
    
    const tokenPayload = {
      client_id: this.config.clientId,
      code,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code',
    };
    
    console.log('Token exchange payload:', tokenPayload);
    
    const response = await fetch('https://api.neynar.com/v2/farcaster/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(tokenPayload),
    });
    
    console.log('Token exchange response status:', response.status);
    
    const responseText = await response.text();
    console.log('Token exchange response:', responseText);
    
    if (!response.ok) {
      throw new Error(`Neynar token exchange failed (${response.status}): ${responseText}`);
    }
    
    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid token response format: ${responseText}`);
    }
    
    console.log('Token exchange successful:', tokenData);
    return tokenData;
  }
}
