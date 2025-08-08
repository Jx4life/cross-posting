import React, { useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FarcasterSIWNProps {
  onSuccess: (data: { signer_uuid: string; fid: number; user: any }) => void;
  onError: (error: string) => void;
  theme?: 'light' | 'dark';
}

declare global {
  interface Window {
    onFarcasterSignInSuccess: (data: any) => void;
  }
}

export const FarcasterSIWN: React.FC<FarcasterSIWNProps> = ({
  onSuccess,
  onError,
  theme = 'dark'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    const loadNeynarScript = async () => {
      console.log('=== LOADING NEYNAR SIWN SCRIPT ===');
      
      try {
        // Get the client ID from Supabase secrets
        const { data, error } = await supabase.functions.invoke('get-secret', {
          body: { name: 'NEYNAR_CLIENT_ID' }
        });

        if (error || !data?.value) {
          console.error('Failed to get Neynar client ID:', error);
          onError('Failed to initialize Farcaster authentication');
          return;
        }

        const clientId = data.value;
        console.log('✅ Got Neynar client ID:', clientId.substring(0, 8) + '...');

        // Set up global callback function
        window.onFarcasterSignInSuccess = (data) => {
          console.log('🎉 SIWN Success:', data);
          
          if (data.signer_uuid && data.fid) {
            onSuccess({
              signer_uuid: data.signer_uuid,
              fid: data.fid,
              user: data.user || {}
            });
          } else {
            console.error('❌ Missing required data in SIWN response:', data);
            onError('Authentication completed but missing required data');
          }
        };

        // Create the SIWN button element
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div
              class="neynar_signin"
              data-client_id="${clientId}"
              data-success-callback="onFarcasterSignInSuccess"
              data-theme="${theme}">
            </div>
          `;
        }

        // Load the Neynar script if not already loaded
        if (!scriptLoadedRef.current) {
          const existingScript = document.querySelector('script[src*="neynarxyz.github.io/siwn"]');
          if (existingScript) {
            existingScript.remove();
          }

          const script = document.createElement('script');
          script.src = 'https://neynarxyz.github.io/siwn/raw/1.2.0/index.js';
          script.async = true;
          
          script.onload = () => {
            console.log('✅ Neynar SIWN script loaded successfully');
            scriptLoadedRef.current = true;
          };
          
          script.onerror = () => {
            console.error('❌ Failed to load Neynar SIWN script');
            onError('Failed to load authentication script');
          };

          document.head.appendChild(script);
        }

      } catch (error: any) {
        console.error('❌ Error setting up SIWN:', error);
        onError(error.message || 'Failed to initialize authentication');
      }
    };

    loadNeynarScript();

    // Cleanup function
    return () => {
      if (window.onFarcasterSignInSuccess) {
        delete window.onFarcasterSignInSuccess;
      }
    };
  }, [onSuccess, onError, theme]);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Connect with Farcaster
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sign in with your Farcaster account using Neynar
        </p>
      </div>
      
      <div ref={containerRef} className="flex justify-center">
        {/* SIWN button will be injected here */}
      </div>
      
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>• Secure authentication via Neynar</p>
        <p>• No gas fees required</p>
        <p>• One-click sign in</p>
      </div>
    </div>
  );
};