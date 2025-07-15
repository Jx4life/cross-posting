
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
    
    const authUrl = `https://app.neynar.com/oauth/authorize?${params.toString()}`;
    console.log('=== NEYNAR AUTH URL ===');
    console.log('Generated auth URL:', authUrl);
    console.log('Client ID:', this.config.clientId);
    console.log('Redirect URI:', this.config.redirectUri);
    
    return authUrl;
  }
  
  async exchangeCodeForToken(code: string): Promise<NeynarTokenResponse> {
    console.log('=== NEYNAR TOKEN EXCHANGE ===');
    console.log('Exchanging code for token:', code);
    console.log('Client ID:', this.config.clientId);
    console.log('Redirect URI:', this.config.redirectUri);
    
    if (!code) {
      throw new Error('Authorization code is required');
    }
    
    const tokenPayload = {
      client_id: this.config.clientId,
      code,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code',
    };
    
    console.log('Token exchange payload:', JSON.stringify(tokenPayload, null, 2));
    
    try {
      const response = await fetch('https://api.neynar.com/v2/farcaster/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify(tokenPayload),
      });
      
      console.log('Token exchange response status:', response.status);
      console.log('Token exchange response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Token exchange raw response:', responseText);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        throw new Error(`Neynar token exchange failed: ${errorMessage}`);
      }
      
      let tokenData;
      try {
        tokenData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse token response:', parseError);
        throw new Error(`Invalid token response format: ${responseText}`);
      }
      
      console.log('Token exchange successful:', JSON.stringify(tokenData, null, 2));
      
      // Validate required fields
      if (!tokenData.access_token) {
        throw new Error('No access token in response');
      }
      
      return tokenData;
      
    } catch (error: any) {
      console.error('Token exchange error:', error);
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }
}
