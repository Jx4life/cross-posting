import React from 'react';
import { TikTokDemoFlow } from '@/components/demo/TikTokDemoFlow';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TikTokDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <TikTokDemoFlow />
      </main>
      <Footer />
    </div>
  );
};

export default TikTokDemo;