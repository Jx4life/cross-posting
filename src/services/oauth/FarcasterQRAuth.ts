
export interface FarcasterQRAuthConfig {
  clientId: string;
  redirectUri: string;
}

export interface FarcasterAuthResponse {
  state: string;
  nonce: string;
  connect_uri: string;
  status: 'pending' | 'completed' | 'expired';
  user?: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  };
}

export interface FarcasterTokenResponse {
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

export class FarcasterQRAuth {
  private config: FarcasterQRAuthConfig;
  
  constructor(config: FarcasterQRAuthConfig) {
    this.config = config;
  }
  
  async initiateAuth(): Promise<FarcasterAuthResponse> {
    console.log('=== FARCASTER QR AUTH INITIATION ===');
    console.log('Client ID:', this.config.clientId);
    console.log('Redirect URI:', this.config.redirectUri);
    
    try {
      const response = await fetch('https://api.neynar.com/v2/farcaster/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          redirect_uri: this.config.redirectUri,
        }),
      });
      
      console.log('Auth initiation response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Auth initiation error:', errorText);
        throw new Error(`Failed to initiate Farcaster auth: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Auth initiation successful:', data);
      
      return {
        state: data.state,
        nonce: data.nonce,
        connect_uri: data.connect_uri,
        status: 'pending'
      };
      
    } catch (error: any) {
      console.error('Farcaster QR auth initiation error:', error);
      throw new Error(`Failed to initiate Farcaster authentication: ${error.message}`);
    }
  }
  
  async pollAuthStatus(state: string, nonce: string): Promise<FarcasterAuthResponse> {
    console.log('=== FARCASTER AUTH STATUS POLLING ===');
    console.log('State:', state);
    console.log('Nonce:', nonce);
    
    try {
      const response = await fetch(`https://api.neynar.com/v2/farcaster/auth/status?state=${state}&nonce=${nonce}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      });
      
      console.log('Status polling response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Status polling error:', errorText);
        throw new Error(`Failed to check auth status: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Status polling result:', data);
      
      return {
        state: data.state,
        nonce: data.nonce,
        connect_uri: data.connect_uri,
        status: data.status,
        user: data.user
      };
      
    } catch (error: any) {
      console.error('Farcaster auth status polling error:', error);
      throw new Error(`Failed to check authentication status: ${error.message}`);
    }
  }
  
  async completeAuth(state: string, nonce: string): Promise<FarcasterTokenResponse> {
    console.log('=== FARCASTER AUTH COMPLETION ===');
    console.log('State:', state);
    console.log('Nonce:', nonce);
    
    try {
      const response = await fetch('https://api.neynar.com/v2/farcaster/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          state: state,
          nonce: nonce,
        }),
      });
      
      console.log('Auth completion response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Auth completion error:', errorText);
        throw new Error(`Failed to complete Farcaster auth: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Auth completion successful:', data);
      
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        user: data.user
      };
      
    } catch (error: any) {
      console.error('Farcaster auth completion error:', error);
      throw new Error(`Failed to complete authentication: ${error.message}`);
    }
  }
}
