
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

  // Enhanced login using Facebook SDK with status handling
  async loginWithSDK(): Promise<{ accessToken: string; expiresAt?: number; user?: any; pages?: any[]; status: string }> {
    try {
      // First check current status
      const currentStatus = await facebookSDK.checkLoginStatus();
      
      if (currentStatus.status === 'connected') {
        // User is already connected, get their data
        const userData = await facebookSDK.getUserProfileAndPages();
        
        if (userData) {
          facebookSDK.trackEvent('fb_already_connected');
          
          return {
            accessToken: currentStatus.authResponse.accessToken,
            expiresAt: currentStatus.authResponse.expiresIn ? 
              Date.now() + (currentStatus.authResponse.expiresIn * 1000) : undefined,
            user: userData.user,
            pages: userData.pages,
            status: 'connected'
          };
        }
      }
      
      // Need to login or reauthorize
      const loginResponse = await facebookSDK.login();
      
      if (!loginResponse.authResponse) {
        throw new Error('Facebook login was cancelled or failed');
      }

      const { accessToken, expiresIn } = loginResponse.authResponse;
      
      // Get fresh user data after login
      const userData = await facebookSDK.getUserProfileAndPages();
      
      if (!userData) {
        throw new Error('Failed to fetch user data after login');
      }

      // Track login event with status
      facebookSDK.trackEvent('fb_login_completed', {
        previous_status: currentStatus.status,
        user_id: userData.user.id,
        pages_count: userData.pages.length
      });

      return {
        accessToken,
        expiresAt: expiresIn ? Date.now() + (expiresIn * 1000) : undefined,
        user: userData.user,
        pages: userData.pages,
        status: 'connected'
      };
    } catch (error) {
      console.error('Facebook SDK login error:', error);
      
      // Track login error with more context
      facebookSDK.trackEvent('fb_login_error', {
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  // Check if user is currently connected
  async checkConnectionStatus(): Promise<{ 
    isConnected: boolean; 
    status: 'connected' | 'not_authorized' | 'unknown';
    userData?: { user: any; pages: any[] };
    authResponse?: any;
  }> {
    try {
      const statusResponse = await facebookSDK.checkLoginStatus();
      
      if (statusResponse.status === 'connected') {
        const userData = await facebookSDK.getUserProfileAndPages();
        
        return {
          isConnected: true,
          status: 'connected',
          userData,
          authResponse: statusResponse.authResponse
        };
      }
      
      return {
        isConnected: false,
        status: statusResponse.status as 'not_authorized' | 'unknown'
      };
    } catch (error) {
      console.error('Error checking Facebook connection status:', error);
      return {
        isConnected: false,
        status: 'unknown'
      };
    }
  }

  // Logout and clear connection
  async logout(): Promise<void> {
    try {
      await facebookSDK.logout();
      facebookSDK.trackEvent('fb_logout_completed');
    } catch (error) {
      console.error('Facebook logout error:', error);
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
