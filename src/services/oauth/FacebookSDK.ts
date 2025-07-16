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

      setAppId();

      // Wait for SDK to be ready
      if (window.FB) {
        this.isInitialized = true;
        resolve();
      } else {
        window.addEventListener('fbSdkReady', () => {
          this.isInitialized = true;
          resolve();
        });

        // Timeout fallback
        setTimeout(() => {
          if (!this.isInitialized) {
            reject(new Error('Facebook SDK failed to load'));
          }
        }, 10000);
      }
    });

    return this.initPromise;
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