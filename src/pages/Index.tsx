
import React from 'react';
import { PostComposer } from '@/components/PostComposer';
import PostsHistory from '@/components/PostsHistory';
import PostAnalytics from '@/components/PostAnalytics';
import Header from '@/components/Header';
import { SocialMediaConnections } from '@/components/SocialMediaConnections';
import { PlatformConfigDialog } from '@/components/PlatformConfigDialog';

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <Header />
      
      {/* Social Media Connections - now prominently displayed on home page */}
      <SocialMediaConnections 
        onOpenPlatformConfig={() => {
          // This will be handled by the PlatformConfigDialog component
          const dialog = document.querySelector('[data-platform-config-trigger]') as HTMLElement;
          if (dialog) {
            dialog.click();
          }
        }}
      />
      
      {/* Hidden platform config dialog */}
      <div className="hidden">
        <div data-platform-config-trigger>
          <PlatformConfigDialog />
        </div>
      </div>
      
      <PostComposer />
      <PostsHistory />
      <PostAnalytics />
    </div>
  );
};

export default Index;
