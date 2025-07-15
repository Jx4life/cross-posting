
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, ExternalLink, Clock } from 'lucide-react';
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
  const [pollAttempts, setPollAttempts] = useState(0);
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  const farcasterService = new FarcasterAuthService();
  const MAX_POLL_ATTEMPTS = 150; // 5 minutes at 2-second intervals
  const INITIAL_WAIT_TIME = 30; // 30 seconds to wait for initial approval URL

  const initializeSigner = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setQrCodeError(false);
      setTimeoutReached(false);
      setPollAttempts(0);
      
      console.log('=== INITIALIZING FARCASTER SIGNER ===');
      const signerResponse = await farcasterService.createSigner();
      console.log('Signer response received:', signerResponse);
      
      setSigner(signerResponse);
      
      // Always start polling regardless of initial state
      console.log('Starting polling for signer approval');
      startPolling(signerResponse.signer_uuid);
      
    } catch (error: any) {
      console.error('Failed to initialize Farcaster signer:', error);
      
      let errorMessage = error.message || 'Failed to initialize authentication';
      
      // Provide more specific error messages
      if (error.message?.includes('API key')) {
        errorMessage = 'Invalid API key. Please check your Neynar API configuration.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (signerUuid: string) => {
    setIsPolling(true);
    setPollAttempts(0);
    
    const interval = setInterval(async () => {
      try {
        console.log(`=== POLLING SIGNER STATUS (Attempt ${pollAttempts + 1}/${MAX_POLL_ATTEMPTS}) ===`);
        const signerStatus = await farcasterService.getSigner(signerUuid);
        console.log('Polling result:', signerStatus);
        
        // Update the signer state with the latest data
        setSigner(signerStatus);
        setPollAttempts(prev => prev + 1);
        
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
        } else if (pollAttempts >= MAX_POLL_ATTEMPTS) {
          // Timeout reached
          clearInterval(interval);
          setPollInterval(null);
          setIsPolling(false);
          setTimeoutReached(true);
          setError('Authentication timed out. The approval URL may not have been generated properly.');
          
          toast({
            title: "Authentication Timeout",
            description: "The authentication process took too long. Please try again.",
            variant: "destructive"
          });
        }
        
      } catch (error: any) {
        console.error('Polling error:', error);
        setPollAttempts(prev => prev + 1);
        
        // If we've had too many consecutive errors, stop polling
        if (pollAttempts >= 5) {
          clearInterval(interval);
          setPollInterval(null);
          setIsPolling(false);
          setError('Too many errors while checking authentication status. Please try again.');
        }
      }
    }, 2000); // Poll every 2 seconds
    
    setPollInterval(interval);
  };

  const handleRefresh = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    setIsPolling(false);
    setTimeoutReached(false);
    initializeSigner();
  };

  const handleOpenInApp = () => {
    console.log('=== OPENING FARCASTER APP ===');
    console.log('Signer approval URL:', signer?.signer_approval_url);
    
    if (!signer?.signer_approval_url) {
      console.error('No signer approval URL available');
      toast({
        title: "Error",
        description: "No authentication URL available. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Try to open the URL
      const opened = window.open(signer.signer_approval_url, '_blank', 'noopener,noreferrer');
      
      if (!opened) {
        console.error('Failed to open popup window');
        // Fallback: try to navigate in the same window
        window.location.href = signer.signer_approval_url;
      } else {
        console.log('Successfully opened Farcaster app');
        toast({
          title: "Opening Farcaster App",
          description: "Complete the authentication in the opened window.",
        });
      }
    } catch (error) {
      console.error('Error opening Farcaster app:', error);
      toast({
        title: "Error",
        description: "Failed to open Farcaster app. Please try copying the URL manually.",
        variant: "destructive"
      });
    }
  };

  const handleQrCodeError = () => {
    console.log('=== QR CODE ERROR ===');
    console.log('QR Code image failed to load');
    console.log('Attempted URL:', signer?.signer_approval_url);
    setQrCodeError(true);
  };

  const handleQrCodeLoad = () => {
    console.log('=== QR CODE LOADED ===');
    console.log('QR code loaded successfully');
    setQrCodeError(false);
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
          
          {timeoutReached && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                This might be due to:
              </p>
              <ul className="text-xs text-yellow-700 mt-1 text-left">
                <li>• Neynar API is experiencing delays</li>
                <li>• API key limitations</li>
                <li>• Network connectivity issues</li>
              </ul>
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
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-center">
                {signer.signer_approval_url && !qrCodeError ? (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(signer.signer_approval_url)}`}
                    alt="Farcaster QR Code"
                    className="w-48 h-48"
                    onError={handleQrCodeError}
                    onLoad={handleQrCodeLoad}
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      {isPolling ? (
                        <>
                          <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 font-medium">
                            Generating QR Code...
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Attempt {pollAttempts}/{MAX_POLL_ATTEMPTS}
                          </p>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            QR Code unavailable
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {signer.signer_approval_url && !qrCodeError
                  ? "Scan this QR code with your Farcaster app to approve the connection"
                  : isPolling
                  ? "Waiting for Neynar to generate your authentication link..."
                  : "Authentication link could not be generated. Please try refreshing."
                }
              </p>
              
              <Button 
                onClick={handleOpenInApp}
                variant="outline" 
                className="w-full"
                disabled={!signer?.signer_approval_url}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Farcaster App
              </Button>
              
              {!signer?.signer_approval_url && isPolling && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    This usually takes 5-30 seconds. If it takes longer, there might be an issue with the Neynar API.
                  </p>
                </div>
              )}
            </div>
            
            {isPolling && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  Checking for approval URL... ({pollAttempts}/{MAX_POLL_ATTEMPTS})
                </span>
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
            
            <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <p className="font-medium mb-1">Debug Info:</p>
              <p className="break-all">URL: {signer.signer_approval_url || 'Not available yet'}</p>
              <p>UUID: {signer.signer_uuid}</p>
              <p>Status: {signer.status}</p>
              <p>Polling: {isPolling ? 'Yes' : 'No'}</p>
              <p>Attempts: {pollAttempts}/{MAX_POLL_ATTEMPTS}</p>
              <p>QR Error: {qrCodeError ? 'Yes' : 'No'}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
