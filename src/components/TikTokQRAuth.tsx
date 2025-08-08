import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { QrCode, Smartphone, CheckCircle, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';

interface TikTokQRAuthProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const TikTokQRAuth: React.FC<TikTokQRAuthProps> = ({ onSuccess, onError }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [authUrl, setAuthUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [authState, setAuthState] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Generate TikTok OAuth URL
      const currentUrl = window.location.origin;
      const redirectUri = `${currentUrl}/oauth/tiktok/callback`;
      
      const { data, error } = await supabase.functions.invoke('tiktok-auth-url', {
        body: { redirectUri }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate TikTok auth URL');
      }

      if (!data?.authUrl) {
        throw new Error('No auth URL received');
      }

      setAuthUrl(data.authUrl);
      setAuthState(data.state);

      // Generate QR code from the auth URL
      const qrDataUrl = await QRCode.toDataURL(data.authUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrDataUrl);
      setSecondsLeft(300);
      
      toast({
        title: "QR Code Generated",
        description: "Scan the QR code with your mobile device to authenticate with TikTok",
      });

      // Start polling for authentication completion
      startPolling(data.state);
      
    } catch (error: any) {
      console.error('QR generation error:', error);
      const errorMessage = error.message || 'Failed to generate QR code';
      toast({
        title: "QR Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
      onError?.(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const startPolling = (state: string) => {
    setIsPolling(true);
    const pollInterval = setInterval(async () => {
      try {
        // Check if user has completed authentication
        const { data, error } = await supabase
          .from('post_configurations')
          .select('*')
          .eq('platform', 'tiktok')
          .eq('is_enabled', true)
          .single();

        if (data && !error) {
          setIsAuthenticated(true);
          setIsPolling(false);
          clearInterval(pollInterval);
          
          toast({
            title: "Authentication Successful!",
            description: "TikTok account connected successfully",
          });
          
          onSuccess?.();
        }
      } catch (error) {
        // Continue polling
      }
    }, 2000);

    // Stop polling after 5 minutes
    setTimeout(() => {
      setIsPolling(false);
      clearInterval(pollInterval);
      if (!isAuthenticated) {
        toast({
          title: "Authentication Timeout",
          description: "QR code expired. Please generate a new one.",
          variant: "destructive"
        });
      }
    }, 300000);
  };

  // Countdown timer
  useEffect(() => {
    if (isPolling && secondsLeft > 0) {
      const timer = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isPolling, secondsLeft]);

  const openOnMobile = () => {
    if (authUrl) {
      window.open(authUrl, '_blank');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isAuthenticated) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-green-500/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
            <h3 className="text-lg font-semibold text-white">TikTok Connected!</h3>
            <p className="text-green-400">Your TikTok account has been successfully connected.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-purple-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          TikTok QR Authentication
        </CardTitle>
        <CardDescription>
          Scan the QR code with your mobile device to connect your TikTok account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!qrCodeUrl ? (
          <div className="text-center space-y-4">
            <QrCode className="h-16 w-16 text-gray-400 mx-auto" />
            <p className="text-gray-400">Generate a QR code to start authentication</p>
            <Button 
              onClick={generateQRCode} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? "Generating QR Code..." : "Generate TikTok QR Code"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* QR Code Display */}
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg inline-block">
                <img 
                  src={qrCodeUrl} 
                  alt="TikTok Authentication QR Code" 
                  className="mx-auto"
                  width={256}
                  height={256}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                How to authenticate:
              </h4>
              <ol className="text-blue-200 text-sm space-y-1 list-decimal pl-4">
                <li>Open your mobile device camera or QR scanner</li>
                <li>Scan the QR code above</li>
                <li>You'll be redirected to TikTok's authorization page</li>
                <li>Grant permissions to connect your account</li>
                <li>The connection will be automatically detected</li>
              </ol>
            </div>

            {/* Status and Timer */}
            {isPolling && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Waiting for authentication...</span>
                  <span className="text-sm text-yellow-400">{formatTime(secondsLeft)}</span>
                </div>
                <Progress value={((300 - secondsLeft) / 300) * 100} className="w-full" />
                <p className="text-xs text-gray-500 text-center">
                  The QR code will expire in {formatTime(secondsLeft)}
                </p>
              </div>
            )}

            {/* Alternative Options */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={openOnMobile}
                className="flex-1"
                size="sm"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Open on Mobile
              </Button>
              <Button 
                variant="outline" 
                onClick={generateQRCode}
                disabled={isGenerating}
                size="sm"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};