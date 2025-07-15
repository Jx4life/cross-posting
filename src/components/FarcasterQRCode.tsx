
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { FarcasterAuthService } from '@/services/oauth/FarcasterAuthService';
import { FarcasterSignerResponse } from '@/services/oauth/FarcasterQRAuth';

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
  const [qrCodeError, setQrCodeError] = useState(false);
  
  const farcasterService = new FarcasterAuthService();

  const initializeSigner = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setQrCodeError(false);
      
      const signerResponse = await farcasterService.createSigner();
      setSigner(signerResponse);
      
      // Start polling for signer approval
      startPolling(signerResponse.signer_uuid);
      
    } catch (error: any) {
      console.error('Failed to initialize Farcaster signer:', error);
      setError(error.message || 'Failed to initialize authentication');
      onError(error.message || 'Failed to initialize authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (signerUuid: string) => {
    setIsPolling(true);
    
    const interval = setInterval(async () => {
      try {
        const signerStatus = await farcasterService.getSigner(signerUuid);
        
        if (signerStatus.status === 'approved') {
          clearInterval(interval);
          setPollInterval(null);
          setIsPolling(false);
          
          // Get user data
          let userData = signerStatus.user;
          
          if (signerStatus.fid && !userData) {
            userData = await farcasterService.getUserByFid(signerStatus.fid);
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

  const handleQrCodeError = () => {
    console.log('QR Code image failed to load');
    setQrCodeError(true);
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
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-center">
                {!qrCodeError ? (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(signer.signer_approval_url || '')}`}
                    alt="Farcaster QR Code"
                    className="w-48 h-48"
                    onError={handleQrCodeError}
                    onLoad={() => console.log('QR code loaded successfully')}
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">QR Code unavailable</p>
                      <p className="text-xs text-gray-400">Use the button below</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {!qrCodeError 
                  ? "Scan this QR code with your Farcaster app to approve the connection"
                  : "Click the button below to open the Farcaster app and approve the connection"
                }
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
            
            {signer.signer_approval_url && (
              <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
                <p className="font-medium mb-1">Debug Info:</p>
                <p className="break-all">URL: {signer.signer_approval_url}</p>
                <p>UUID: {signer.signer_uuid}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
