import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';

// Configure the hash function for web environments
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

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
    console.log('=== FARCASTER CREATE SIGNER (Neynar Only) ===');
    console.log('Using Neynar API exclusively for consistent token management');
    
    // Use Neynar API exclusively - this ensures consistent token format between creation and polling
    return await this.createSignerWithNeynar();
  }
  
  // Primary method using Neynar for consistent token management
  private async createSignerWithNeynar(): Promise<FarcasterSignerResponse> {
    console.log('=== FARCASTER CREATE SIGNER (Neynar) ===');
    console.log('API Key present:', !!this.config.apiKey);
    console.log('API Key length:', this.config.apiKey?.length);
    
    try {
      const requestBody = {
        deadline: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        sponsor_fid: parseInt(this.config.appFid) // Required for public authentication
      };
      
      console.log('Request body for PUBLIC authentication:', requestBody);
      console.log('🌍 Using sponsor_fid for public user authentication');
      
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
      console.log('🔍 Detailed field analysis:');
      console.log('  - signer_uuid:', data.signer_uuid, '(type:', typeof data.signer_uuid, ', length:', data.signer_uuid?.length, ')');
      console.log('  - public_key:', data.public_key, '(type:', typeof data.public_key, ', length:', data.public_key?.length, ')');
      console.log('  - status:', data.status);
      console.log('  - signer_approval_url:', data.signer_approval_url);
      
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
      
      // If Neynar doesn't provide a proper Warpcast URL, we need to use the API-provided one
      // or construct one with the signer_uuid (not public_key)
      if (!result.signer_approval_url || !result.signer_approval_url.includes('warpcast.com')) {
        console.log('Need to construct Warpcast deeplink URL...');
        console.log('Using signer_uuid:', result.signer_uuid);
        
        // Use the signer_uuid for the Warpcast deeplink (not public_key)
        const warpcastApprovalUrl = `https://client.warpcast.com/deeplinks/signed-key-request?token=${result.signer_uuid}`;
        console.log('Constructed Warpcast deeplink URL with signer_uuid:', warpcastApprovalUrl);
        
        result.signer_approval_url = warpcastApprovalUrl;
        console.log('✅ Using constructed Warpcast deeplink URL with signer_uuid');
      } else {
        console.log('✅ Using API-provided approval URL:', result.signer_approval_url);
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
      console.log('🔍 Polling response analysis:');
      console.log('  - Request was for signer_uuid:', signerUuid);
      console.log('  - Response signer_uuid:', data.signer_uuid, '(matches request:', data.signer_uuid === signerUuid, ')');
      console.log('  - Response status:', data.status);
      console.log('  - Response public_key:', data.public_key);
      
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