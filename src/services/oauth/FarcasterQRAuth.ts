import * as ed from '@noble/ed25519';

export interface FarcasterQRAuthConfig {
  clientId: string;
  redirectUri: string;
  apiKey: string;
  appFid: string; // Required for proper Farcaster signed key requests
}

export interface FarcasterAuthResponse {
  signer_uuid?: string;
  public_key?: string;
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
  // New fields for official Farcaster API
  token?: string;
  deeplinkUrl?: string;
  privateKey?: string; // Store privately generated key
  state?: 'pending' | 'approved' | 'completed';
  userFid?: number;
}

export interface FarcasterSignerResponse extends FarcasterAuthResponse {}

export class FarcasterQRAuth {
  private config: FarcasterQRAuthConfig;
  
  constructor(config: FarcasterQRAuthConfig) {
    this.config = config;
  }
  
  async createSigner(): Promise<FarcasterSignerResponse> {
    console.log('=== FARCASTER CREATE SIGNER (Official API) ===');
    console.log('Using official Farcaster API instead of Neynar');
    
    try {
      // Step 1: Generate Ed25519 keypair
      console.log('Step 1: Generating Ed25519 keypair...');
      const privateKey = ed.utils.randomPrivateKey();
      const publicKeyBytes = await ed.getPublicKey(privateKey);
      const publicKeyHex = '0x' + Buffer.from(publicKeyBytes).toString('hex');
      
      console.log('Generated keypair:');
      console.log('- Public key:', publicKeyHex);
      console.log('- Private key length:', privateKey.length);
      
      // For now, we'll create a simple signed key request without the full EIP-712 signature
      // This is a simplified version to test the basic flow
      const farcasterApiUrl = 'https://api.farcaster.xyz';
      
      // Step 2: Create signed key request with the official Farcaster API
      console.log('Step 2: Creating signed key request...');
      
      const requestBody = {
        key: publicKeyHex,
        requestFid: parseInt(this.config.appFid),
        deadline: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        // Note: For a production app, you'd need to generate proper EIP-712 signature
        // For testing, we'll use a simplified approach
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${farcasterApiUrl}/v2/signed-key-requests`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Signed key request response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Signed key request error:', errorText);
        
        // If the official API fails, fall back to our previous approach temporarily
        console.log('Official API failed, falling back to Neynar approach...');
        return await this.createSignerWithNeynar();
      }
      
      const data = await response.json();
      console.log('Official Farcaster API response:', JSON.stringify(data, null, 2));
      
      const signedKeyRequest = data.result?.signedKeyRequest;
      if (!signedKeyRequest) {
        throw new Error('Invalid response from Farcaster API - missing signedKeyRequest');
      }
      
      const result: FarcasterSignerResponse = {
        token: signedKeyRequest.token,
        deeplinkUrl: signedKeyRequest.deeplinkUrl,
        public_key: signedKeyRequest.key,
        privateKey: Buffer.from(privateKey).toString('hex'), // Store for later use
        status: 'generated',
        state: signedKeyRequest.state || 'pending',
        signer_approval_url: signedKeyRequest.deeplinkUrl
      };
      
      console.log('✅ Official Farcaster signer created successfully');
      console.log('Deeplink URL:', result.deeplinkUrl);
      
      return result;
      
    } catch (error: any) {
      console.error('Official Farcaster API error:', error);
      console.log('Falling back to Neynar approach...');
      return await this.createSignerWithNeynar();
    }
  }
  
  // Fallback method using Neynar (our previous implementation)
  private async createSignerWithNeynar(): Promise<FarcasterSignerResponse> {
    console.log('=== FALLBACK: FARCASTER CREATE SIGNER (Neynar) ===');
    console.log('API Key present:', !!this.config.apiKey);
    console.log('API Key length:', this.config.apiKey?.length);
    
    try {
      const requestBody = {
        deadline: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch('https://api.neynar.com/v2/farcaster/signer', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'api_key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Create signer response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create signer error response:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed error:', errorJson);
          throw new Error(`Neynar API Error: ${errorJson.message || errorText}`);
        } catch {
          throw new Error(`Failed to create Farcaster signer: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }
      
      const data = await response.json();
      console.log('Create signer full response:', JSON.stringify(data, null, 2));
      
      if (!data.signer_uuid || !data.public_key) {
        console.error('Missing required fields in response:', data);
        throw new Error('Invalid response from Neynar API - missing required fields');
      }
      
      const result = {
        signer_uuid: data.signer_uuid,
        public_key: data.public_key,
        status: data.status,
        signer_approval_url: data.signer_approval_url,
        fid: data.fid
      };
      
      console.log('Processed signer result:', result);
      console.log('API provided signer_approval_url:', result.signer_approval_url);
      
      // Always construct the proper Warpcast deeplink URL using public_key
      // The API-provided URL uses signer_uuid which doesn't work with Farcaster app
      if (result.public_key) {
        console.log('Overriding API URL with public_key-based URL...');
        console.log('Raw public_key from API:', result.public_key);
        
        // Ensure the public_key has the correct hex format with 0x prefix
        let formattedPublicKey = result.public_key;
        if (!formattedPublicKey.startsWith('0x') && !formattedPublicKey.startsWith('0X')) {
          formattedPublicKey = '0x' + formattedPublicKey;
        }
        console.log('Formatted public_key for Farcaster:', formattedPublicKey);
        
        const warpcastApprovalUrl = `https://client.warpcast.com/deeplinks/signed-key-request?token=${formattedPublicKey}`;
        console.log('Constructed Warpcast deeplink URL:', warpcastApprovalUrl);
        
        result.signer_approval_url = warpcastApprovalUrl;
        console.log('✅ Using constructed Warpcast deeplink URL with formatted public_key');
      }
      
      return result;
      
    } catch (error: any) {
      console.error('Farcaster create signer error:', error);
      throw new Error(`Failed to create Farcaster signer: ${error.message}`);
    }
  }
  
