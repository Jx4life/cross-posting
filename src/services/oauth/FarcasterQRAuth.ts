
export interface FarcasterQRAuthConfig {
  clientId: string;
  redirectUri: string;
  apiKey: string;
}

export interface FarcasterAuthResponse {
  signer_uuid: string;
  public_key: string;
  status: 'generated' | 'pending_approval' | 'approved' | 'revoked';
  signer_approval_url?: string;
  fid?: number;
  user?: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    custody_address?: string;
    verification_addresses?: string[];
  };
}

export interface FarcasterSignerResponse {
  signer_uuid: string;
  public_key: string;
  status: 'generated' | 'pending_approval' | 'approved' | 'revoked';
  signer_approval_url?: string;
  fid?: number;
}

export class FarcasterQRAuth {
  private config: FarcasterQRAuthConfig;
  
  constructor(config: FarcasterQRAuthConfig) {
    this.config = config;
  }
  
  async createSigner(): Promise<FarcasterSignerResponse> {
    console.log('=== FARCASTER CREATE SIGNER ===');
    console.log('API Key present:', !!this.config.apiKey);
    
    try {
      const response = await fetch('https://api.neynar.com/v2/farcaster/signer', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'api_key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      console.log('Create signer response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create signer error:', errorText);
        throw new Error(`Failed to create Farcaster signer: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Create signer successful:', data);
      
      return {
        signer_uuid: data.signer_uuid,
        public_key: data.public_key,
        status: data.status,
        signer_approval_url: data.signer_approval_url,
        fid: data.fid
      };
      
    } catch (error: any) {
      console.error('Farcaster create signer error:', error);
      throw new Error(`Failed to create Farcaster signer: ${error.message}`);
    }
  }
  
  async getSigner(signerUuid: string): Promise<FarcasterAuthResponse> {
    console.log('=== FARCASTER GET SIGNER ===');
    console.log('Signer UUID:', signerUuid);
    
    try {
      const response = await fetch(`https://api.neynar.com/v2/farcaster/signer?signer_uuid=${signerUuid}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'api_key': this.config.apiKey
        }
      });
      
      console.log('Get signer response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Get signer error:', errorText);
        throw new Error(`Failed to get signer status: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Get signer result:', data);
      
      return {
        signer_uuid: data.signer_uuid,
        public_key: data.public_key,
        status: data.status,
        signer_approval_url: data.signer_approval_url,
        fid: data.fid,
        user: data.user
      };
      
    } catch (error: any) {
      console.error('Farcaster get signer error:', error);
      throw new Error(`Failed to get signer status: ${error.message}`);
    }
  }
  
  async getUserByFid(fid: number): Promise<any> {
    console.log('=== FARCASTER GET USER BY FID ===');
    console.log('FID:', fid);
    
    try {
      const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'api_key': this.config.apiKey
        }
      });
      
      console.log('Get user response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Get user error:', errorText);
        throw new Error(`Failed to get user data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Get user result:', data);
      
      return data.users && data.users.length > 0 ? data.users[0] : null;
      
    } catch (error: any) {
      console.error('Farcaster get user error:', error);
      throw new Error(`Failed to get user data: ${error.message}`);
    }
  }
}
