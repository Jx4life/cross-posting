
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

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || `Authentication failed: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange code for credentials
        const credentials = await oauthManager.handleCallback(platform, code);
        
        // Store credentials
        oauthManager.storeCredentials(platform, credentials);
        
        // Clear auth state
        oauthManager.clearAuthState(platform);

        setStatus('success');
        setMessage(`Successfully connected to ${platform}!`);
        
        toast({
          title: "Connection Successful",
          description: `Your ${platform} account has been connected successfully.`,
        });

        // Redirect back to main app after a delay
        setTimeout(() => {
          navigate('/');
        }, 2000);

      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed');
        
        toast({
          title: "Connection Failed",
          description: error.message || 'Failed to complete authentication',
          variant: "destructive"
        });
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
          
          {status === 'success' && (
            <p className="text-sm text-muted-foreground">
              Redirecting you back to the app...
            </p>
          )}
          
          {status === 'error' && (
            <Button onClick={() => navigate('/')} className="w-full">
              Return to App
            </Button>
          )}
          
          {status === 'processing' && (
            <p className="text-sm text-muted-foreground">
              Please wait while we complete the connection...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
