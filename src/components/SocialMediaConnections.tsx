
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { toast } from './ui/use-toast';
import { 
  Twitter, 
  Facebook, 
  Instagram, 
  Youtube, 
  CheckCircle, 
  AlertCircle,
  Settings
} from 'lucide-react';

interface ConnectionStatus {
  isConnected: boolean;
  isEnabled: boolean;
  lastConnected?: string;
  username?: string;
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
  // Mock connection states - in a real app, this would come from an API/database
  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>({
    twitter: { isConnected: false, isEnabled: true },
    lens: { isConnected: false, isEnabled: true },
    farcaster: { isConnected: false, isEnabled: true },
    facebook: { isConnected: false, isEnabled: true },
    instagram: { isConnected: false, isEnabled: true },
    tiktok: { isConnected: false, isEnabled: true },
    youtubeShorts: { isConnected: false, isEnabled: true },
  });

  const platforms = [
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 'lens',
      name: 'Lens Protocol',
      icon: LensIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      id: 'farcaster',
      name: 'Farcaster',
      icon: FarcasterIcon,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: TiktokIcon,
      color: 'text-white',
      bgColor: 'bg-black/10'
    },
    {
      id: 'youtubeShorts',
      name: 'YouTube Shorts',
      icon: Youtube,
      color: 'text-red-600',
      bgColor: 'bg-red-600/10'
    }
  ];

  const handleConnect = async (platformId: string) => {
    try {
      toast({
        title: "Connecting...",
        description: `Connecting to ${platforms.find(p => p.id === platformId)?.name}`,
      });

      // Simulate connection process
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
        description: `Successfully connected to ${platforms.find(p => p.id === platformId)?.name}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${platforms.find(p => p.id === platformId)?.name}`,
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = (platformId: string) => {
    setConnections(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        isConnected: false,
        username: undefined,
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
                      <h3 className="font-medium">{platform.name}</h3>
                      {connection.isConnected && connection.username && (
                        <p className="text-sm text-muted-foreground">
                          @{connection.username}
                        </p>
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
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleConnect(platform.id)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
                
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
  );
};
