import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const TermsOfUse = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link to="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Platform
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-center mb-2">Terms of Use</h1>
      </div>

      <Card className="p-8 bg-white/5 backdrop-blur-sm border-purple-500/20">
        <div className="prose prose-lg max-w-none text-gray-300">
          <p className="text-sm text-gray-400 mb-6">
            <strong>Effective Date:</strong> January 1, 2025<br />
            <strong>Last Updated:</strong> January 1, 2025
          </p>

          <hr className="border-gray-600 my-6" />

          <h3 className="text-xl font-semibold text-white mb-4">1. Introduction</h3>
          <p className="mb-6">
            Welcome to <strong>InSync</strong> — a platform that enables users to connect multiple social media accounts and seamlessly cross-post, schedule, and analyze content across Web2 (e.g., Facebook, Instagram, X/Twitter, TikTok) and Web3 (e.g., Lens Protocol, Farcaster) platforms.
          </p>
          <p className="mb-6">
            By accessing or using InSync, you agree to be bound by these Terms of Use. If you do not agree, do not use the platform.
          </p>

          <hr className="border-gray-600 my-6" />

          <h3 className="text-xl font-semibold text-white mb-4">2. Eligibility</h3>
          <p className="mb-4">To use InSync, you must:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Be at least 13 years of age (or the legal age in your country to enter binding contracts).</li>
            <li>Have full authority to connect social accounts or wallets to InSync.</li>
            <li>Agree to comply with all platform-specific terms (e.g., Meta, Twitter, TikTok, Lens, etc.).</li>
          </ul>

          <hr className="border-gray-600 my-6" />

          <h3 className="text-xl font-semibold text-white mb-4">3. User Responsibilities</h3>
          <p className="mb-4">As a user of InSync, you agree to:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Use the platform in a lawful and respectful manner.</li>
            <li>Only connect accounts or wallets that belong to you or that you're authorized to manage.</li>
            <li>Not use InSync to post harmful, misleading, or illegal content.</li>
            <li>Maintain the security of your login credentials or wallet access.</li>
          </ul>

          <hr className="border-gray-600 my-6" />

          <h3 className="text-xl font-semibold text-white mb-4">4. Account Connection and Permissions</h3>
          <p className="mb-4">When you connect a social media account or Web3 wallet:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>You grant InSync permission to access, post, and retrieve data on your behalf via approved APIs or smart contracts.</li>
            <li>You may revoke these permissions at any time by disconnecting the account or wallet.</li>
            <li>You are responsible for ensuring you comply with each platform's individual terms of service.</li>
          </ul>

          <hr className="border-gray-600 my-6" />

          <h3 className="text-xl font-semibold text-white mb-4">5. Web3 Content and Wallet Usage</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>InSync does <strong>not store private keys</strong> and will never initiate blockchain transactions without your explicit signature.</li>
            <li>You are solely responsible for any on-chain actions taken using your wallet.</li>
            <li>Content published to decentralized protocols (e.g. Lens, Farcaster) may be <strong>permanently stored on-chain</strong> and cannot be deleted by InSync.</li>
          </ul>

          <hr className="border-gray-600 my-6" />

          <h3 className="text-xl font-semibold text-white mb-4">6. Platform Limitations</h3>
          <p className="mb-4">
            InSync is provided "as is" without warranties of any kind. While we strive for reliability, we do not guarantee:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Continuous or error-free performance</li>
            <li>Compatibility with all third-party platforms at all times</li>
            <li>Recovery of deleted or unsaved content</li>
          </ul>

          <hr className="border-gray-600 my-6" />

          <h3 className="text-xl font-semibold text-white mb-4">7. Termination</h3>
          <p className="mb-4">We reserve the right to suspend or terminate your access to InSync if:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You violate these Terms of Use</li>
            <li>You misuse connected APIs or engage in suspicious behavior</li>
            <li>Required by legal or platform policies</li>
          </ul>
          <p className="mb-6">
            You may also discontinue use and disconnect your accounts at any time.
          </p>

          <hr className="border-gray-600 my-6" />

          <h3 className="text-xl font-semibold text-white mb-4">8. Intellectual Property</h3>
          <p className="mb-4">
            All content created by users remains their property. However, you grant InSync limited rights to access and process your content only for the purpose of providing the service.
          </p>
          <p className="mb-6">
            All InSync branding, design, and technology are owned by InSync or its licensors and protected by copyright and trademark law.
          </p>

          <hr className="border-gray-600 my-6" />

          <h3 className="text-xl font-semibold text-white mb-4">9. Changes to Terms</h3>
          <p className="mb-6">
            We may update these Terms occasionally. Any significant changes will be communicated through email or app notifications. Continued use after changes means you accept the revised terms.
          </p>

          <hr className="border-gray-600 my-6" />

          <h3 className="text-xl font-semibold text-white mb-4">10. Contact Us</h3>
          <p className="mb-4">If you have any questions, please reach out to:</p>
          <p className="mb-2">
            <strong>Email:</strong> <a href="mailto:insyncreators@gmail.com" className="text-purple-400 hover:text-purple-300">insyncreators@gmail.com</a>
          </p>
          <p>
            <strong>Website:</strong> <a href="https://preview--cross-posting.lovable.app/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">https://preview--cross-posting.lovable.app/</a>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TermsOfUse;