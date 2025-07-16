
import { TikTokAPI, TikTokConfig } from '../tiktok/TikTokAPI';
import { TikTokTokenManager } from '../tiktok/TikTokTokenManager';

export interface TikTokOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export class TikTokOAuth {
  private api: TikTokAPI;
  private tokenManager: TikTokTokenManager;
  private config: TikTokOAuthConfig;
  
  constructor(config: TikTokOAuthConfig) {
    // Use sandbox credentials
    const sandboxConfig = {
      ...config,
      clientId: 'sbawjmn8p4yrizyuis',
      clientSecret: 'F51RS5h2sDaZUUxLbDWoe9p5TXEalKxj'
    };
    
    this.config = sandboxConfig;
    this.api = new TikTokAPI(sandboxConfig);
    this.tokenManager = new TikTokTokenManager(this.api);
  }
  
  generateAuthUrl(state?: string): string {
    return this.api.generateAuthUrl(state);
  }
  
  async exchangeCodeForToken(code: string) {
    return this.api.exchangeCodeForToken(code);
  }
  
  async refreshToken(refreshToken: string) {
    return this.api.refreshToken(refreshToken);
  }
  
  async getUserInfo(accessToken: string) {
    return this.api.getUserInfo(accessToken);
  }
  
  /**
   * Get valid access token for a user, refreshing if necessary
   */
  async getValidAccessToken(userId: string): Promise<string> {
    return this.tokenManager.getValidAccessToken(userId);
  }
  
  /**
   * Validate if the current access token is still valid
   */
  async validateToken(accessToken: string): Promise<boolean> {
    return this.tokenManager.validateAccessToken(accessToken);
  }
  
  /**
   * Get user info with automatic token refresh
   */
  async getUserInfoWithRefresh(userId: string): Promise<any> {
    return this.tokenManager.getUserInfoAndUpdate(userId);
  }
  
  /**
   * Revoke user's TikTok access
   */
  async revokeAccess(userId: string): Promise<void> {
    return this.tokenManager.revokeToken(userId);
  }
  
  getAPI(): TikTokAPI {
    return this.api;
  }
  
  getTokenManager(): TikTokTokenManager {
    return this.tokenManager;
  }
}
