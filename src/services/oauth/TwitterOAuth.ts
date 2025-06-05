
export interface TwitterOAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export class TwitterOAuth {
  private config: TwitterOAuthConfig;
  
  constructor(config: TwitterOAuthConfig) {
    this.config = config;
  }
  
  generateAuthUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: this.generateState(),
      code_challenge: this.generateCodeChallenge(),
      code_challenge_method: 'S256'
    });
    
    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }
  
  private generateState(): string {
    return btoa(crypto.getRandomValues(new Uint8Array(32)).toString());
  }
  
  private generateCodeChallenge(): string {
    // In a real implementation, this would generate a proper PKCE challenge
    return btoa(crypto.getRandomValues(new Uint8Array(32)).toString()).slice(0, 43);
  }
  
  async exchangeCodeForToken(code: string): Promise<{ access_token: string; refresh_token?: string }> {
    // This would normally call your backend edge function to exchange the code
    const response = await fetch('/api/auth/twitter/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: this.config.redirectUri })
    });
    
    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }
    
    return response.json();
  }
}
