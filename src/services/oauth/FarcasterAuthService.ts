
import { supabase } from '@/integrations/supabase/client';
import { FarcasterQRAuth } from './FarcasterQRAuth';

export class FarcasterAuthService {
  private auth: FarcasterQRAuth | null = null;
  
  private async getApiKey(): Promise<string> {
    console.log('=== FETCHING NEYNAR API KEY ===');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-secret', {
        body: { name: 'NEYNAR_API_KEY' }
      });
      
      console.log('Edge function response:', { data, error });
      
      if (error) {
        console.error('Error fetching Neynar API key:', error);
        throw new Error(`Failed to retrieve Neynar API key: ${error.message}`);
      }
      
      if (!data || !data.value) {
        console.error('No API key value returned');
        throw new Error('Neynar API key not found in configuration');
      }
      
      console.log('API key retrieved successfully');
      return data.value;
      
    } catch (error: any) {
      console.error('Failed to get API key:', error);
      throw new Error(`Failed to retrieve Neynar API key: ${error.message}`);
    }
  }
  
  private async initializeAuth(): Promise<FarcasterQRAuth> {
    if (this.auth) {
      return this.auth;
    }
    
    console.log('=== INITIALIZING FARCASTER AUTH SERVICE ===');
    
    const apiKey = await this.getApiKey();
    
    this.auth = new FarcasterQRAuth({
      clientId: 'c8655842-2b6b-4763-bcc2-50119d871c23',
      redirectUri: `${window.location.origin}/auth/callback/farcaster`,
      apiKey
    });
    
    console.log('Farcaster auth service initialized');
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
