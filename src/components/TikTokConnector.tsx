
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const TikTokConnector = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const currentUrl = window.location.origin;

  const handleConnectTikTok = async () => {
    setIsConnecting(true);
    try {
      console.log('Starting TikTok connection process...');
      
      // Clear any existing TikTok credentials to ensure fresh connection
      const { error: deleteError } = await supabase
        .from("post_configurations")
        .delete()
        .eq("platform", "tiktok");
      
      if (deleteError) {
        console.warn('Could not clear existing TikTok config:', deleteError);
      }
      
      const { data, error } = await supabase.functions.invoke('tiktok-auth-url', {
        body: { redirectUri: `${currentUrl}/oauth/tiktok/callback` }
      });

      if (error) {
        console.error('TikTok auth URL error:', error);
        throw new Error(error.message || 'Failed to generate TikTok authorization URL');
      }
      
      if (data?.authUrl) {
        console.log('Redirecting to TikTok auth URL:', data.authUrl);
        // Redirect in the same window to ensure proper OAuth flow
        window.location.href = data.authUrl;
      } else {
        throw new Error("Failed to generate TikTok authorization URL");
      }
    } catch (error: any) {
      console.error("TikTok connection error:", error);
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
      
      <div className="bg-blue-500/10 p-3 rounded-md text-sm mt-3">
        <p className="font-medium text-blue-400">Domain Verification Steps:</p>
        <ol className="list-decimal pl-5 mt-2 space-y-1 text-blue-300">
          <li>Your verification meta tag is already added to your website</li>
          <li>Visit the TikTok Developer Portal (button above)</li>
          <li>Go to your app's settings and verify your domain</li>
          <li>Once verified, you can connect your TikTok account</li>
        </ol>
        
        <div className="mt-3 p-2 bg-black/20 rounded-md font-mono text-xs break-all">
          <p className="text-blue-400">Verification tag (already added):</p>
          <p className="text-green-400 mt-1">&lt;meta name="tiktok-developers-site-verification" content="DdXHQR44CVq49tXdjR7GwN3eMFYaKfYN" /&gt;</p>
        </div>
        
        <div className="mt-2 text-xs text-blue-300">
          <p><strong>Your domain:</strong> {currentUrl}</p>
        </div>
      </div>
    </div>
  );
};

export default TikTokConnector;
