import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { facebookSDK } from '@/services/oauth/FacebookSDK';

interface FacebookShareButtonProps {
  url: string;
  text?: string;
  className?: string;
}

export const FacebookShareButton: React.FC<FacebookShareButtonProps> = ({ 
  url, 
  text = "Share on Facebook",
  className = ""
}) => {
  const handleShare = () => {
    facebookSDK.share(url);
    
    // Track share event
    facebookSDK.trackEvent('fb_share', {
      content_type: 'url',
      content_url: url
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={`flex items-center gap-2 ${className}`}
    >
      <Share2 className="h-4 w-4" />
      {text}
    </Button>
  );
};

export default FacebookShareButton;