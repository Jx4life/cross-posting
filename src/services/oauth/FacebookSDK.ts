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
    if (this.isInitialized) {
      console.log('Facebook SDK already initialized, skipping init');
      return;
    }
    if (this.initPromise) {
      console.log('Facebook SDK initialization already in progress, waiting');
      return this.initPromise;
    }

    console.log('Starting Facebook SDK initialization process');
    
    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        // First, get the Facebook App ID
        console.log('Fetching Facebook App ID from Supabase...');
        const response = await fetch('https://eppgmfcebxhjsyhosxtm.supabase.co/functions/v1/get-secret', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwcGdtZmNlYnhoanN5aG9zeHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTMwMjYsImV4cCI6MjA2MDM4OTAyNn0.WXymdCloDSNwlD4QrOoxxDyzXU4-vD6VS_RgfHErLqg'
          },
          body: JSON.stringify({ name: 'FACEBOOK_APP_ID' })
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            console.error('❌ FACEBOOK_APP_ID secret not found in Supabase!');
            console.error('Please add FACEBOOK_APP_ID to your Supabase secrets.');
            console.error('The Facebook login button will not work without this secret.');
            reject(new Error('FACEBOOK_APP_ID not found in secrets'));
          } else {
            console.error('Failed to fetch Facebook App ID:', response.status, response.statusText);
            reject(new Error('Failed to fetch Facebook App ID'));
          }
          return;
        }

        const { value: appId } = await response.json();
        console.log('Facebook App ID loaded successfully');
        window.FACEBOOK_APP_ID = appId;

        // Wait for Facebook SDK to be loaded
        const waitForFBSDK = () => {
          return new Promise<void>((resolveSDK) => {
            const checkSDK = () => {
              if (window.FB && typeof window.FB.init === 'function') {
                console.log('Facebook SDK is available, initializing with App ID:', appId);
                
                try {
                  // Initialize Facebook SDK with proper configuration
                  window.FB.init({
                    appId: appId,
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                  });
                  
                  console.log('Facebook SDK initialized successfully');
                  resolveSDK();
                } catch (error) {
                  console.error('Error initializing Facebook SDK:', error);
                  reject(error);
                }
              } else {
                // Check again in 100ms
                setTimeout(checkSDK, 100);
              }
            };
            
            checkSDK();
          });
        };

        // Wait for SDK to be available and initialize it
        await waitForFBSDK();

        // Verify SDK is working by testing getLoginStatus
        await new Promise<void>((resolveTest, rejectTest) => {
          let testTimeout = setTimeout(() => {
            rejectTest(new Error('Facebook SDK test timeout - getLoginStatus did not respond'));
          }, 5000);

          try {
            window.FB.getLoginStatus((response: any) => {
              clearTimeout(testTimeout);
              console.log('Facebook SDK test successful, status:', response.status);
              this.isInitialized = true;
              resolveTest();
            });
          } catch (error) {
            clearTimeout(testTimeout);
            console.error('Facebook SDK test failed:', error);
            rejectTest(error);
          }
        });

        resolve();
        
      } catch (error) {
        console.error('Error during Facebook SDK initialization:', error);
        reject(error);
      }
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
    console.log('🔵 FacebookSDK: Starting login...');
    await this.init();
    
    if (!window.FB) {
      console.error('🔴 FacebookSDK: FB object not available after init');
      throw new Error('Facebook SDK not loaded');
    }
    
    console.log('🔵 FacebookSDK: FB object available, calling FB.login...');
    
    return new Promise((resolve, reject) => {
      try {
        window.FB.login((response: any) => {
          console.log('🔵 FacebookSDK: FB.login response:', response);
          
          // Facebook login always returns a response, even on cancel/error
          // We should resolve with the response, not reject
          resolve(response);
        }, { 
          scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,publish_to_groups,user_posts,business_management',
          return_scopes: true,
          auth_type: 'rerequest'
        });
      } catch (error) {
        console.error('🔴 FacebookSDK: Error calling FB.login:', error);
        reject(error);
      }
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
      
      // Get user's pages with detailed permissions and access tokens
      let pages = [];
      try {
        const pagesResponse = await this.api('/me/accounts', { 
          fields: 'id,name,access_token,category,tasks,perms' 
        });
        
        if (pagesResponse.data) {
          pages = pagesResponse.data.map((page: any) => ({
            id: page.id,
            name: page.name,
            category: page.category || 'Unknown',
            access_token: page.access_token,
            tasks: page.tasks || [],
            perms: page.perms || []
          }));
          console.log('Found', pages.length, 'Facebook pages with detailed permissions');
          console.log('Pages data:', JSON.stringify(pages, null, 2));
        } else {
          console.warn('No pages data in response:', pagesResponse);
        }
      } catch (error) {
        console.warn('Could not fetch user pages:', error);
        console.error('Pages fetch error details:', error);
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