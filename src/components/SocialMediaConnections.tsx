import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from './ui/use-toast';
import { 
  Twitter, 
  Facebook, 
  Instagram, 
  Youtube, 
  CheckCircle, 
  AlertCircle,
  Settings,
  ExternalLink
} from 'lucide-react';
import { oauthManager } from '@/services/oauth/OAuthManager';
import { FarcasterQRCode } from './FarcasterQRCode';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionStatus {
  isConnected: boolean;
  isEnabled: boolean;
  lastConnected?: string;
  username?: string;
  fid?: number;
  displayName?: string;
  isConnecting?: boolean;
}

interface SocialMediaConnectionsProps {
  onOpenPlatformConfig?: () => void;
}

const TiktokIcon = (props: any) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" {...props}>
    <path
      d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.9 2.9 0 01.88.13V9.4a6.18 6.18 0 00-1-.08A6.26 6.26 0 002 15.58a6.26 6.26 0 009.39 5.43 6.12 6.12 0 002.27-4.8V7.83a8.24 8.24 0 005.83 2.29V6.69a4.67 4.67 0 01-.9-.08z"
      fill="currentColor"
    />
  </svg>
);

const LensIcon = (props: any) => (
  <svg viewBox="0 0 32 32" className="h-5 w-5" {...props}>
    <path 
      d="M12.9,9.9c2.1-1.3,4.9-1.3,6.9,0.1c3.1,2.2,4.1,6.2,2.4,9.8c-1.7,3.5-5.4,5.4-9.7,4.1c-1.2-0.4-2.7,0.4-3.1,1.6c-0.1,0.3-0.1,0.7,0,1.1c0.3,0.8,1.1,1.3,1.9,1.2c8.8-1.8,16.2-9.5,16.2-20c0-4.2-1.3-7.7-3.9-10.4C19.8-0.3,13.9-0.5,9.7,1.7c-4.2,2.2-6.8,6.5-6.8,11.4c0,7.3,6,13.3,13.3,13.3c0.7,0,1.3-0.6,1.3-1.3c0-0.7-0.6-1.3-1.3-1.3c-5.8,0-10.7-4.8-10.7-10.7c0-3.8,1.9-7.2,5.1-9C13.9,3,17.6,3.1,20.5,5c1.9,2,2.9,4.6,2.9,8c0,8.5-5.4,14.8-13.2,16.1c0,0-0.1,0-0.1,0c0-0.1,0-0.1-0.1-0.2C9.8,28.7,9.5,28.7,9.3,29c-0.6,0.9-0.5,2.2,0.4,2.8c0.3,0.2,0.7,0.3,1.1,0.3c1.2-0.1,2.1-1.1,2-2.3c-0.1-1.1-1-2-2.1-2.1c-0.1,0-0.3,0-0.4,0c6.1,0,11.5-3,13.8-7.7c2.3-4.7,1-10.1-3.1-13c-2.7-1.9-6.4-1.9-9.1-0.1L12.9,9.9z" 
      fill="currentColor"
    />
  </svg>
);

const FarcasterIcon = (props: any) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" {...props}>
    <path 
      d="M12,1.5c5.8,0,10.5,4.7,10.5,10.5S17.8,22.5,12,22.5S1.5,17.8,1.5,12S6.2,1.5,12,1.5z M12,4.5c-4.1,0-7.5,3.4-7.5,7.5 s3.4,7.5,7.5,7.5s7.5-3.4,7.5-7.5S16.1,4.5,12,4.5z M7.9,11.4c0.2-0.2,0.5-0.2,0.7,0l2.8,2.8l2.8-2.8c0.2-0.2,0.5-0.2,0.7,0 c0.2,0.2,0.2,0.5,0,0.7l-3.2,3.2c-0.2,0.2-0.5,0.2-0.7,0L7.9,12.1C7.7,11.9,7.7,11.6,7.9,11.4z M7.9,8.4c0.2-0.2,0.5-0.2,0.7,0 l2.8,2.8l2.8-2.8c0.2-0.2,0.5-0.2,0.7,0c0.2,0.2,0.2,0.5,0,0.7l-3.2,3.2c-0.2,0.2-0.5,0.2-0.7,0L7.9,9.1C7.7,8.9,7.7,8.6,7.9,8.4z" 
      fill="currentColor"
    />
  </svg>
);

