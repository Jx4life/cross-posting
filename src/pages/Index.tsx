
import React from 'react';
import { PostComposer } from '@/components/PostComposer';
import PostsHistory from '@/components/PostsHistory';
import PostAnalytics from '@/components/PostAnalytics';
import Header from '@/components/Header';
import { SocialMediaConnections } from '@/components/SocialMediaConnections';

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <Header />
      <PostComposer />
      <SocialMediaConnections />
      <PostsHistory />
      <PostAnalytics />
    </div>
  );
};

export default Index;
