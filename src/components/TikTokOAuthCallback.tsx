
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const TikTokOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          console.error('TikTok OAuth error:', error, errorDescription);
          toast({
            title: "TikTok Connection Failed",
            description: errorDescription || error,
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          toast({
            title: "TikTok Connection Failed",
            description: "No authorization code received from TikTok",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        console.log('Processing TikTok OAuth callback with code:', code);

        // Exchange code for access token using edge function
        const { data, error: exchangeError } = await supabase.functions.invoke('tiktok-exchange-code', {
          body: { 
            code,
            redirectUri: `${window.location.origin}/oauth/tiktok/callback`
          }
        });

        if (exchangeError) {
          console.error('Token exchange error:', exchangeError);
          throw new Error(exchangeError.message || 'Failed to exchange authorization code');
        }

        if (!data || !data.access_token) {
          console.error('Invalid token response:', data);
          throw new Error('Invalid response from token exchange');
        }

        console.log('TikTok token exchange successful');

        // Store the TikTok configuration in the database
        const { error: saveError } = await supabase.from("post_configurations").upsert({
          platform: "tiktok" as any,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          is_enabled: true,
        });

        if (saveError) {
          console.error('Error saving TikTok configuration:', saveError);
          throw new Error('Failed to save TikTok configuration');
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
        navigate('/');
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Card className="p-8 max-w-md w-full mx-4 bg-white/10 backdrop-blur-sm border-white/20">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-white" />
          <h2 className="text-xl font-semibold text-white">
            {isProcessing ? "Connecting TikTok Account..." : "Processing Complete"}
          </h2>
          <p className="text-white/80">
            {isProcessing 
              ? "Please wait while we complete the TikTok authentication process."
              : "Redirecting you back to the app..."
            }
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TikTokOAuthCallback;
