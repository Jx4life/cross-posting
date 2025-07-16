import { TwitterOAuth, TwitterOAuthConfig } from './TwitterOAuth';
import { FacebookOAuth, FacebookOAuthConfig } from './FacebookOAuth';
import { TikTokOAuth, TikTokOAuthConfig } from './TikTokOAuth';
import { NeynarOAuth } from './NeynarOAuth';
import { FarcasterAuthService } from './FarcasterAuthService';
import { LensOAuth } from './LensOAuth';

export interface OAuthCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  username?: string;
  profileId?: string;
  fid?: number;
  displayName?: string;
  pfpUrl?: string;
  openId?: string;
}

export class OAuthManager {
  private twitter: TwitterOAuth;
  private facebook: FacebookOAuth;
  private tiktok: TikTokOAuth;
  private neynar: NeynarOAuth;
  private farcasterAuth: FarcasterAuthService;
  private lens: LensOAuth;
  
  constructor() {
    // Initialize OAuth services with configuration
    this.twitter = new TwitterOAuth({
      clientId: import.meta.env.VITE_TWITTER_CLIENT_ID || 'demo_client_id',
      redirectUri: `${window.location.origin}/auth/callback/twitter`,
      scopes: ['tweet.read', 'tweet.write', 'users.read']
    });
    
    this.facebook = new FacebookOAuth({
      appId: import.meta.env.VITE_FACEBOOK_APP_ID || 'demo_app_id',
      redirectUri: `${window.location.origin}/auth/callback/facebook`,
      scopes: ['pages_manage_posts', 'pages_read_engagement']
    });
    
    this.tiktok = new TikTokOAuth({
      clientId: import.meta.env.VITE_TIKTOK_CLIENT_ID || 'demo_client_id',
      clientSecret: import.meta.env.VITE_TIKTOK_CLIENT_SECRET || 'demo_secret',
      redirectUri: `${window.location.origin}/auth/callback/tiktok`,
      scopes: ['user.info.basic', 'video.publish']
    });
    
    // Keep the old OAuth flow for backward compatibility
    const farcasterRedirectUri = `${window.location.origin}/auth/callback/farcaster`;
    console.log('=== OAUTH MANAGER INIT ===');
    console.log('Farcaster redirect URI:', farcasterRedirectUri);
    
    this.neynar = new NeynarOAuth({
      clientId: 'c8655842-2b6b-4763-bcc2-50119d871c23',
      redirectUri: farcasterRedirectUri,
      scopes: ['read', 'write']
    });
    
    // Initialize the managed signers auth service
    this.farcasterAuth = new FarcasterAuthService();
    
    this.lens = new LensOAuth();
  }
  
  async initiateTwitterAuth(): Promise<string> {
    const authUrl = this.twitter.generateAuthUrl();
    this.storeAuthState('twitter', { timestamp: Date.now() });
    return authUrl;
  }
  
  async initiateFacebookAuth(): Promise<string> {
    try {
      // Try SDK login first (better UX)
      const credentials = await this.facebook.loginWithSDK();
      
      // Store credentials immediately
      this.storeCredentials('facebook', {
        accessToken: credentials.accessToken,
        expiresAt: credentials.expiresAt,
        profileId: credentials.user?.id,
        username: credentials.user?.name
      });

      // Return success message instead of URL since login is complete
      return 'success';
    } catch (error) {
      console.warn('SDK login failed, falling back to redirect flow:', error);
      
      // Fallback to traditional OAuth flow
      const authUrl = await this.facebook.getAuthUrl();
      this.storeAuthState('facebook', { timestamp: Date.now() });
      return authUrl;
    }
  }

  async initiateTikTokAuth(): Promise<string> {
    const authUrl = this.tiktok.generateAuthUrl();
    this.storeAuthState('tiktok', { timestamp: Date.now() });
    return authUrl;
  }
  
