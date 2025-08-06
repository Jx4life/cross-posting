import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, ExternalLink, Clock } from 'lucide-react';
import { FarcasterConnect, FarcasterConnectResult } from '@/services/oauth/FarcasterConnect';

interface FarcasterConnectQRProps {
  onSuccess: (userData: any) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export const FarcasterConnectQR: React.FC<FarcasterConnectQRProps> = ({
  onSuccess,
  onError,
  onClose
}) => {
  const [connectUrl, setConnectUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [nonce, setNonce] = useState<string>('');
  const [qrCodeError, setQrCodeError] = useState(false);
  
  const farcasterConnect = new FarcasterConnect();
  
  const initializeConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setQrCodeError(false);
      setPollAttempts(0);
      
      console.log('🚀 === FARCASTER CONNECT INITIALIZATION ===');
      
      const url = await farcasterConnect.createConnectUrl();
      const connectNonce = farcasterConnect.getNonce();
      
      setConnectUrl(url);
      setNonce(connectNonce);
      
      console.log('✅ Connect URL created:', url);
      console.log('🎯 Nonce:', connectNonce);
      
      // Start polling for authentication result
      startPolling(connectNonce);
      
    } catch (error: any) {
      console.error('❌ Farcaster Connect initialization failed:', error);
      setError(error.message || 'Failed to initialize Farcaster Connect');
      onError(error.message || 'Failed to initialize Farcaster Connect');
    } finally {
      setIsLoading(false);
    }
  };
  
  const startPolling = async (pollNonce: string) => {
    setIsPolling(true);
    setPollAttempts(0);
    
    console.log('🔄 Starting Farcaster Connect polling...');
    
    try {
      const result = await farcasterConnect.pollForResult(pollNonce);
      
      console.log('🎉 Authentication successful:', result);
      
      toast({
        title: "Authentication Successful",
        description: `Connected as ${result.username}`,
      });
      
      onSuccess({
        fid: result.fid,
        username: result.username,
        displayName: result.displayName,
        pfpUrl: result.pfpUrl,
        platform: 'farcaster',
        status: 'approved'
      });
      
    } catch (error: any) {
      console.error('❌ Farcaster Connect polling failed:', error);
      setError(error.message);
      setIsPolling(false);
      
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const handleRefresh = () => {
    console.log('🔄 Refreshing Farcaster Connect...');
    initializeConnect();
  };
  
  const handleOpenConnect = () => {
    if (!connectUrl) {
      toast({
        title: "Error",
        description: "No connection URL available. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log('🚀 Opening Farcaster Connect:', connectUrl);
      const opened = window.open(connectUrl, '_blank', 'noopener,noreferrer');
      
      if (!opened) {
        window.location.href = connectUrl;
      } else {
        toast({
          title: "Opening Farcaster",
          description: "Complete the authentication in the opened window.",
        });
      }
    } catch (error) {
      console.error('❌ Error opening Farcaster Connect:', error);
      toast({
        title: "Error", 
        description: "Failed to open Farcaster Connect. Please try copying the URL manually.",
        variant: "destructive"
      });
    }
  };
  
  const handleQrCodeError = () => {
    console.log('❌ QR Code failed to load');
    setQrCodeError(true);
  };
  
  const handleQrCodeLoad = () => {
    console.log('✅ QR Code loaded successfully');
    setQrCodeError(false);
  };
  
  useEffect(() => {
    console.log('🎬 FarcasterConnectQR component mounted');
    initializeConnect();
  }, []);
  
  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Setting Up Farcaster Connect</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">Initializing secure connection...</p>
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
            <span>Connection Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
          
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
          <span>Connect with Farcaster</span>
          {isPolling && <Clock className="h-4 w-4 animate-pulse" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        
        {/* QR Code */}
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            {connectUrl && !qrCodeError ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(connectUrl)}`}
                alt="Farcaster Connect QR Code"
                className="w-48 h-48"
                onError={handleQrCodeError}
                onLoad={handleQrCodeLoad}
              />
            ) : (
              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium">Scan with your phone or</p>
            <Button 
              onClick={handleOpenConnect} 
              variant="outline" 
              className="mt-2 w-full"
              disabled={!connectUrl}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Farcaster Connect
            </Button>
          </div>
        </div>
        
        {/* Status */}
        {isPolling && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Waiting for authentication...</span>
            </div>
            <p className="text-xs text-blue-600">
              Complete the authentication in your Farcaster app
            </p>
          </div>
        )}
        
        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2">How to connect:</h4>
          <ol className="text-xs text-gray-600 space-y-1">
            <li>1. Scan the QR code with your phone's camera</li>
            <li>2. Or click "Open Farcaster Connect" above</li>
            <li>3. Sign in to authorize the connection</li>
            <li>4. Return here to complete setup</li>
          </ol>
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
        
      </CardContent>
    </Card>
  );
};