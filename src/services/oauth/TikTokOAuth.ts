
import { TikTokAPI, TikTokConfig } from '../tiktok/TikTokAPI';

export interface TikTokOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export class TikTokOAuth {
  private api: TikTokAPI;
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
  
  getAPI(): TikTokAPI {
    return this.api;
  }
}
