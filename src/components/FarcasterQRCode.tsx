
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { FarcasterQRAuth, FarcasterSignerResponse } from '@/services/oauth/FarcasterQRAuth';

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
  const [signer, setSigner] = useState<FarcasterSignerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [showApiKeyError, setShowApiKeyError] = useState(false);

  // This should be configured through environment variables or user settings
  const NEYNAR_API_KEY = 'NEYNAR_API_KEY'; // This needs to be set by the user
  
  const farcasterAuth = new FarcasterQRAuth({
    clientId: 'c8655842-2b6b-4763-bcc2-50119d871c23',
    redirectUri: `${window.location.origin}/auth/callback/farcaster`,
    apiKey: NEYNAR_API_KEY
  });

  const initializeSigner = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setShowApiKeyError(false);
      
      const signerResponse = await farcasterAuth.createSigner();
      setSigner(signerResponse);
      
      // Start polling for signer approval
      startPolling(signerResponse.signer_uuid);
      
    } catch (error: any) {
      console.error('Failed to initialize Farcaster signer:', error);
      
      if (error.message.includes('401') || error.message.includes('API')) {
        setShowApiKeyError(true);
        setError('Invalid API key. Please configure your Neynar API key.');
      } else {
        setError(error.message || 'Failed to initialize authentication');
      }
      
      onError(error.message || 'Failed to initialize authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (signerUuid: string) => {
    setIsPolling(true);
    
    const interval = setInterval(async () => {
      try {
        const signerStatus = await farcasterAuth.getSigner(signerUuid);
        
        if (signerStatus.status === 'approved') {
          clearInterval(interval);
          setPollInterval(null);
          setIsPolling(false);
          
          // Get user data
          let userData = signerStatus.user;
          
          if (signerStatus.fid && !userData) {
            userData = await farcasterAuth.getUserByFid(signerStatus.fid);
          }
          
          toast({
            title: "Authentication Successful",
            description: `Connected as ${userData?.username || 'Farcaster user'}`,
          });
          
          onSuccess({
            signer_uuid: signerStatus.signer_uuid,
            public_key: signerStatus.public_key,
            fid: signerStatus.fid,
            username: userData?.username,
            displayName: userData?.display_name,
            pfpUrl: userData?.pfp_url,
            status: 'approved'
          });
          
        } else if (signerStatus.status === 'revoked') {
          clearInterval(interval);
          setPollInterval(null);
          setIsPolling(false);
          setError('Authentication was revoked. Please try again.');
          
          toast({
            title: "Authentication Revoked",
            description: "The authentication request was revoked. Please try again.",
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
    
    // Auto-stop polling after 10 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setPollInterval(null);
        setIsPolling(false);
        setError('Authentication timed out. Please try again.');
      }
    }, 10 * 60 * 1000);
  };

  const handleRefresh = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    setIsPolling(false);
    initializeSigner();
  };

  const handleOpenInApp = () => {
    if (signer?.signer_approval_url) {
      window.open(signer.signer_approval_url, '_blank');
    }
  };

  useEffect(() => {
    initializeSigner();
    
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
          <p className="text-muted-foreground">Setting up signer...</p>
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
          
          {showApiKeyError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                You need to configure your Neynar API key to use Farcaster authentication.
                <br />
                <a 
                  href="https://dev.neynar.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Get your API key from Neynar
                </a>
              </p>
            </div>
          )}
          
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
        {signer && (
          <>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(signer.signer_approval_url || '')}`}
                  alt="Farcaster QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your Farcaster app to approve the connection
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
                <span>Waiting for approval...</span>
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
