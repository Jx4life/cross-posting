
import { supabase } from '@/integrations/supabase/client';
import { FarcasterQRAuth } from './FarcasterQRAuth';

export class FarcasterAuthService {
  private auth: FarcasterQRAuth | null = null;
  
  private async getApiKey(): Promise<string> {
    console.log('🔑 === FETCHING NEYNAR API KEY ===');
    
    try {
      console.log('📡 Calling Supabase edge function...');
      
      const { data, error } = await supabase.functions.invoke('get-secret', {
        body: { name: 'NEYNAR_API_KEY' }
      });
      
      console.log('📋 Edge function response:', { 
        hasData: !!data, 
        hasError: !!error,
        errorMessage: error?.message,
        dataKeys: data ? Object.keys(data) : []
      });
      
      if (error) {
        console.error('❌ Error fetching Neynar API key:', error);
        throw new Error(`Failed to retrieve Neynar API key: ${error.message}`);
      }
      
      if (!data || !data.value) {
        console.error('❌ No API key value returned:', data);
        throw new Error('Neynar API key not found in configuration');
      }
      
      console.log('✅ API key retrieved successfully');
      console.log('🔍 API key length:', data.value.length);
      console.log('🔍 API key prefix:', data.value.substring(0, 8) + '...');
      
      return data.value;
      
    } catch (error: any) {
      console.error('❌ Failed to get API key:', error);
      throw new Error(`Failed to retrieve Neynar API key: ${error.message}`);
    }
  }
  
  private async initializeAuth(): Promise<FarcasterQRAuth> {
    if (this.auth) {
      console.log('♻️ Reusing existing auth instance');
      return this.auth;
    }
    
    console.log('🏗️ === INITIALIZING FARCASTER AUTH SERVICE ===');
    
    const apiKey = await this.getApiKey();
    
    const config = {
      clientId: 'c8655842-2b6b-4763-bcc2-50119d871c23',
      redirectUri: `${window.location.origin}/auth/callback/farcaster`,
      apiKey
    };
    
    console.log('⚙️ Auth configuration:', {
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      hasApiKey: !!config.apiKey,
      apiKeyLength: config.apiKey.length
    });
    
    this.auth = new FarcasterQRAuth(config);
    
    console.log('✅ Farcaster auth service initialized');
    return this.auth;
  }
  
  async createSigner() {
    console.log('🚀 === FARCASTER AUTH SERVICE: CREATE SIGNER ===');
    
    const auth = await this.initializeAuth();
    console.log('✅ Auth service initialized, calling createSigner...');
    
    const result = await auth.createSigner();
    console.log('📋 CreateSigner result:', JSON.stringify(result, null, 2));
    
    return result;
  }
  
  async getSigner(signerUuid: string) {
    console.log('🔍 === FARCASTER AUTH SERVICE: GET SIGNER ===');
    console.log('🎯 Target UUID:', signerUuid);
    
    const auth = await this.initializeAuth();
    console.log('✅ Auth service ready, calling getSigner...');
    
    const result = await auth.getSigner(signerUuid);
    console.log('📋 GetSigner result:', JSON.stringify(result, null, 2));
    
    return result;
  }
  
  async getUserByFid(fid: number) {
    console.log('👤 === FARCASTER AUTH SERVICE: GET USER BY FID ===');
    console.log('🎯 Target FID:', fid);
    
    const auth = await this.initializeAuth();
    console.log('✅ Auth service ready, calling getUserByFid...');
    
    const result = await auth.getUserByFid(fid);
    console.log('📋 GetUserByFid result:', JSON.stringify(result, null, 2));
    
    return result;
  }
}
