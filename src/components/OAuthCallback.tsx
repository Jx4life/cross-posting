
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { oauthManager } from '@/services/oauth/OAuthManager';
import { toast } from './ui/use-toast';

interface OAuthCallbackProps {
  platform: string;
}

export const OAuthCallback: React.FC<OAuthCallbackProps> = ({ platform }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    console.log('=== OAUTH CALLBACK COMPONENT MOUNTED ===');
    console.log('Platform:', platform);
    console.log('Current URL:', window.location.href);
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    console.log('Window parent:', window.parent);
    console.log('Window opener:', window.opener);
    
    // Check if this is a popup window
    const isPopup = window.opener && window.opener !== window;
    console.log('Is popup window:', isPopup);
    
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const state = searchParams.get('state');

        const currentDebugInfo = {
          platform,
          url: window.location.href,
          params: Object.fromEntries(searchParams.entries()),
          code: code ? `${code.substring(0, 10)}...` : null,
          error,
          errorDescription,
          state,
          isPopup,
          hasOpener: !!window.opener
        };
        
        setDebugInfo(currentDebugInfo);
        console.log('OAuth callback debug info:', currentDebugInfo);

        if (error) {
          const errorMsg = errorDescription || `Authentication failed: ${error}`;
          console.error('OAuth error from provider:', errorMsg);
          
          // If in popup, try to communicate with parent
          if (isPopup) {
            try {
              window.opener.postMessage({
                type: 'OAUTH_ERROR',
                platform,
                error: errorMsg
              }, window.location.origin);
            } catch (e) {
              console.error('Failed to post message to parent:', e);
            }
          }
          
          throw new Error(errorMsg);
        }

        if (!code) {
          const noCodeError = 'No authorization code received from the provider';
          console.error(noCodeError);
          
          // If in popup, try to communicate with parent
          if (isPopup) {
            try {
              window.opener.postMessage({
                type: 'OAUTH_ERROR',
                platform,
                error: noCodeError
              }, window.location.origin);
            } catch (e) {
              console.error('Failed to post message to parent:', e);
            }
          }
          
          throw new Error(noCodeError);
        }

        console.log(`Attempting to exchange code for ${platform} credentials...`);
        setMessage(`Exchanging authorization code for ${platform} credentials...`);
        
        // Exchange code for credentials
        const credentials = await oauthManager.handleCallback(platform, code);
        
        console.log(`${platform} credentials received:`, credentials);
        
        // Store credentials
        oauthManager.storeCredentials(platform, credentials);
        
        // Clear auth state
        oauthManager.clearAuthState(platform);

        setStatus('success');
        
        let successMessage = `Successfully connected to ${platform}!`;
        if (credentials.username) {
          successMessage += ` Welcome, ${credentials.username}!`;
        }
        if (credentials.fid) {
          successMessage += ` (FID: ${credentials.fid})`;
        }
        
        setMessage(successMessage);
        
        // If in popup, communicate success to parent and close
        if (isPopup) {
          try {
            window.opener.postMessage({
              type: 'OAUTH_SUCCESS',
              platform,
              credentials
            }, window.location.origin);
            
            // Close popup after a short delay
            setTimeout(() => {
              window.close();
            }, 1500);
          } catch (e) {
            console.error('Failed to post message to parent:', e);
          }
        } else {
          // Show toast for non-popup flow
          toast({
            title: "Connection Successful",
            description: `Your ${platform} account has been connected successfully.`,
          });

          // Redirect back to main app after a delay
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }

      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed');
        
        // If in popup, communicate error to parent
        if (isPopup) {
          try {
            window.opener.postMessage({
              type: 'OAUTH_ERROR',
              platform,
              error: error.message || 'Authentication failed'
            }, window.location.origin);
          } catch (e) {
            console.error('Failed to post message to parent:', e);
          }
        } else {
          // Show toast for non-popup flow
          toast({
            title: "Connection Failed",
            description: error.message || 'Failed to complete authentication',
            variant: "destructive"
          });
        }
        
        // Update debug info with error
        setDebugInfo(prev => ({
          ...prev,
          error: error.message,
          errorStack: error.stack
        }));
      }
    };

    handleCallback();
  }, [searchParams, platform, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            {status === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
            <span>
              {status === 'processing' && 'Connecting...'}
              {status === 'success' && 'Connected!'}
              {status === 'error' && 'Connection Failed'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {status === 'processing' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Please wait while we complete the connection...
              </p>
              <div className="text-xs text-muted-foreground">
                <p>Platform: {platform}</p>
                <p>Code: {debugInfo.code || 'Not received'}</p>
                <p>Is Popup: {debugInfo.isPopup ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {debugInfo.isPopup ? 'This window will close automatically...' : 'Redirecting you back to the app...'}
              </p>
              {!debugInfo.isPopup && (
                <Button onClick={() => navigate('/')} className="w-full">
                  Continue to App
                </Button>
              )}
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-2">
              <Button onClick={() => debugInfo.isPopup ? window.close() : navigate('/')} className="w-full">
                {debugInfo.isPopup ? 'Close Window' : 'Return to App'}
              </Button>
              <details className="text-xs text-muted-foreground">
                <summary>Debug Information</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-left overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
