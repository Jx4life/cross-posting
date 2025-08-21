
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TikTokOAuth } from "@/services/oauth/TikTokOAuth";
import { useAuth } from "@/providers/AuthProvider";
import QRCode from "qrcode";

export const TikTokConnector = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const { user } = useAuth();

  // Check connection status on component mount
  React.useEffect(() => {
    if (user) {
      checkConnectionStatus();
    }
  }, [user]);

  const checkConnectionStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("post_configurations")
        .select("is_enabled")
        .eq("user_id", user.id)
        .eq("platform", "tiktok")
        .eq("is_enabled", true)
        .single();
      
      setIsConnected(!!data && !error);
    } catch (error) {
      console.error('Error checking TikTok connection status:', error);
      setIsConnected(false);
    }
  };

  // Use localhost for development as required by TikTok
  const redirectUri = `${window.location.origin}/oauth/tiktok/callback`;

  const handleConnectTikTok = async () => {
    setIsConnecting(true);
    try {
      console.log('=== STARTING TIKTOK CONNECTION ===');
      console.log('Current URL origin:', window.location.origin);
      console.log('Redirect URI that will be used:', redirectUri);
      console.log('IMPORTANT: This EXACT URL must be in your TikTok Developer Portal');
      console.log('=== COPY THIS EXACT URL TO TIKTOK DEVELOPER PORTAL ===');
      console.log(redirectUri);
      
      // Clear any existing TikTok credentials to ensure fresh connection
      const { error: deleteError } = await supabase
        .from("post_configurations")
        .delete()
        .eq("platform", "tiktok");
      
      if (deleteError) {
        console.warn('Could not clear existing TikTok config:', deleteError);
      }
      
      const { data, error } = await supabase.functions.invoke('tiktok-auth-url', {
        body: { redirectUri }
      });

      if (error) {
        console.error('TikTok auth URL generation error:', error);
        throw new Error(error.message || 'Failed to generate TikTok authorization URL');
      }
      
      if (data?.authUrl) {
        console.log('Generated TikTok auth URL:', data.authUrl);
        console.log('=== REDIRECTING TO TIKTOK ===');
        
        // Add a small delay to ensure logs are captured
        setTimeout(() => {
          window.location.href = data.authUrl;
        }, 100);
      } else {
        throw new Error("Failed to generate TikTok authorization URL - no URL returned");
      }
    } catch (error: any) {
      console.error("=== TIKTOK CONNECTION ERROR ===", error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to TikTok",
        variant: "destructive"
      });
      setIsConnecting(false);
    }
    // Note: Don't set isConnecting to false here as we're redirecting
  };

  const handleShowQRCode = async () => {
    setIsConnecting(true);
    try {
      console.log('=== GENERATING QR CODE FOR TIKTOK ===');
      
      // Clear any existing TikTok credentials to ensure fresh connection
      const { error: deleteError } = await supabase
        .from("post_configurations")
        .delete()
        .eq("platform", "tiktok");
      
      if (deleteError) {
        console.warn('Could not clear existing TikTok config:', deleteError);
      }
      
      const { data, error } = await supabase.functions.invoke('tiktok-auth-url', {
        body: { redirectUri }
      });

      if (error) {
        console.error('TikTok auth URL generation error:', error);
        throw new Error(error.message || 'Failed to generate TikTok authorization URL');
      }
      
      if (data?.authUrl) {
        console.log('Generated TikTok auth URL for QR:', data.authUrl);
        
        // Generate QR code
        const qrDataUrl = await QRCode.toDataURL(data.authUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCodeUrl(qrDataUrl);
        setShowQRCode(true);
      } else {
        throw new Error("Failed to generate TikTok authorization URL - no URL returned");
      }
    } catch (error: any) {
      console.error("=== TIKTOK QR CODE ERROR ===", error);
      toast({
        title: "QR Code Error",
        description: error.message || "Failed to generate QR code for TikTok",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectTikTok = async () => {
    if (!user) return;
    
    setIsDisconnecting(true);
    try {
      // Note: TikTok credentials are now managed through Supabase secrets
      // No need to initialize with hardcoded credentials
      
      // Disable the connection in database
      const { error: disableError } = await supabase
        .from("post_configurations")
        .update({ is_enabled: false })
        .eq("platform", "tiktok");
      if (disableError) {
        throw new Error('Failed to disconnect TikTok account');
      }
      setIsConnected(false);
      
      toast({
        title: "TikTok Disconnected",
        description: "Your TikTok account has been successfully disconnected.",
      });
      
    } catch (error: any) {
      console.error('TikTok disconnect error:', error);
      toast({
        title: "Disconnect Error",
        description: error.message || "Failed to disconnect TikTok account",
        variant: "destructive"
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleValidateConnection = async () => {
    if (!user) return;
    
    setIsVerifying(true);
    try {
      // Validate connection by checking if user can make API calls
      const { data, error } = await supabase.functions.invoke('post-to-tiktok', {
        body: { 
          content: 'Connection test - this should not be posted',
          mediaUrl: null,
          mediaType: null
        }
      });
      
      if (!error && data?.success !== false) {
        toast({
          title: "Connection Valid",
          description: "TikTok account is connected and working properly.",
        });
        setIsConnected(true);
      } else {
        throw new Error(error?.message || data?.error || 'Connection validation failed');
      }
      
    } catch (error: any) {
      console.error('TikTok validation error:', error);
      toast({
        title: "Connection Issue",
        description: error.message || "TikTok connection validation failed. You may need to reconnect.",
        variant: "destructive"
      });
      setIsConnected(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyDomain = async () => {
    setIsVerifying(true);
    try {
      toast({
        title: "Domain Verification",
        description: "Your domain verification meta tag is already added to your website. Please verify your domain in the TikTok Developer Portal.",
      });
      
      // Open TikTok Developer Portal in new tab
      window.open('https://developers.tiktok.com/apps', '_blank');
      
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify domain",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="h-5 w-5 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs">T</div>
        <span>Connect your TikTok account to post videos</span>
        {isConnected && (
          <div className="flex items-center space-x-1 text-green-600">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-sm">Connected</span>
          </div>
        )}
      </div>
      
      {showQRCode ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center space-y-4 p-6 bg-background border rounded-lg">
            <h3 className="text-lg font-semibold">Scan QR Code with Your Mobile Device</h3>
            <img src={qrCodeUrl} alt="TikTok Login QR Code" className="border rounded-lg" />
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Open TikTok app on your mobile device and scan this QR code to authenticate
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowQRCode(false);
                setQrCodeUrl("");
              }}
              className="w-full max-w-xs"
            >
              Use Browser Login Instead
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          {!isConnected ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleConnectTikTok} 
                disabled={isConnecting}
                className="flex-1"
              >
                {isConnecting ? "Connecting..." : "Connect TikTok (Browser)"}
              </Button>
              
              <Button 
                variant="default" 
                onClick={handleShowQRCode} 
                disabled={isConnecting}
                className="flex-1"
              >
                {isConnecting ? "Generating..." : "Connect with QR Code"}
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={verifyDomain} 
                disabled={isVerifying}
                className="flex-1"
              >
                Open TikTok Developer Portal
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleValidateConnection} 
                disabled={isVerifying}
                className="flex-1"
              >
                {isVerifying ? "Validating..." : "Validate Connection"}
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={handleDisconnectTikTok} 
                disabled={isDisconnecting}
                className="flex-1"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect TikTok"}
              </Button>
            </>
          )}
        </div>
      )}
      
      <div className="bg-green-500/20 p-4 rounded-md">
        <h3 className="text-green-400 font-bold text-lg mb-3">🚀 TikTok Sandbox Ready!</h3>
        
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-green-600/20 rounded-md">
            <h4 className="text-green-300 font-semibold mb-2">✅ Ready to Test:</h4>
            <ul className="text-green-200 text-xs space-y-1">
              <li>• Sandbox credentials are pre-configured</li>
              <li>• Click "Connect TikTok" to start OAuth flow</li>
              <li>• Test video/photo uploads immediately</li>
              <li>• All API calls work with sandbox environment</li>
            </ul>
          </div>
          
          <div className="p-3 bg-blue-500/20 rounded-md">
            <h4 className="text-blue-300 font-semibold mb-2">🔧 Current Redirect URI:</h4>
            <div className="bg-black/40 p-2 rounded font-mono text-xs text-green-400 break-all">
              {redirectUri}
            </div>
            <p className="text-blue-200 text-xs mt-2">
              ⚠️ This MUST match exactly in your TikTok Developer Portal app settings
            </p>
          </div>
          
          <div className="mt-4 p-3 bg-purple-500/20 rounded-md">
            <h4 className="text-purple-300 font-semibold mb-2">✨ Features Available:</h4>
            <ul className="text-purple-200 text-xs space-y-1">
              <li>• Automatic token refresh when expired</li>
              <li>• Support for video and photo carousel posts</li>
              <li>• Connection validation and health checks</li>
              <li>• Secure credential management via Supabase</li>
              <li>• Real-time posting status updates</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-500/20 rounded-md">
          <p className="text-yellow-400 font-medium text-xs">
            🎯 <strong>Perfect for Demo:</strong> This sandbox setup allows you to record full TikTok functionality for your app review submission without needing production credentials.
          </p>
          <p className="text-yellow-300 text-xs mt-2">
            📱 <strong>CRITICAL:</strong> Your TikTok account MUST be set to PRIVATE for posting to work! Sandbox apps cannot post to public accounts.
          </p>
        </div>
        
        <div className="mt-3 p-2 bg-red-500/20 rounded-md">
          <p className="text-red-400 font-semibold text-xs mb-1">⚠️ If Posting Fails:</p>
          <ul className="text-red-300 text-xs space-y-1">
            <li>• <strong>Your TikTok account MUST be PRIVATE</strong></li>
            <li>• Go to TikTok app → Profile → Settings → Privacy → Private account</li>
            <li>• Disconnect and reconnect TikTok after making account private</li>
            <li>• Videos must be under 287MB, photos under 50MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TikTokConnector;
