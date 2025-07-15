
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { FarcasterQRAuth, FarcasterAuthResponse } from '@/services/oauth/FarcasterQRAuth';

interface FarcasterQRCodeProps {
  onSuccess: (userData: any) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export const FarcasterQRCode: React.FC<FarcasterQRCodeProps> = ({
  onSuccess,
  onError,
  onClose
}) => {
  const [authResponse, setAuthResponse] = useState<FarcasterAuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const farcasterAuth = new FarcasterQRAuth({
    clientId: 'c8655842-2b6b-4763-bcc2-50119d871c23',
    redirectUri: `${window.location.origin}/auth/callback/farcaster`
  });

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await farcasterAuth.initiateAuth();
      setAuthResponse(response);
      
      // Start polling for auth status
      startPolling(response.state, response.nonce);
      
    } catch (error: any) {
      console.error('Failed to initialize Farcaster auth:', error);
      setError(error.message || 'Failed to initialize authentication');
      onError(error.message || 'Failed to initialize authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (state: string, nonce: string) => {
    setIsPolling(true);
    
    const interval = setInterval(async () => {
      try {
        const statusResponse = await farcasterAuth.pollAuthStatus(state, nonce);
        
        if (statusResponse.status === 'completed') {
          clearInterval(interval);
          setPollInterval(null);
          setIsPolling(false);
          
          // Complete the authentication
          const tokenResponse = await farcasterAuth.completeAuth(state, nonce);
          
          toast({
            title: "Authentication Successful",
            description: `Connected as ${tokenResponse.user?.username || 'Farcaster user'}`,
          });
          
          onSuccess({
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresAt: tokenResponse.expires_in ? Date.now() + (tokenResponse.expires_in * 1000) : undefined,
            username: tokenResponse.user?.username,
            fid: tokenResponse.user?.fid,
            displayName: tokenResponse.user?.display_name,
            pfpUrl: tokenResponse.user?.pfp_url
          });
          
        } else if (statusResponse.status === 'expired') {
          clearInterval(interval);
          setPollInterval(null);
          setIsPolling(false);
          setError('Authentication expired. Please try again.');
          
          toast({
            title: "Authentication Expired",
            description: "The QR code has expired. Please generate a new one.",
            variant: "destructive"
          });
        }
        
      } catch (error: any) {
        console.error('Polling error:', error);
        clearInterval(interval);
        setPollInterval(null);
        setIsPolling(false);
        setError(error.message || 'Failed to check authentication status');
      }
    }, 2000); // Poll every 2 seconds
    
    setPollInterval(interval);
    
    // Auto-stop polling after 5 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setPollInterval(null);
        setIsPolling(false);
        setError('Authentication timed out. Please try again.');
      }
    }, 5 * 60 * 1000);
  };

  const handleRefresh = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    setIsPolling(false);
    initializeAuth();
  };

  const handleOpenInApp = () => {
    if (authResponse?.connect_uri) {
      // Try to open in Farcaster app
      const appUrl = authResponse.connect_uri.replace('https://warpcast.com/', 'farcaster://');
      window.location.href = appUrl;
      
      // Fallback to web URL after a short delay
      setTimeout(() => {
        window.open(authResponse.connect_uri, '_blank');
      }, 500);
    }
  };

  useEffect(() => {
    initializeAuth();
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Initializing Farcaster Authentication</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">Setting up authentication...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Authentication Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{error}</p>
          <div className="flex space-x-2">
            <Button onClick={handleRefresh} variant="outline" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-center space-x-2">
          {isPolling ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="h-5 w-5 rounded-full bg-purple-400 flex items-center justify-center text-black font-bold text-xs">F</div>
          )}
          <span>Connect to Farcaster</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {authResponse && (
          <>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(authResponse.connect_uri)}`}
                  alt="Farcaster QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your Farcaster app to connect
              </p>
              
              <Button 
                onClick={handleOpenInApp}
                variant="outline" 
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Farcaster App
              </Button>
            </div>
            
            {isPolling && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Waiting for authentication...</span>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button onClick={handleRefresh} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
