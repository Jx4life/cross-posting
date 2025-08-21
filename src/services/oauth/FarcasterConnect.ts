import { supabase } from '@/integrations/supabase/client';

export interface FarcasterConnectConfig {
  domain: string;
  siweUri: string;
  nonce: string;
}

export interface FarcasterConnectResult {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  custody: string;
  verifications: string[];
}

export class FarcasterConnect {
  private config: FarcasterConnectConfig;
  
  constructor() {
    this.config = {
      domain: window.location.hostname,
      siweUri: window.location.origin,
      nonce: this.generateNonce()
    };
  }
  
  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  
  async createConnectUrl(): Promise<string> {
    console.log('=== FARCASTER CONNECT: Creating Connect URL ===');
    
    const params = new URLSearchParams({
      domain: this.config.domain,
      siweUri: this.config.siweUri,
      nonce: this.config.nonce
    });
    
    const connectUrl = `https://connect.farcaster.xyz/connect?${params.toString()}`;
    console.log('📱 Farcaster Connect URL:', connectUrl);
    
    return connectUrl;
  }
  
  async pollForResult(nonce: string): Promise<FarcasterConnectResult> {
    console.log('=== FARCASTER CONNECT: Polling for Result ===');
    console.log('🎯 Polling nonce:', nonce);
    
    const maxAttempts = 60; // 5 minutes at 5-second intervals
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`🔍 Poll attempt ${attempts + 1}/${maxAttempts}`);
        
        const response = await fetch(`https://connect.farcaster.xyz/v1/connect/status?nonce=${nonce}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.log('⏳ No result yet, continuing to poll...');
          await this.sleep(5000);
          attempts++;
          continue;
        }
        
        const data = await response.json();
        console.log('✅ Farcaster Connect Result:', data);
        
        if (data.state === 'completed' && data.connectUri) {
          // Parse the result from the connect URI
          const result = this.parseConnectResult(data);
          console.log('🎉 Authentication successful:', result);
          return result;
        }
        
        console.log('⏳ Still waiting for user approval...');
        await this.sleep(5000);
        attempts++;
        
      } catch (error) {
        console.error('❌ Polling error:', error);
        await this.sleep(5000);
        attempts++;
      }
    }
    
    throw new Error('Authentication timed out - user did not complete the connection');
  }
  
  private parseConnectResult(data: any): FarcasterConnectResult {
    // Extract user data from the Farcaster Connect response
    const userData = data.userData || {};
    
    return {
      fid: userData.fid || 0,
      username: userData.username || '',
      displayName: userData.displayName || '',
      pfpUrl: userData.pfpUrl || '',
      custody: userData.custody || '',
      verifications: userData.verifications || []
    };
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  getNonce(): string {
    return this.config.nonce;
  }
}