export const SocialMediaConnections: React.FC<SocialMediaConnectionsProps> = ({
  onOpenPlatformConfig
}) => {
  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>({
    twitter: { isConnected: false, isEnabled: true },
    lens: { isConnected: false, isEnabled: true },
    farcaster: { isConnected: false, isEnabled: true },
    facebook: { isConnected: false, isEnabled: true },
    instagram: { isConnected: false, isEnabled: true },
    tiktok: { isConnected: false, isEnabled: true },
    youtubeShorts: { isConnected: false, isEnabled: true },
  });

  const [showFarcasterQR, setShowFarcasterQR] = useState(false);

  const platforms = [
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      supportsOAuth: true
    },
    {
      id: 'lens',
      name: 'Lens Protocol',
      icon: LensIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      supportsOAuth: true
    },
    {
      id: 'farcaster',
      name: 'Farcaster',
      icon: FarcasterIcon,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      supportsOAuth: true
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10',
      supportsOAuth: true
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      supportsOAuth: false
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: TiktokIcon,
      color: 'text-white',
      bgColor: 'bg-black/10',
      supportsOAuth: true
    },
    {
      id: 'youtubeShorts',
      name: 'YouTube Shorts',
      icon: Youtube,
      color: 'text-red-600',
      bgColor: 'bg-red-600/10',
      supportsOAuth: false
    }
  ];

  // Check connection status on component mount
  useEffect(() => {
    const checkConnections = async () => {
      setConnections(prev => {
        const updated = { ...prev };
        
        platforms.forEach(platform => {
          if (platform.id === 'tiktok') {
            // For TikTok, we'll check the database instead of localStorage
            checkTikTokConnection(updated);
          } else {
            const isConnected = oauthManager.isConnected(platform.id);
            
            if (isConnected && platform.id === 'lens') {
              const handle = localStorage.getItem('lensHandle');
              updated[platform.id] = {
                ...prev[platform.id],
                isConnected: true,
                username: handle || 'lens.user',
                lastConnected: new Date().toISOString()
              };
            } else if (isConnected && platform.id === 'farcaster') {
              const credentials = oauthManager.getCredentials(platform.id);
              console.log('Farcaster credentials check:', credentials);
              
              updated[platform.id] = {
                ...prev[platform.id],
                isConnected: true,
                username: credentials?.username || 'farcaster.user',
                fid: credentials?.fid,
                displayName: credentials?.displayName,
                lastConnected: new Date().toISOString()
              };
            } else if (isConnected) {
              const credentials = oauthManager.getCredentials(platform.id);
              updated[platform.id] = {
                ...prev[platform.id],
                isConnected: true,
                username: credentials?.username || 'connected.user',
                lastConnected: new Date().toISOString()
              };
            }
          }
        });
        
        return updated;
      });
    };
    
    const checkTikTokConnection = async (updated: Record<string, ConnectionStatus>) => {
      try {
        const { data, error } = await supabase
          .from('post_configurations')
          .select('*')
          .eq('platform', 'tiktok')
          .eq('is_enabled', true)
          .single();
        
        if (data && !error) {
          console.log('TikTok connection found in database:', data);
          setConnections(prev => ({
            ...prev,
            tiktok: {
              ...prev.tiktok,
              isConnected: true,
              lastConnected: data.updated_at || data.created_at,
              username: 'tiktok.user'
            }
          }));
        } else {
          console.log('No TikTok connection found or error:', error);
          setConnections(prev => ({
            ...prev,
            tiktok: {
              ...prev.tiktok,
              isConnected: false
            }
          }));
        }
      } catch (error) {
        console.error('Error checking TikTok connection:', error);
      }
    };
    
    checkConnections();
  }, []);

  // Set up message listener for popup communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message from popup:', event.data);
      
      if (event.origin !== window.location.origin) {
        console.log('Message from different origin, ignoring');
        return;
      }
      
      if (event.data.type === 'OAUTH_SUCCESS') {
        const { platform, credentials } = event.data;
        console.log(`OAuth success for ${platform}:`, credentials);
        
        setConnections(prev => ({
          ...prev,
          [platform]: {
            ...prev[platform],
            isConnected: true,
            username: credentials?.username,
            fid: credentials?.fid,
            displayName: credentials?.displayName,
            lastConnected: new Date().toISOString(),
            isConnecting: false
          }
        }));
        
        toast({
          title: "Connected Successfully",
          description: `Connected to ${platform} as ${credentials?.username || 'user'}`,
        });
      } else if (event.data.type === 'OAUTH_ERROR') {
        const { platform, error } = event.data;
        console.error(`OAuth error for ${platform}:`, error);
        
        setConnections(prev => ({
          ...prev,
          [platform]: { ...prev[platform], isConnecting: false }
        }));
        
        toast({
          title: "Connection Failed",
          description: error || `Failed to connect to ${platform}`,
          variant: "destructive"
        });
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleTikTokConnect = async () => {
    console.log('=== INITIATING TIKTOK OAUTH ===');
    
    // Set connecting state
    setConnections(prev => ({
      ...prev,
      tiktok: { ...prev.tiktok, isConnecting: true }
    }));

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
      
      // Use the exact same redirect URI format as the connector
      const currentUrl = window.location.origin;
      const redirectUri = `${currentUrl}/oauth/tiktok/callback`;
      
      console.log('Using redirect URI:', redirectUri);
      
      const { data, error } = await supabase.functions.invoke('tiktok-auth-url', {
        body: { redirectUri }
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
      setConnections(prev => ({
        ...prev,
        tiktok: { ...prev.tiktok, isConnecting: false }
      }));
    }
    // Note: Don't set isConnecting to false here as we're redirecting
  };

  const handleConnect = async (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return;
    
    // Special handling for TikTok OAuth
    if (platformId === 'tiktok') {
      await handleTikTokConnect();
      return;
    }
    
    // Set connecting state
    setConnections(prev => ({
      ...prev,
      [platformId]: { ...prev[platformId], isConnecting: true }
    }));

    try {
      if (platform.supportsOAuth) {
        if (platformId === 'twitter') {
          const authUrl = await oauthManager.initiateTwitterAuth();
          window.open(authUrl, '_blank', 'width=600,height=700');
          
          toast({
            title: "Authentication Started",
            description: "Complete the authentication in the popup window.",
          });
          
        } else if (platformId === 'facebook') {
          const authUrl = await oauthManager.initiateFacebookAuth();
          window.open(authUrl, '_blank', 'width=600,height=700');
          
          toast({
            title: "Authentication Started",
            description: "Complete the authentication in the popup window.",
          });
          
        } else if (platformId === 'farcaster') {
          console.log('=== INITIATING FARCASTER QR CONNECTION ===');
          
          // Show QR code dialog instead of popup
          setShowFarcasterQR(true);
          
          // Clear connecting state since we're showing the QR dialog
          setConnections(prev => ({
            ...prev,
            [platformId]: { ...prev[platformId], isConnecting: false }
          }));
          
        } else if (platformId === 'lens') {
          const { handle, address } = await oauthManager.initiateLensAuth();
          
          setConnections(prev => ({
            ...prev,
            [platformId]: {
              ...prev[platformId],
              isConnected: true,
              username: handle,
              lastConnected: new Date().toISOString(),
              isConnecting: false
            }
          }));
          
          toast({
            title: "Connected Successfully",
            description: `Connected to Lens Protocol as ${handle}`,
          });
          
          return; // Early return for Lens since it's handled immediately
        }
      } else {
        // Simulate connection for platforms without OAuth
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setConnections(prev => ({
          ...prev,
          [platformId]: {
            ...prev[platformId],
            isConnected: true,
            lastConnected: new Date().toISOString(),
            username: `user_${platformId}`
          }
        }));
        
        toast({
          title: "Connected Successfully",
          description: `Successfully connected to ${platform.name} (Demo)`,
        });
      }
      
    } catch (error: any) {
      console.error(`Error connecting to ${platformId}:`, error);
      
      let errorMessage = error.message || `Failed to connect to ${platform.name}`;
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      // Only clear connecting state if not using popup communication or QR dialog
      if (platformId !== 'farcaster' && platformId !== 'twitter' && platformId !== 'facebook') {
        setConnections(prev => ({
          ...prev,
          [platformId]: { ...prev[platformId], isConnecting: false }
        }));
      }
    }
  };

  const handleFarcasterQRSuccess = (userData: any) => {
    console.log('Farcaster QR authentication successful:', userData);
    
    // Store signer data instead of OAuth credentials
    oauthManager.storeFarcasterSigner(userData);
    
    // Update UI
    setConnections(prev => ({
      ...prev,
      farcaster: {
        ...prev.farcaster,
        isConnected: true,
        username: userData.username,
        fid: userData.fid,
        displayName: userData.displayName,
        lastConnected: new Date().toISOString(),
        isConnecting: false
      }
    }));
    
    setShowFarcasterQR(false);
    
    toast({
      title: "Connected Successfully",
      description: `Connected to Farcaster as ${userData.username || 'user'}`,
    });
  };

  const handleFarcasterQRError = (error: string) => {
    console.error('Farcaster QR authentication error:', error);
    
    setConnections(prev => ({
      ...prev,
      farcaster: { ...prev.farcaster, isConnecting: false }
    }));
    
    toast({
      title: "Connection Failed",
      description: error,
      variant: "destructive"
    });
  };

  const handleDisconnect = async (platformId: string) => {
    if (platformId === 'tiktok') {
      // For TikTok, also clear from database
      try {
        const { error } = await supabase
          .from("post_configurations")
          .delete()
          .eq("platform", "tiktok");
        
        if (error) {
          console.error('Error clearing TikTok config from database:', error);
        }
      } catch (error) {
        console.error('Error disconnecting TikTok:', error);
      }
    }
    
    // Clear OAuth credentials
    oauthManager.clearCredentials(platformId);
    
    if (platformId === 'lens') {
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('lensHandle');
      localStorage.removeItem('lensProfileId');
      localStorage.removeItem('walletSignature');
    }
    
    if (platformId === 'farcaster') {
      // Also clear signer data
      oauthManager.clearFarcasterSigner();
    }
    
    setConnections(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        isConnected: false,
        username: undefined,
        fid: undefined,
        displayName: undefined,
        lastConnected: undefined
      }
    }));

    toast({
      title: "Disconnected",
      description: `Disconnected from ${platforms.find(p => p.id === platformId)?.name}`,
    });
  };

  const toggleEnabled = (platformId: string) => {
    setConnections(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        isEnabled: !prev[platformId].isEnabled
      }
    }));
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Social Media Connections</CardTitle>
            <CardDescription>
              Connect your social media accounts to enable cross-posting
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onOpenPlatformConfig}>
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map((platform) => {
              const connection = connections[platform.id];
              const PlatformIcon = platform.icon;
              
              return (
                <div
                  key={platform.id}
                  className={`p-4 rounded-lg border ${platform.bgColor} transition-all hover:shadow-md`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <PlatformIcon className={`h-6 w-6 ${platform.color}`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{platform.name}</h3>
                          {platform.supportsOAuth && (
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        {connection.isConnected && (
                          <div className="text-sm text-muted-foreground">
                            {connection.username && <p>@{connection.username}</p>}
                            {connection.fid && <p>FID: {connection.fid}</p>}
                            {connection.displayName && <p>{connection.displayName}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {connection.isConnected ? (
                        <Badge variant="default" className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Not Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={connection.isEnabled}
                        onCheckedChange={() => toggleEnabled(platform.id)}
                        disabled={!connection.isConnected}
                      />
                      <span className="text-sm text-muted-foreground">
                        Enable for posting
                      </span>
                    </div>
                    
                    {connection.isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(platform.id)}
                        disabled={connection.isConnecting}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleConnect(platform.id)}
                        disabled={connection.isConnecting}
                      >
                        {connection.isConnecting ? "Connecting..." : "Connect"}
                      </Button>
                    )}
                  </div>
                  
                  {!platform.supportsOAuth && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Demo connection - OAuth integration pending
                    </p>
                  )}
                  
                  {connection.lastConnected && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last connected: {new Date(connection.lastConnected).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Farcaster QR Code Dialog */}
      <Dialog open={showFarcasterQR} onOpenChange={setShowFarcasterQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to Farcaster</DialogTitle>
          </DialogHeader>
          <FarcasterQRCode
            onSuccess={handleFarcasterQRSuccess}
            onError={handleFarcasterQRError}
            onClose={() => setShowFarcasterQR(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