  async initiateFarcasterAuth(): Promise<string> {
    console.log('=== INITIATING FARCASTER AUTH ===');
    
    try {
      const authUrl = this.neynar.generateAuthUrl();
      this.storeAuthState('farcaster', { 
        timestamp: Date.now(),
        redirectUri: this.neynar['config'].redirectUri
      });
      
      console.log('Farcaster auth URL generated:', authUrl);
      return authUrl;
      
    } catch (error: any) {
      console.error('Error initiating Farcaster auth:', error);
      throw new Error(`Failed to initiate Farcaster auth: ${error.message}`);
    }
  }

  // Updated method for QR-based Farcaster authentication
  async initiateFarcasterQRAuth(): Promise<any> {
    console.log('=== INITIATING FARCASTER QR AUTH ===');
    
    try {
      const signerResponse = await this.farcasterAuth.createSigner();
      
      this.storeAuthState('farcaster_qr', { 
        timestamp: Date.now(),
        signer_uuid: signerResponse.signer_uuid,
        public_key: signerResponse.public_key
      });
      
      console.log('Farcaster QR auth initiated:', signerResponse);
      return signerResponse;
      
    } catch (error: any) {
      console.error('Error initiating Farcaster QR auth:', error);
      throw new Error(`Failed to initiate Farcaster QR auth: ${error.message}`);
    }
  }
  
  async initiateLensAuth(): Promise<{ handle: string; address: string }> {
    try {
      console.log('=== OAUTH MANAGER: INITIATING LENS AUTH ===');
      
      const { address, signature } = await this.lens.connectWallet();
      
      // Store wallet connection
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('walletSignature', signature);
      
      // Try to get Lens profile
      const profile = await this.lens.getLensProfile(address);
      
      if (profile) {
        localStorage.setItem('lensHandle', profile.handle);
        localStorage.setItem('lensProfileId', profile.profileId);
        
        console.log('Lens auth successful:', { handle: profile.handle, address });
        
        return { handle: profile.handle, address };
      }
      
      throw new Error('No Lens profile found for this wallet address');
      
    } catch (error: any) {
      console.error('OAuth Manager - Lens auth error:', error);
      
      // Clean up any partial state
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletSignature');
      localStorage.removeItem('lensHandle');
      localStorage.removeItem('lensProfileId');
      
      throw error;
    }
  }
  
