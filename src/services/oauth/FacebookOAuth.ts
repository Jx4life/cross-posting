
import { facebookSDK } from './FacebookSDK';

export interface FacebookOAuthConfig {
  appId: string;
  redirectUri: string;
  scopes: string[];
}

export class FacebookOAuth {
  private config: FacebookOAuthConfig;
  
  constructor(config: FacebookOAuthConfig) {
    this.config = config;
  }
  
  generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(','),
      response_type: 'code',
      state: this.generateState()
    });
    
    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  // Enhanced login using Facebook SDK
  async loginWithSDK(): Promise<{ accessToken: string; expiresAt?: number; user?: any; pages?: any[] }> {
    try {
      const loginResponse = await facebookSDK.login();
      
      if (!loginResponse.authResponse) {
        throw new Error('Facebook login was cancelled or failed');
      }

      const { accessToken, expiresIn } = loginResponse.authResponse;
      
      // Get user info
      const user = await facebookSDK.api('/me', { fields: 'id,name,picture' });
      
      // Get user's pages
      let pages = [];
      try {
        const pagesResponse = await facebookSDK.api('/me/accounts');
        pages = pagesResponse.data || [];
      } catch (error) {
        console.warn('Could not fetch user pages:', error);
      }

      // Track login event
      facebookSDK.trackEvent('fb_login');

      return {
        accessToken,
        expiresAt: expiresIn ? Date.now() + (expiresIn * 1000) : undefined,
        user,
        pages
      };
    } catch (error) {
      console.error('Facebook SDK login error:', error);
      throw error;
    }
  }
  
  private generateState(): string {
    return btoa(crypto.getRandomValues(new Uint8Array(32)).toString());
  }
  
  async exchangeCodeForToken(code: string): Promise<{ access_token: string; expires_in?: number; user?: any; pages?: any[] }> {
    const response = await fetch('/functions/v1/facebook-exchange-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri: this.config.redirectUri })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to exchange code for token');
    }
    
    return response.json();
  }

  async getAuthUrl(): Promise<string> {
    const response = await fetch('/functions/v1/facebook-auth-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get auth URL');
    }
    
    const { authUrl } = await response.json();
    return authUrl;
  }
}
