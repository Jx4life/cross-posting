
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const TikTokConnector = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Get the current URL for the redirect
  const currentUrl = window.location.origin;

  const handleConnectTikTok = async () => {
    setIsConnecting(true);
    try {
      // Get the TikTok auth URL from our backend
      const { data, error } = await supabase.functions.invoke('tiktok-auth-url', {
        body: { redirectUri: `${currentUrl}/oauth/tiktok/callback` }
      });

      if (error) throw new Error(error.message);
      
      if (data?.authUrl) {
        // Redirect to TikTok for authorization
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
    } finally {
      setIsConnecting(false);
    }
  };

  const verifyDomain = async () => {
    setIsVerifying(true);
    try {
      toast({
        title: "Verification Check",
        description: "Checking TikTok domain verification status..."
      });
      
      // This would call a function to check verification status
      // In a real implementation, we'd have an edge function for this
      setTimeout(() => {
        toast({
          title: "Verification Instructions",
          description: "Please ensure your verification meta tag is correctly added to your index.html and your site is deployed with these changes."
        });
      }, 1500);
      
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
          {isVerifying ? "Checking..." : "Verify Domain Status"}
        </Button>
      </div>
      
      <div className="bg-yellow-500/10 p-3 rounded-md text-sm mt-3">
        <p className="font-medium">Domain Verification Troubleshooting:</p>
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li>Ensure your meta tag is in the <code>&lt;head&gt;</code> section of your HTML</li>
          <li>Deploy your site with the verification meta tag</li>
          <li>Wait a few minutes for TikTok's systems to detect the tag</li>
          <li>Try verification again in the TikTok Developer Portal</li>
        </ol>
        
        <div className="mt-3 p-2 bg-black/20 rounded-md font-mono text-xs break-all">
          <p>Current verification tag:</p>
          <p className="text-green-400 mt-1">&lt;meta name="tiktok-developers-site-verification" content="DdXHQR44CVq49tXdjR7GwN3eMFYaKfYN" /&gt;</p>
        </div>
      </div>
    </div>
  );
};

export default TikTokConnector;
