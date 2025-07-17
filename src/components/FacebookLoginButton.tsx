import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Facebook, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { facebookSDK } from '@/services/oauth/FacebookSDK';
import { toast } from '@/hooks/use-toast';

interface FacebookLoginButtonProps {
  onStatusChange?: (status: FacebookLoginStatus) => void;
  onUserData?: (userData: FacebookUserData | null) => void;
}

export interface FacebookLoginStatus {
  status: 'connected' | 'not_authorized' | 'unknown' | 'loading';
  authResponse?: {
    accessToken: string;
    expiresIn: number;
    userID: string;
    signedRequest: string;
  };
}

export interface FacebookUserData {
  user: {
    id: string;
    name: string;
    picture?: { data?: { url: string } };
  };
  pages: Array<{
    id: string;
    name: string;
    access_token: string;
    category: string;
  }>;
}

export const FacebookLoginButton: React.FC<FacebookLoginButtonProps> = ({
  onStatusChange,
  onUserData
}) => {
  const [loginStatus, setLoginStatus] = useState<FacebookLoginStatus>({ status: 'loading' });
  const [userData, setUserData] = useState<FacebookUserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Status change callback to handle different login states
  const statusChangeCallback = async (response: any) => {
    console.log('Facebook login status changed:', response);
    
    const newStatus: FacebookLoginStatus = {
      status: response.status,
      authResponse: response.authResponse
    };
    
    setLoginStatus(newStatus);
    onStatusChange?.(newStatus);
    
    if (response.status === 'connected') {
      // User is logged into Facebook and authorized the app
      try {
        const userProfileAndPages = await facebookSDK.getUserProfileAndPages();
        
        if (userProfileAndPages) {
          const newUserData: FacebookUserData = {
            user: userProfileAndPages.user,
            pages: userProfileAndPages.pages
          };
          
          setUserData(newUserData);
          onUserData?.(newUserData);
          
          toast({
            title: "Connected to Facebook",
            description: `Logged in as ${userProfileAndPages.user.name}`,
          });
          
          // Track successful connection
          facebookSDK.trackEvent('fb_login_success', {
            user_id: userProfileAndPages.user.id,
            pages_count: userProfileAndPages.pages.length
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Connection Warning", 
          description: "Connected to Facebook but couldn't fetch user data",
          variant: "destructive"
        });
      }
    } else if (response.status === 'not_authorized') {
      // User is logged into Facebook but hasn't authorized the app
      setUserData(null);
      onUserData?.(null);
      
      toast({
        title: "Authorization Required",
        description: "Please authorize the app to continue",
        variant: "destructive"
      });
    } else {
      // User is not logged into Facebook
      setUserData(null);
      onUserData?.(null);
    }
  };

  // Check login status when the button loads
  const checkLoginState = async () => {
    try {
      setIsLoading(true);
      const response = await facebookSDK.checkLoginStatus();
      await statusChangeCallback(response);
    } catch (error) {
      console.error('Error checking Facebook login status:', error);
      setLoginStatus({ status: 'unknown' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle login button click
  const handleLogin = async () => {
    if (loginStatus.status === 'connected') {
      // User is already connected, handle logout
      await handleLogout();
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Attempting Facebook login, current status:', loginStatus.status);
      
      // Ensure SDK is initialized before proceeding
      try {
        await facebookSDK.init();
        console.log('Facebook SDK initialized successfully');
        
        if (loginStatus.status === 'not_authorized') {
          // User is logged into Facebook but not authorized - just need authorization
          console.log('User logged into Facebook but not authorized, requesting authorization...');
          const response = await facebookSDK.login();
          await statusChangeCallback(response);
        } else {
          // User needs to login to Facebook or re-authorize
          console.log('User needs to login to Facebook...');
          const response = await facebookSDK.login();
          await statusChangeCallback(response);
        }
      } catch (error: any) {
        console.error('Facebook login error:', error);
        
        let errorMessage = 'Failed to connect to Facebook';
        
        if (error.message.includes('FACEBOOK_APP_ID not found')) {
          errorMessage = 'Facebook App ID not found. Please contact the administrator.';
        } else if (error.message.includes('FB.init')) {
          errorMessage = 'Facebook SDK not ready. Please refresh the page and try again.';
        } else if (error.message.includes('cancelled')) {
          errorMessage = 'Facebook login was cancelled';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive"
        });
        
        // Track login failure
        facebookSDK.trackEvent('fb_login_error', {
          error: error.message,
          current_status: loginStatus.status
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await facebookSDK.logout();
      
      // Reset state
      setLoginStatus({ status: 'unknown' });
      setUserData(null);
      onStatusChange?.({ status: 'unknown' });
      onUserData?.(null);
      
      toast({
        title: "Logged Out",
        description: "Successfully logged out of Facebook",
      });
      
      // Track logout
      facebookSDK.trackEvent('fb_logout');
      
    } catch (error: any) {
      console.error('Facebook logout error:', error);
      toast({
        title: "Logout Error",
        description: error.message || "Failed to logout",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    checkLoginState();
  }, []);

  // Render different button states based on login status
  const renderButton = () => {
    const baseClasses = "w-full flex items-center justify-center gap-2";
    
    if (isLoading || loginStatus.status === 'loading') {
      return (
        <Button disabled className={baseClasses}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </Button>
      );
    }

    switch (loginStatus.status) {
      case 'connected':
        return (
          <div className="space-y-2">
            <Button
              variant="outline"
              className={`${baseClasses} text-green-600 border-green-200 hover:bg-green-50`}
              onClick={handleLogout}
            >
              <CheckCircle className="h-4 w-4" />
              Connected to Facebook
            </Button>
            {userData && (
              <div className="text-sm text-muted-foreground">
                <p>Logged in as: <strong>{userData.user.name}</strong></p>
                {userData.pages.length > 0 && (
                  <p>Pages: {userData.pages.length} available</p>
                )}
              </div>
            )}
          </div>
        );
        
      case 'not_authorized':
        return (
          <Button
            variant="outline"
            className={`${baseClasses} text-orange-600 border-orange-200 hover:bg-orange-50`}
            onClick={handleLogin}
          >
            <AlertCircle className="h-4 w-4" />
            Authorize App
          </Button>
        );
        
      case 'unknown':
      default:
        return (
          <Button
            className={`${baseClasses} bg-blue-600 hover:bg-blue-700 text-white`}
            onClick={handleLogin}
          >
            <Facebook className="h-4 w-4" />
            Connect Facebook
          </Button>
        );
    }
  };

  return (
    <div className="space-y-3">
      {renderButton()}
      
      {/* Status indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Status:</span>
        <Badge variant={
          loginStatus.status === 'connected' ? 'default' :
          loginStatus.status === 'not_authorized' ? 'secondary' :
          'outline'
        }>
          {loginStatus.status.replace('_', ' ')}
        </Badge>
      </div>
    </div>
  );
};