  async handleCallback(platform: string, code: string): Promise<OAuthCredentials> {
    console.log('=== OAUTH MANAGER: HANDLING CALLBACK ===');
    console.log('Platform:', platform);
    console.log('Code:', code);
    
    const authState = this.getAuthState(platform);
    console.log('Auth state:', authState);
    
    if (!authState) {
      throw new Error('Invalid auth state - no authentication session found');
    }
    
    // Check if auth state is too old (5 minutes)
    if (Date.now() - authState.timestamp > 5 * 60 * 1000) {
      this.clearAuthState(platform);
      throw new Error('Authentication session expired');
    }
    
    switch (platform) {
      case 'twitter':
        try {
          const twitterTokens = await this.twitter.exchangeCodeForToken(code);
          return {
            accessToken: twitterTokens.access_token,
            refreshToken: twitterTokens.refresh_token
          };
        } catch (error: any) {
          console.error('Twitter callback error:', error);
          throw new Error(`Twitter authentication failed: ${error.message}`);
        }
        
      case 'facebook':
        try {
          const facebookTokens = await this.facebook.exchangeCodeForToken(code);
          return {
            accessToken: facebookTokens.access_token,
            expiresAt: facebookTokens.expires_in ? Date.now() + (facebookTokens.expires_in * 1000) : undefined
          };
        } catch (error: any) {
          console.error('Facebook callback error:', error);
          throw new Error(`Facebook authentication failed: ${error.message}`);
        }
        
      case 'tiktok':
        try {
          const tiktokTokens = await this.tiktok.exchangeCodeForToken(code);
          return {
            accessToken: tiktokTokens.access_token,
            refreshToken: tiktokTokens.refresh_token,
            expiresAt: tiktokTokens.expires_in ? Date.now() + (tiktokTokens.expires_in * 1000) : undefined,
            openId: tiktokTokens.open_id
          };
        } catch (error: any) {
          console.error('TikTok callback error:', error);
          throw new Error(`TikTok authentication failed: ${error.message}`);
        }
        
      case 'farcaster':
        try {
          console.log('Processing Farcaster token exchange...');
          const farcasterTokens = await this.neynar.exchangeCodeForToken(code);
          
          const credentials: OAuthCredentials = {
            accessToken: farcasterTokens.access_token,
            refreshToken: farcasterTokens.refresh_token,
            expiresAt: farcasterTokens.expires_in ? Date.now() + (farcasterTokens.expires_in * 1000) : undefined,
            username: farcasterTokens.user?.username,
            fid: farcasterTokens.user?.fid,
            displayName: farcasterTokens.user?.display_name,
            pfpUrl: farcasterTokens.user?.pfp_url
          };
          
          console.log('Farcaster credentials processed:', credentials);
          return credentials;
          
        } catch (error: any) {
          console.error('Farcaster callback error:', error);
          throw new Error(`Farcaster authentication failed: ${error.message}`);
        }
        
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
  
  private storeAuthState(platform: string, state: any): void {
    console.log(`Storing auth state for ${platform}:`, state);
    localStorage.setItem(`oauth_state_${platform}`, JSON.stringify(state));
  }
  
  private getAuthState(platform: string): any {
    const state = localStorage.getItem(`oauth_state_${platform}`);
    return state ? JSON.parse(state) : null;
  }
  
  clearAuthState(platform: string): void {
    console.log(`Clearing auth state for ${platform}`);
    localStorage.removeItem(`oauth_state_${platform}`);
  }
  
  // Store and retrieve credentials securely
  storeCredentials(platform: string, credentials: OAuthCredentials): void {
    console.log(`Storing credentials for ${platform}:`, credentials);
    localStorage.setItem(`oauth_credentials_${platform}`, JSON.stringify({
      ...credentials,
      timestamp: Date.now()
    }));
  }
  
  getCredentials(platform: string): OAuthCredentials | null {
    const stored = localStorage.getItem(`oauth_credentials_${platform}`);
    if (!stored) return null;
    
    const credentials = JSON.parse(stored);
    
    // Check if credentials are expired
    if (credentials.expiresAt && Date.now() > credentials.expiresAt) {
      this.clearCredentials(platform);
      return null;
    }
    
    return credentials;
  }
  
  clearCredentials(platform: string): void {
    console.log(`Clearing credentials for ${platform}`);
    localStorage.removeItem(`oauth_credentials_${platform}`);
  }
  
  // Updated method to check if connected (includes signer-based auth)
  isConnected(platform: string): boolean {
    if (platform === 'lens') {
      return !!(localStorage.getItem('walletAddress') && localStorage.getItem('lensHandle'));
    }
    
    if (platform === 'farcaster') {
      // Check both traditional OAuth and signer-based auth
      const credentials = this.getCredentials(platform);
      const signerData = localStorage.getItem('farcaster_signer');
      return !!(credentials || signerData);
    }
    
    return !!this.getCredentials(platform);
  }
  
  // Method to store Farcaster signer data
  storeFarcasterSigner(signerData: any): void {
    console.log('Storing Farcaster signer:', signerData);
    localStorage.setItem('farcaster_signer', JSON.stringify({
      ...signerData,
      timestamp: Date.now()
    }));
  }
  
  // Method to get Farcaster signer data
  getFarcasterSigner(): any {
    const stored = localStorage.getItem('farcaster_signer');
    return stored ? JSON.parse(stored) : null;
  }
  
  // Method to clear Farcaster signer data
  clearFarcasterSigner(): void {
    console.log('Clearing Farcaster signer');
    localStorage.removeItem('farcaster_signer');
  }

  // Method to get TikTok API instance
  getTikTokAPI() {
    return this.tiktok.getAPI();
  }
}

export const oauthManager = new OAuthManager();
