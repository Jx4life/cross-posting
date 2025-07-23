import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { 
  Facebook, 
  CheckCircle, 
  AlertCircle, 
  User, 
  ExternalLink,
  Settings,
  Loader2,
  Building2
} from 'lucide-react';
import { FacebookLoginButton, FacebookLoginStatus, FacebookUserData } from './FacebookLoginButton';
import { FacebookPageSelector } from './FacebookPageSelector';
import { toast } from '@/hooks/use-toast';

interface FacebookConnectionCardProps {
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onStatusChange?: (isConnected: boolean) => void;
}

export const FacebookConnectionCard: React.FC<FacebookConnectionCardProps> = ({
  isEnabled,
  onToggleEnabled,
  onStatusChange
}) => {
  const [loginStatus, setLoginStatus] = useState<FacebookLoginStatus>({ status: 'loading' });
  const [userData, setUserData] = useState<FacebookUserData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);

  // Load saved Facebook target selection
  useEffect(() => {
    const savedTarget = localStorage.getItem('facebookPostTarget');
    if (savedTarget) {
      try {
        setSelectedTarget(JSON.parse(savedTarget));
      } catch (error) {
        console.error('Error parsing saved Facebook target:', error);
      }
    }
  }, []);

  const handleStatusChange = (status: FacebookLoginStatus) => {
    setLoginStatus(status);
    onStatusChange?.(status.status === 'connected');
    
    // Show page selector when first connected
    if (status.status === 'connected' && userData && !selectedTarget) {
      setShowPageSelector(true);
    }
  };

  const handleUserData = (data: FacebookUserData | null) => {
    setUserData(data);
    
    // Show page selector when user data is available and no target is selected
    if (data && loginStatus.status === 'connected' && !selectedTarget) {
      setShowPageSelector(true);
    }
  };

  const handlePageSelected = (pageData: { pageId: string; pageAccessToken: string; pageName: string } | null) => {
    // Update the selected target state
    const savedTarget = localStorage.getItem('facebookPostTarget');
    if (savedTarget) {
      setSelectedTarget(JSON.parse(savedTarget));
    }
  };

  const getStatusColor = () => {
    switch (loginStatus.status) {
      case 'connected':
        return 'text-green-600';
      case 'not_authorized':
        return 'text-orange-600';
      case 'loading':
        return 'text-gray-400';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = () => {
    switch (loginStatus.status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'not_authorized':
        return <Badge variant="secondary">Authorization Required</Badge>;
      case 'loading':
        return <Badge variant="outline">Loading...</Badge>;
      default:
        return <Badge variant="outline">Not Connected</Badge>;
    }
  };

  const getConnectionIcon = () => {
    switch (loginStatus.status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'not_authorized':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
      default:
        return <Facebook className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-blue-800/5" />
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getConnectionIcon()}
            <div>
              <CardTitle className="text-lg">Facebook</CardTitle>
              <CardDescription>
                Share posts to Facebook pages and profile
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggleEnabled}
              disabled={loginStatus.status !== 'connected'}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        {/* Facebook Login Button */}
        <FacebookLoginButton
          onStatusChange={handleStatusChange}
          onUserData={handleUserData}
        />

        {/* Connection Details */}
        {loginStatus.status === 'connected' && userData && (
          <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-green-900">Connection Details</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
            </div>
            
            {showDetails && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="font-medium">User:</span>
                  <span>{userData.user.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-green-600" />
                  <span className="font-medium">User ID:</span>
                  <span className="font-mono text-xs">{userData.user.id}</span>
                </div>
                
                {userData.pages.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ExternalLink className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Pages ({userData.pages.length}):</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {userData.pages.slice(0, 3).map((page) => (
                        <div key={page.id} className="text-xs text-green-700">
                          {page.name} ({page.category})
                        </div>
                      ))}
                      {userData.pages.length > 3 && (
                        <div className="text-xs text-green-600">
                          +{userData.pages.length - 3} more pages
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status-specific messages */}
        {loginStatus.status === 'not_authorized' && (
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-900 mb-1">Authorization Required</p>
                <p className="text-orange-700">
                  You're logged into Facebook but need to authorize this app to post on your behalf.
                </p>
              </div>
            </div>
          </div>
        )}

        {loginStatus.status === 'unknown' && (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-2">
              <Facebook className="h-4 w-4 text-gray-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gray-900 mb-1">Not Connected</p>
                <p className="text-gray-700">
                  Connect your Facebook account to start posting to your pages and profile.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings and page selection for connected state */}
        {loginStatus.status === 'connected' && (
          <div className="space-y-2">
            {/* Current posting target */}
            {selectedTarget && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-sm">
                  {selectedTarget.type === 'page' ? (
                    <>
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Posting to:</span>
                      <span>{selectedTarget.pageName}</span>
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Posting to:</span>
                      <span>Personal Timeline</span>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setShowPageSelector(true)}
              >
                <Settings className="h-4 w-4" />
                {selectedTarget ? 'Change Target' : 'Select Page'}
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View on Facebook
              </Button>
            </div>
          </div>
        )}

        {/* Page Selector Dialog */}
        <FacebookPageSelector
          isOpen={showPageSelector}
          onClose={() => setShowPageSelector(false)}
          onPageSelected={handlePageSelected}
          userData={userData}
        />
      </CardContent>
    </Card>
  );
};