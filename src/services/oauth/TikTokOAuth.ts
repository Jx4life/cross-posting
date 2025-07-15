
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
    this.config = config;
    this.api = new TikTokAPI(config);
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
