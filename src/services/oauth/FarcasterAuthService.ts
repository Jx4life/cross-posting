
import { supabase } from '@/integrations/supabase/client';
import { FarcasterQRAuth } from './FarcasterQRAuth';

export class FarcasterAuthService {
  private auth: FarcasterQRAuth | null = null;
  
  private async getApiKey(): Promise<string> {
    const { data, error } = await supabase.functions.invoke('get-secret', {
      body: { name: 'NEYNAR_API_KEY' }
    });
    
    if (error) {
      console.error('Error fetching Neynar API key:', error);
      throw new Error('Failed to retrieve Neynar API key');
    }
    
    return data.value;
  }
  
  private async initializeAuth(): Promise<FarcasterQRAuth> {
    if (this.auth) {
      return this.auth;
    }
    
    const apiKey = await this.getApiKey();
    
    this.auth = new FarcasterQRAuth({
      clientId: 'c8655842-2b6b-4763-bcc2-50119d871c23',
      redirectUri: `${window.location.origin}/auth/callback/farcaster`,
      apiKey
    });
    
    return this.auth;
  }
  
  async createSigner() {
    const auth = await this.initializeAuth();
    return auth.createSigner();
  }
  
  async getSigner(signerUuid: string) {
    const auth = await this.initializeAuth();
    return auth.getSigner(signerUuid);
  }
  
  async getUserByFid(fid: number) {
    const auth = await this.initializeAuth();
    return auth.getUserByFid(fid);
  }
}
