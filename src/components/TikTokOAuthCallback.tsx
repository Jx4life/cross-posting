
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';

export const TikTokOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { user, session } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);

  // Wait for auth state to be properly loaded
  useEffect(() => {
    const checkAuthState = async () => {
      // Give some time for auth state to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Auth state check:', { 
        user: !!user, 
        session: !!session, 
        currentSession: !!currentSession 
      });
      
      setAuthChecked(true);
    };
    
    checkAuthState();
  }, [user, session]);

  useEffect(() => {
    // Don't process callback until auth state is checked
    if (!authChecked) {
      return;
    }

    const handleCallback = async () => {
      try {
        // Capture all URL parameters for debugging
        const allParams = Object.fromEntries(searchParams.entries());
        console.log('TikTok OAuth Callback - All URL parameters:', allParams);
        setDebugInfo(allParams);

        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const state = searchParams.get('state');

        if (error) {
          console.error('TikTok OAuth error:', error, errorDescription);
          
          // Show detailed error information
          const errorMessage = errorDescription || error;
          let userFriendlyMessage = errorMessage;
          
          if (error === 'redirect_uri_mismatch') {
            userFriendlyMessage = 'Redirect URI mismatch. Please check your TikTok app settings.';
          } else if (error === 'invalid_client') {
            userFriendlyMessage = 'Invalid client credentials. Please check your TikTok app configuration.';
          } else if (error === 'access_denied') {
            userFriendlyMessage = 'Access denied. You may have cancelled the authorization.';
          }
          
          toast({
            title: "TikTok Connection Failed",
            description: `Error: ${error}. ${userFriendlyMessage}`,
            variant: "destructive"
          });
          
          return;
        }

        if (!code) {
          console.error('No authorization code received from TikTok');
          toast({
            title: "TikTok Connection Failed",
            description: "No authorization code received from TikTok",
            variant: "destructive"
          });
          return;
        }

        // Check auth state one more time before proceeding
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const currentUser = currentSession?.user || user;
        
        if (!currentUser) {
          console.error('User not authenticated after session check');
          console.log('Redirecting to auth page...');
          toast({
            title: "Authentication Required",
            description: "You must be logged in to connect TikTok. Please sign in and try again.",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        console.log('Processing TikTok OAuth callback with code:', code);
        console.log('State parameter:', state);
        console.log('User ID:', currentUser.id);

        // Use the exact same redirect URI that was used for the auth request
        const redirectUri = `${window.location.origin}/oauth/tiktok/callback`;
        
        console.log('Using redirect URI for token exchange:', redirectUri);

        // Exchange code for access token using edge function
        const { data, error: exchangeError } = await supabase.functions.invoke('tiktok-exchange-code', {
          body: { 
            code,
            redirectUri
          }
        });

        if (exchangeError) {
          console.error('Token exchange error:', exchangeError);
          toast({
            title: "TikTok Connection Failed",
            description: `Token exchange failed: ${exchangeError.message}`,
            variant: "destructive"
          });
          return;
        }

        if (!data || !data.access_token) {
          console.error('Invalid token response:', data);
          toast({
            title: "TikTok Connection Failed",
            description: "Invalid response from TikTok token exchange",
            variant: "destructive"
          });
          return;
        }

        console.log('TikTok token exchange successful');

        // Store the TikTok configuration in the database with user_id
        const { error: saveError } = await supabase.from("post_configurations").upsert({
          user_id: currentUser.id,
          platform: "tiktok" as any,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          is_enabled: true,
        });

        if (saveError) {
          console.error('Error saving TikTok configuration:', saveError);
          toast({
            title: "TikTok Connection Failed",
            description: `Failed to save TikTok configuration: ${saveError.message}`,
            variant: "destructive"
          });
          return;
        }

        console.log('TikTok configuration saved successfully');

        toast({
          title: "TikTok Connected Successfully",
          description: "Your TikTok account has been connected and is ready for posting",
        });

        navigate('/');

      } catch (error: any) {
        console.error('TikTok callback error:', error);
        toast({
          title: "TikTok Connection Failed",
          description: error.message || "An unexpected error occurred during TikTok authentication",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, user, session, authChecked]);

  const handleRetry = () => {
    navigate('/');
  };

  const hasError = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <Card className="p-8 max-w-2xl w-full mx-4 bg-white/10 backdrop-blur-sm border-white/20">
        <div className="text-center space-y-4">
          {isProcessing ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-white" />
              <h2 className="text-xl font-semibold text-white">
                {!authChecked ? "Checking authentication..." : "Connecting TikTok Account..."}
              </h2>
              <p className="text-white/80">
                {!authChecked 
                  ? "Please wait while we verify your login status." 
                  : "Please wait while we complete the TikTok authentication process."
                }
              </p>
            </>
          ) : hasError ? (
            <>
              <AlertCircle className="h-8 w-8 mx-auto text-red-400" />
              <h2 className="text-xl font-semibold text-white">
                TikTok Connection Failed
              </h2>
              <div className="text-left bg-black/20 p-4 rounded-md text-sm">
                <h3 className="text-white font-medium mb-2">Debug Information:</h3>
                <div className="space-y-2 text-white/80">
                  {Object.entries(debugInfo).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-mono text-blue-300 w-24">{key}:</span>
                      <span className="text-white break-all">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-500/20 p-4 rounded-md text-left">
                <h3 className="text-red-400 font-medium mb-2">Common Solutions:</h3>
                <ul className="text-red-300 text-sm space-y-1 list-disc pl-4">
                  <li>Verify your TikTok app redirect URI matches exactly: <code className="bg-black/30 px-1 rounded">{window.location.origin}/oauth/tiktok/callback</code></li>
                  <li>Check that your domain is verified in the TikTok Developer Portal</li>
                  <li>Ensure you're using the correct TikTok app credentials (sandbox vs production)</li>
                  <li>Make sure your TikTok app has the required scopes: user.info.basic, video.publish</li>
                </ul>
              </div>
              <Button onClick={handleRetry} className="mt-4">
                Return to Home
              </Button>
            </>
          ) : (
            <>
              <CheckCircle className="h-8 w-8 mx-auto text-green-400" />
              <h2 className="text-xl font-semibold text-white">
                TikTok Connected Successfully!
              </h2>
              <p className="text-white/80">
                Redirecting you back to the app...
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TikTokOAuthCallback;
