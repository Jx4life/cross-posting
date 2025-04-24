
import React from 'react';
import { PostComposer } from '@/components/PostComposer';
import PostsHistory from '@/components/PostsHistory';

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <PostComposer />
      <div className="mt-8">
        <PostsHistory />
      </div>
    </div>
  );
};

export default Index;
