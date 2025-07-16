// Facebook SDK TypeScript definitions
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
    FACEBOOK_APP_ID?: string;
  }
}

export interface FacebookSDKService {
  init(): Promise<void>;
  login(): Promise<{ authResponse?: any; status: string }>;
  logout(): Promise<void>;
  getLoginStatus(): Promise<{ authResponse?: any; status: string }>;
  api(path: string, params?: any): Promise<any>;
  share(url: string): void;
  trackEvent(eventName: string, parameters?: any): void;
}

export class FacebookSDK implements FacebookSDKService {
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      // Set Facebook App ID globally for the SDK
      const setAppId = async () => {
        try {
          const response = await fetch('/functions/v1/get-secret', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'FACEBOOK_APP_ID' })
          });
          
          if (response.ok) {
            const { value } = await response.json();
            window.FACEBOOK_APP_ID = value;
          }
        } catch (error) {
          console.warn('Could not fetch Facebook App ID:', error);
        }
      };

      // Check if SDK is already loaded and initialized
      const checkSDKReady = () => {
        if (window.FB && window.FB.init) {
          console.log('Facebook SDK is ready');
          this.isInitialized = true;
          resolve();
          return true;
        }
        return false;
      };

      // Try immediate check first
      if (checkSDKReady()) {
        return;
      }

      setAppId();

      // Listen for the SDK ready event
      const handleSDKReady = () => {
        console.log('Facebook SDK ready event received');
        if (checkSDKReady()) {
          window.removeEventListener('fbSdkReady', handleSDKReady);
        }
      };

      window.addEventListener('fbSdkReady', handleSDKReady);

      // Polling fallback to check if SDK becomes available
      let pollCount = 0;
      const maxPolls = 50; // 5 seconds max
      
      const pollForSDK = () => {
        pollCount++;
        
        if (checkSDKReady()) {
          window.removeEventListener('fbSdkReady', handleSDKReady);
          return;
        }
        
        if (pollCount >= maxPolls) {
          console.error('Facebook SDK failed to load within timeout');
          window.removeEventListener('fbSdkReady', handleSDKReady);
          reject(new Error('Facebook SDK failed to load'));
          return;
        }
        
        setTimeout(pollForSDK, 100);
      };

      // Start polling after a small delay
      setTimeout(pollForSDK, 100);
    });

    return this.initPromise;
  }

  // Check login status automatically on page load
  async checkLoginStatus(): Promise<{ status: string; authResponse?: any }> {
    await this.init();
    
    console.log('Checking Facebook login status...');
    
    return new Promise((resolve) => {
      window.FB.getLoginStatus((response: any) => {
        console.log('Facebook login status response:', response);
        
        if (response.status === 'connected') {
          console.log('User is connected to Facebook with access token:', response.authResponse?.accessToken);
          
          // Track automatic login detection
          this.trackEvent('fb_auto_login_detected', {
            user_id: response.authResponse?.userID,
            expires_in: response.authResponse?.expiresIn
          });
        } else if (response.status === 'not_authorized') {
          console.log('User is logged into Facebook but has not authorized the app');
          
          // Track not authorized state
          this.trackEvent('fb_not_authorized');
        } else {
          console.log('User is not logged into Facebook, status:', response.status);
          
          // Track unknown status
          this.trackEvent('fb_status_unknown');
        }
        
        resolve(response);
      });
    });
  }

  // Force refresh login status (useful after login attempts)
  async refreshLoginStatus(): Promise<{ status: string; authResponse?: any }> {
    await this.init();
    
    console.log('Refreshing Facebook login status...');
    
    return new Promise((resolve) => {
      // Use true parameter to force fresh check from Facebook servers
      window.FB.getLoginStatus((response: any) => {
        console.log('Refreshed Facebook login status:', response);
        resolve(response);
      }, true);
    });
  }

  async login(): Promise<{ authResponse?: any; status: string }> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      window.FB.login((response: any) => {
        if (response.authResponse) {
          resolve(response);
        } else {
          reject(new Error('Facebook login failed'));
        }
      }, { 
        scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,publish_to_groups' 
      });
    });
  }

  async logout(): Promise<void> {
    await this.init();
    
    return new Promise((resolve) => {
      window.FB.logout(() => {
        resolve();
      });
    });
  }

  async getLoginStatus(): Promise<{ authResponse?: any; status: string }> {
    await this.init();
    
    return new Promise((resolve) => {
      window.FB.getLoginStatus((response: any) => {
        resolve(response);
      });
    });
  }

  // Enhanced method to get user profile with pages if connected
  async getUserProfileAndPages(): Promise<{ user: any; pages: any[] } | null> {
    try {
      const loginStatus = await this.getLoginStatus();
      
      if (loginStatus.status !== 'connected' || !loginStatus.authResponse) {
        return null;
      }

      console.log('Fetching user profile and pages...');

      // Get user info
      const user = await this.api('/me', { fields: 'id,name,picture' });
      
      // Get user's pages
      let pages = [];
      try {
        const pagesResponse = await this.api('/me/accounts');
        pages = pagesResponse.data || [];
        console.log('Found', pages.length, 'Facebook pages');
      } catch (error) {
        console.warn('Could not fetch user pages:', error);
      }

      return { user, pages };
    } catch (error) {
      console.error('Error fetching user profile and pages:', error);
      return null;
    }
  }

  async api(path: string, params: any = {}): Promise<any> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      window.FB.api(path, params, (response: any) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  share(url: string): void {
    if (this.isInitialized && window.FB) {
      window.FB.ui({
        method: 'share',
        href: url,
      });
    } else {
      // Fallback to native share
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }

  trackEvent(eventName: string, parameters: any = {}): void {
    if (this.isInitialized && window.FB) {
      window.FB.AppEvents.logEvent(eventName, parameters);
    }
  }
}

// Singleton instance
export const facebookSDK = new FacebookSDK();