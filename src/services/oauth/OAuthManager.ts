
import { TwitterOAuth, TwitterOAuthConfig } from './TwitterOAuth';
import { FacebookOAuth, FacebookOAuthConfig } from './FacebookOAuth';
import { NeynarOAuth } from './NeynarOAuth';
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
}

export class OAuthManager {
  private twitter: TwitterOAuth;
  private facebook: FacebookOAuth;
  private neynar: NeynarOAuth;
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
    
    this.neynar = new NeynarOAuth({
      clientId: import.meta.env.VITE_NEYNAR_CLIENT_ID || 'demo_client_id',
      redirectUri: `${window.location.origin}/auth/callback/neynar`,
      scopes: ['read', 'write']
    });
    
    this.lens = new LensOAuth();
  }
  
  async initiateTwitterAuth(): Promise<string> {
    const authUrl = this.twitter.generateAuthUrl();
    this.storeAuthState('twitter', { timestamp: Date.now() });
    return authUrl;
  }
  
  async initiateFacebookAuth(): Promise<string> {
    const authUrl = this.facebook.generateAuthUrl();
    this.storeAuthState('facebook', { timestamp: Date.now() });
    return authUrl;
  }
  
  async initiateFarcasterAuth(): Promise<string> {
    const authUrl = this.neynar.generateAuthUrl();
    this.storeAuthState('farcaster', { timestamp: Date.now() });
    return authUrl;
  }
  
  async initiateLensAuth(): Promise<{ handle: string; address: string }> {
    const { address, signature } = await this.lens.connectWallet();
    
    // Store wallet connection
    localStorage.setItem('walletAddress', address);
    localStorage.setItem('walletSignature', signature);
    
    // Try to get Lens profile
    const profile = await this.lens.getLensProfile(address);
    
    if (profile) {
      localStorage.setItem('lensHandle', profile.handle);
      localStorage.setItem('lensProfileId', profile.profileId);
      return { handle: profile.handle, address };
    }
    
    throw new Error('No Lens profile found for this wallet address');
  }
  
  async handleCallback(platform: string, code: string): Promise<OAuthCredentials> {
    const authState = this.getAuthState(platform);
    if (!authState) {
      throw new Error('Invalid auth state');
    }
    
    switch (platform) {
      case 'twitter':
        const twitterTokens = await this.twitter.exchangeCodeForToken(code);
        return {
          accessToken: twitterTokens.access_token,
          refreshToken: twitterTokens.refresh_token
        };
        
      case 'facebook':
        const facebookTokens = await this.facebook.exchangeCodeForToken(code);
        return {
          accessToken: facebookTokens.access_token,
          expiresAt: facebookTokens.expires_in ? Date.now() + (facebookTokens.expires_in * 1000) : undefined
        };
        
      case 'farcaster':
        const farcasterTokens = await this.neynar.exchangeCodeForToken(code);
        return {
          accessToken: farcasterTokens.access_token,
          refreshToken: farcasterTokens.refresh_token,
          expiresAt: farcasterTokens.expires_in ? Date.now() + (farcasterTokens.expires_in * 1000) : undefined,
          username: farcasterTokens.user?.username,
          fid: farcasterTokens.user?.fid,
          displayName: farcasterTokens.user?.display_name,
          pfpUrl: farcasterTokens.user?.pfp_url
        };
        
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
  
  private storeAuthState(platform: string, state: any): void {
    localStorage.setItem(`oauth_state_${platform}`, JSON.stringify(state));
  }
  
  private getAuthState(platform: string): any {
    const state = localStorage.getItem(`oauth_state_${platform}`);
    return state ? JSON.parse(state) : null;
  }
  
  clearAuthState(platform: string): void {
    localStorage.removeItem(`oauth_state_${platform}`);
  }
  
  // Store and retrieve credentials securely
  storeCredentials(platform: string, credentials: OAuthCredentials): void {
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
    localStorage.removeItem(`oauth_credentials_${platform}`);
  }
  
  isConnected(platform: string): boolean {
    if (platform === 'lens') {
      return !!(localStorage.getItem('walletAddress') && localStorage.getItem('lensHandle'));
    }
    return !!this.getCredentials(platform);
  }
}

export const oauthManager = new OAuthManager();
