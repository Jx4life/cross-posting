
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
