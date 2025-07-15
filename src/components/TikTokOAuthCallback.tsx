
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TikTokOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      
      // Handle errors from TikTok
      if (error) {
        setStatus("error");
        setErrorMessage(errorDescription || "Authorization failed");
        toast({
          title: "TikTok Authorization Failed",
          description: errorDescription || "Failed to connect TikTok account",
          variant: "destructive"
        });
        setTimeout(() => navigate("/"), 5000);
        return;
      }
      
      // No code, cannot proceed
      if (!code) {
        setStatus("error");
        setErrorMessage("No authorization code received from TikTok");
        toast({
          title: "Authorization Error",
          description: "No authorization code received from TikTok",
          variant: "destructive"
        });
        setTimeout(() => navigate("/"), 5000);
        return;
      }
      
      try {
        // Exchange code for token using our backend
        const { data, error } = await supabase.functions.invoke('tiktok-exchange-code', {
          body: { 
            code,
            redirectUri: `${window.location.origin}/oauth/tiktok/callback`
          }
        });
        
        if (error) throw new Error(error.message);
        
        if (data?.success) {
          setStatus("success");
          toast({
            title: "TikTok Connected",
            description: "Your TikTok account has been successfully connected!",
          });
          
          // Store the TikTok configuration in the database
          const { error: saveError } = await supabase.from("post_configurations").upsert({
            platform: "tiktok" as any, // Type assertion to handle the enum update
            access_token: data.accessToken,
            refresh_token: data.refreshToken,
            is_enabled: true,
            user_id: (await supabase.auth.getUser()).data.user?.id
          });
          
          if (saveError) throw new Error(saveError.message);
          
          // Redirect back to main page after success
          setTimeout(() => navigate("/"), 3000);
        } else {
          throw new Error(data?.error || "Failed to exchange authorization code");
        }
        
      } catch (error: any) {
        console.error("TikTok token exchange error:", error);
        setStatus("error");
        setErrorMessage(error.message || "Failed to complete TikTok authentication");
        toast({
          title: "Authentication Error",
          description: error.message || "Failed to complete TikTok authentication",
          variant: "destructive"
        });
        setTimeout(() => navigate("/"), 5000);
      }
    };
    
    handleCallback();
  }, [searchParams, navigate]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg text-card-foreground">
        <div className="text-center">
          {status === "loading" && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Connecting TikTok</h2>
              <p className="text-muted-foreground">Please wait while we complete your TikTok authorization...</p>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="h-12 w-12 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-green-500">Connected Successfully!</h2>
              <p className="text-muted-foreground">Your TikTok account has been connected successfully.</p>
              <p className="mt-4 text-sm text-muted-foreground">Redirecting you back...</p>
            </>
          )}
          
          {status === "error" && (
            <>
              <div className="h-12 w-12 rounded-full bg-red-500 text-white flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-red-500">Connection Failed</h2>
              <p className="text-muted-foreground">{errorMessage || "There was an error connecting your TikTok account."}</p>
              <p className="mt-4 text-sm text-muted-foreground">Redirecting you back...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TikTokOAuthCallback;
