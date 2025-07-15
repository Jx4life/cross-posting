
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
    console.log('=== NEYNAR TOKEN EXCHANGE WITHOUT CLIENT SECRET ===');
    console.log('Using client ID only flow');
    
    // Try the public client flow first (no client secret required)
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
      // If the public flow fails, it might be because Neynar requires a different approach
      // Let's try an alternative approach using the authorization code directly
      console.log('Standard token exchange failed, trying alternative approach');
      
      // For some OAuth providers, the authorization code can be used directly
      // or there might be a different endpoint for public clients
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
