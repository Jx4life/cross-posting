
import React from 'react';
import { PostComposer } from '@/components/PostComposer';
import PostsHistory from '@/components/PostsHistory';
import PostAnalytics from '@/components/PostAnalytics';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SocialMediaConnections } from '@/components/SocialMediaConnections';
import { PlatformConfigDialog } from '@/components/PlatformConfigDialog';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();
  
  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <Header />
        
        <Card className="w-full max-w-md mx-auto p-6 bg-white/5 backdrop-blur-sm border-purple-500/20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Welcome Back!</h2>
            <p className="text-gray-400">Sign in to your account to start posting to social media platforms</p>
            <Link to="/auth">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Sign In to Your Account
              </Button>
            </Link>
          </div>
        </Card>
        <Footer />
      </div>
    );
  }
  
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
      <Footer />
    </div>
  );
};

export default Index;
