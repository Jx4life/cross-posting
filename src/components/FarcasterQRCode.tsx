
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, ExternalLink, Clock, Wifi, WifiOff } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState<'initializing' | 'generating' | 'waiting' | 'success' | 'error'>('initializing');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<string | null>(null);
  
  const farcasterService = new FarcasterAuthService();
  const MAX_POLL_ATTEMPTS = 150; // 5 minutes at 2-second intervals
  const INITIAL_WAIT_TIME = 30; // 30 seconds to wait for initial approval URL

  const updateProgress = (step: typeof currentStep, percentage: number) => {
    setCurrentStep(step);
    setProgressPercentage(percentage);
  };

  const calculateEstimatedTime = (attempts: number) => {
    if (attempts === 0) return null;
    
    const remainingAttempts = MAX_POLL_ATTEMPTS - attempts;
    const estimatedSeconds = remainingAttempts * 2; // 2 seconds per attempt
    
    if (estimatedSeconds < 60) {
      return `${estimatedSeconds}s`;
    } else {
      const minutes = Math.ceil(estimatedSeconds / 60);
      return `${minutes}m`;
    }
  };

  const getStepMessage = () => {
    switch (currentStep) {
      case 'initializing':
        return 'Setting up authentication...';
      case 'generating':
        return 'Generating your authentication link...';
      case 'waiting':
        return 'Waiting for you to approve the connection';
      case 'success':
        return 'Authentication successful!';
      case 'error':
        return 'Authentication failed';
      default:
        return 'Processing...';
    }
  };

  const initializeSigner = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setQrCodeError(false);
      setTimeoutReached(false);
      setPollAttempts(0);
      updateProgress('initializing', 10);
      
      console.log('=== INITIALIZING FARCASTER SIGNER ===');
      
      updateProgress('generating', 30);
      const signerResponse = await farcasterService.createSigner();
      console.log('Signer response received:', signerResponse);
      
      setSigner(signerResponse);
      updateProgress('generating', 50);
      
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
      updateProgress('error', 0);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (signerUuid: string) => {
    setIsPolling(true);
    setPollAttempts(0);
    updateProgress('waiting', 60);
    
    const interval = setInterval(async () => {
      try {
        const currentAttempt = pollAttempts + 1;
        console.log(`=== POLLING SIGNER STATUS (Attempt ${currentAttempt}/${MAX_POLL_ATTEMPTS}) ===`);
        
        const signerStatus = await farcasterService.getSigner(signerUuid);
        console.log('Polling result:', signerStatus);
        
        // Update the signer state with the latest data
        setSigner(signerStatus);
        setPollAttempts(currentAttempt);
        setEstimatedTimeLeft(calculateEstimatedTime(currentAttempt));
        
        // Update progress based on polling attempts
        const progressPercent = Math.min(60 + (currentAttempt / MAX_POLL_ATTEMPTS) * 30, 90);
        updateProgress('waiting', progressPercent);
        
        if (signerStatus.status === 'approved') {
          clearInterval(interval);
          setPollInterval(null);
          setIsPolling(false);
          updateProgress('success', 100);
          
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
          updateProgress('error', 0);
          setError('Authentication was revoked. Please try again.');
          
          toast({
            title: "Authentication Revoked",
            description: "The authentication request was revoked. Please try again.",
            variant: "destructive"
          });
        } else if (currentAttempt >= MAX_POLL_ATTEMPTS) {
          // Timeout reached
          clearInterval(interval);
          setPollInterval(null);
          setIsPolling(false);
          setTimeoutReached(true);
          updateProgress('error', 0);
          setError('Authentication timed out. The approval URL may not have been generated properly.');
          
          toast({
            title: "Authentication Timeout",
            description: "The authentication process took too long. Please try again.",
            variant: "destructive"
          });
        }
        
      } catch (error: any) {
        console.error('Polling error:', error);
        const currentAttempt = pollAttempts + 1;
        setPollAttempts(currentAttempt);
        
        // If we've had too many consecutive errors, stop polling
        if (currentAttempt >= 5) {
          clearInterval(interval);
          setPollInterval(null);
          setIsPolling(false);
          updateProgress('error', 0);
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
    setEstimatedTimeLeft(null);
    setPollAttempts(0);
    updateProgress('initializing', 0);
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
            <span>Setting Up Authentication</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">{getStepMessage()}</p>
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium mb-2">What went wrong:</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          
          {timeoutReached && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                Common causes for timeouts:
              </p>
              <ul className="text-xs text-yellow-700 text-left space-y-1">
                <li>• Neynar API experiencing delays</li>
                <li>• Network connectivity issues</li>
                <li>• API key rate limiting</li>
                <li>• Server maintenance</li>
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
          {currentStep === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : isPolling ? (
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
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            {/* Status Message */}
            <div className="flex items-center justify-center space-x-2 text-sm">
              {currentStep === 'waiting' && <Wifi className="h-4 w-4 text-blue-500" />}
              {currentStep === 'error' && <WifiOff className="h-4 w-4 text-red-500" />}
              {currentStep === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              <span className="text-muted-foreground">{getStepMessage()}</span>
            </div>
            
            {/* Estimated Time */}
            {estimatedTimeLeft && isPolling && (
              <div className="text-xs text-muted-foreground">
                Estimated time remaining: {estimatedTimeLeft}
              </div>
            )}
            
            {/* QR Code Section */}
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
                      {currentStep === 'generating' || currentStep === 'waiting' ? (
                        <>
                          <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 font-medium">
                            {currentStep === 'generating' ? 'Generating QR Code...' : 'Waiting for approval...'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Step {pollAttempts + 1} of {MAX_POLL_ATTEMPTS}
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
            
            {/* Instructions */}
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-1">How to connect:</p>
                <ol className="text-xs text-blue-700 text-left space-y-1">
                  <li>1. Open the Farcaster app on your phone</li>
                  <li>2. {signer.signer_approval_url ? 'Scan the QR code above or tap "Open in App"' : 'Wait for the QR code to load'}</li>
                  <li>3. Approve the connection in your app</li>
                  <li>4. You'll be automatically signed in</li>
                </ol>
              </div>
              
              <Button 
                onClick={handleOpenInApp}
                variant="outline" 
                className="w-full"
                disabled={!signer?.signer_approval_url}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Farcaster App
              </Button>
              
              {!signer?.signer_approval_url && currentStep === 'waiting' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    <strong>Still generating your authentication link...</strong><br />
                    This usually takes 5-30 seconds. If it takes longer, there might be an issue with the Neynar API.
                  </p>
                </div>
              )}
            </div>
            
            {/* Polling Status */}
            {isPolling && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  Checking for approval... ({pollAttempts}/{MAX_POLL_ATTEMPTS})
                </span>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button onClick={handleRefresh} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
            
            {/* Debug Info (Collapsible) */}
            <details className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <summary className="cursor-pointer font-medium mb-1">Debug Information</summary>
              <div className="space-y-1 text-left">
                <p><strong>Status:</strong> {signer.status}</p>
                <p><strong>Step:</strong> {currentStep}</p>
                <p><strong>Progress:</strong> {progressPercentage}%</p>
                <p><strong>Polling:</strong> {isPolling ? 'Yes' : 'No'}</p>
                <p><strong>Attempts:</strong> {pollAttempts}/{MAX_POLL_ATTEMPTS}</p>
                <p><strong>UUID:</strong> {signer.signer_uuid}</p>
                <p><strong>QR Error:</strong> {qrCodeError ? 'Yes' : 'No'}</p>
                <p><strong>URL:</strong> {signer.signer_approval_url || 'Not available yet'}</p>
              </div>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
};
