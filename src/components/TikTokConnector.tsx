
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const TikTokConnector = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Use the exact current URL for redirect URI to ensure it matches TikTok app settings
  const currentUrl = window.location.origin;
  const redirectUri = `${currentUrl}/oauth/tiktok/callback`;

  const handleConnectTikTok = async () => {
    setIsConnecting(true);
    try {
      console.log('=== STARTING TIKTOK CONNECTION ===');
      console.log('Current URL:', currentUrl);
      console.log('Redirect URI:', redirectUri);
      
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
      </div>
      
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <Button 
          variant="outline" 
          onClick={handleConnectTikTok} 
          disabled={isConnecting}
          className="flex-1"
        >
          {isConnecting ? "Connecting..." : "Connect TikTok"}
        </Button>
        
        <Button 
          variant="secondary" 
          onClick={verifyDomain} 
          disabled={isVerifying}
          className="flex-1"
        >
          Open TikTok Developer Portal
        </Button>
      </div>
      
      <div className="bg-red-500/20 p-4 rounded-md">
        <h3 className="text-red-400 font-bold text-lg mb-3">🚨 CRITICAL: TikTok App Setup Required!</h3>
        
        <div className="bg-red-600/30 p-3 rounded-md mb-4">
          <p className="text-red-300 font-semibold mb-2">❌ Your TikTok app is missing this redirect URI:</p>
          <div className="bg-black/40 p-3 rounded font-mono text-sm text-green-400 break-all">
            {redirectUri}
          </div>
        </div>
        
        <div className="space-y-3 text-sm">
          <h4 className="text-red-300 font-semibold">📋 REQUIRED STEPS TO FIX:</h4>
          <ol className="list-decimal pl-5 space-y-2 text-red-200">
            <li>
              <strong>Visit TikTok Developer Portal:</strong>
              <br />
              <a 
                href="https://developers.tiktok.com/apps" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-300 underline hover:text-blue-200"
              >
                https://developers.tiktok.com/apps
              </a>
            </li>
            <li>
              <strong>Find your app with Client ID:</strong> sbawjmn8p4yrizyuis
            </li>
            <li>
              <strong>Go to:</strong> Login Kit → Settings → Redirect domain
            </li>
            <li>
              <strong>Add this EXACT redirect URI:</strong>
              <div className="bg-black/40 p-2 rounded font-mono text-xs text-green-400 mt-1 break-all">
                {redirectUri}
              </div>
            </li>
            <li>
              <strong>Verify your domain</strong> using the meta tag (already added to your site)
            </li>
            <li>
              <strong>Save settings</strong> and wait a few minutes for changes to propagate
            </li>
            <li>
              <strong>Return here and try "Connect TikTok" again</strong>
            </li>
          </ol>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-500/20 rounded-md">
          <p className="text-yellow-400 font-medium text-xs">
            💡 <strong>Important:</strong> The redirect URI must match EXACTLY. Even a small difference (like missing 'https://' or extra characters) will cause this error.
          </p>
        </div>
        
        <div className="mt-3 p-2 bg-black/20 rounded-md font-mono text-xs">
          <p className="text-blue-400">Domain verification meta tag (already added):</p>
          <p className="text-green-400 mt-1 break-all">&lt;meta name="tiktok-developers-site-verification" content="DdXHQR44CVq49tXdjR7GwN3eMFYaKfYN" /&gt;</p>
        </div>
      </div>
    </div>
  );
};

export default TikTokConnector;