  async getSigner(signerUuid: string): Promise<FarcasterAuthResponse> {
    console.log('=== FARCASTER GET SIGNER ===');
    console.log('Signer UUID:', signerUuid);
    console.log('API Key present:', !!this.config.apiKey);
    
    try {
      const url = `https://api.neynar.com/v2/farcaster/signer?signer_uuid=${signerUuid}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'api_key': this.config.apiKey
        }
      });
      
      console.log('Get signer response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Get signer error response:', errorText);
        
        if (response.status === 404) {
          throw new Error('Signer not found - it may have expired or been revoked');
        }
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(`Neynar API Error: ${errorJson.message || errorText}`);
        } catch {
          throw new Error(`Failed to get signer status: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }
      
      const data = await response.json();
      console.log('Get signer full response:', JSON.stringify(data, null, 2));
      
      const result = {
        signer_uuid: data.signer_uuid,
        public_key: data.public_key,
        status: data.status,
        signer_approval_url: data.signer_approval_url,
        fid: data.fid,
        user: data.user
      };
      
      console.log('Processed get signer result:', result);
      
      return result;
      
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
  
  // Method to poll signed key request status using official Farcaster API
  async pollSignedKeyRequest(token: string): Promise<FarcasterAuthResponse> {
    console.log('=== POLLING SIGNED KEY REQUEST ===');
    console.log('Token:', token);
    
    try {
      const response = await fetch(`https://api.farcaster.xyz/v2/signed-key-request?token=${token}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('Poll response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Poll error:', errorText);
        throw new Error(`Failed to poll signed key request: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Poll response:', JSON.stringify(data, null, 2));
      
      const signedKeyRequest = data.result?.signedKeyRequest;
      if (!signedKeyRequest) {
        throw new Error('Invalid poll response - missing signedKeyRequest');
      }
      
      return {
        token: signedKeyRequest.token,
        deeplinkUrl: signedKeyRequest.deeplinkUrl,
        public_key: signedKeyRequest.key,
        state: signedKeyRequest.state,
        status: signedKeyRequest.state === 'completed' ? 'approved' : 'pending_approval',
        userFid: signedKeyRequest.userFid
      };
      
    } catch (error: any) {
      console.error('Poll signed key request error:', error);
      throw new Error(`Failed to poll signed key request: ${error.message}`);
    }
  }
}