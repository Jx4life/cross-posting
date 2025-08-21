import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Platform
            </Button>
          </Link>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
              <p className="text-center text-muted-foreground">Last updated: January 2025</p>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none dark:prose-invert">
              <h3>1. Introduction</h3>
              <p>
                Welcome to <strong>InSync</strong>, a platform that helps you cross-post, schedule, and analyze your content across Web2 and Web3 social media platforms including but not limited to Facebook, Instagram, X (formerly Twitter), TikTok, Youtube, Lens Protocol, and Farcaster.
              </p>
              <p>
                This Privacy Policy outlines how we collect, use, store, and protect your data when you use InSync.
              </p>

              <h3>2. Platforms We Support</h3>
              <p>This Privacy Policy applies to your use of InSync in connection with the following platforms:</p>
              <ul>
                <li><strong>Web2 Platforms:</strong> Facebook, Instagram, X (Twitter), TikTok, and Youtube</li>
                <li><strong>Web3 Platforms:</strong> Lens Protocol, Farcaster</li>
              </ul>

              <h3>3. Information We Collect</h3>
              <h4>a. Information You Provide</h4>
              <p>When you connect your social media accounts to InSync, we collect:</p>
              <ul>
                <li>Basic profile information (e.g. name, username, profile image)</li>
                <li>Account or wallet address (for Web3 platforms)</li>
                <li>Email address (if applicable)</li>
                <li>Page/channel/posting permissions (with your consent)</li>
                <li>Content you choose to post or schedule</li>
              </ul>

              <h4>b. Automatically Collected Data</h4>
              <p>We may also collect:</p>
              <ul>
                <li>Device type and browser info</li>
                <li>IP address</li>
                <li>Usage data and session information</li>
                <li>Posting behavior across connected platforms</li>
              </ul>

              <h3>4. How We Use Your Information</h3>
              <p>We use your information to:</p>
              <ul>
                <li>Authenticate and securely connect your accounts</li>
                <li>Cross-post or schedule your content as directed</li>
                <li>Provide engagement analytics and insights</li>
                <li>Offer platform-specific recommendations and features</li>
                <li>Respond to inquiries and support requests</li>
                <li>Improve our platform performance and UX</li>
              </ul>

              <h3>5. Platform-Specific Permissions and Data</h3>
              <p>We adhere to the specific <strong>API guidelines</strong> and <strong>terms of service</strong> of each platform:</p>
              <ul>
                <li>For <strong>Facebook & Instagram</strong>, we only access the permissions you explicitly grant (e.g., <code>pages_manage_posts</code>, <code>instagram_basic</code>).</li>
                <li>For <strong>X (Twitter)</strong> and <strong>TikTok</strong>, we access posting and analytics functions where APIs allow.</li>
                <li>For <strong>Web3 protocols</strong> like <strong>Lens</strong> and <strong>Farcaster</strong>, your public wallet address and permissioned interactions (via signatures or smart contracts) may be used to publish posts or retrieve analytics.</li>
              </ul>
              <p>We do <strong>not access private keys</strong> or perform any transaction on your behalf without explicit permission.</p>

              <h3>6. Data Storage and Retention</h3>
              <p>
                We store your data only as long as necessary to operate the service effectively. Content and account data are stored securely using encrypted storage and industry best practices. You can revoke access or request deletion at any time.
              </p>

              <h3>7. Sharing of Information</h3>
              <p>We <strong>do not sell or rent</strong> your data. We may share minimal data with:</p>
              <ul>
                <li>Partner services or tools required to operate the app (e.g., API services)</li>
                <li>Legal authorities if required by law</li>
                <li>Web3 protocols, via signature or smart contract interaction, when you choose to post</li>
              </ul>

              <h3>8. Your Rights and Choices</h3>
              <p>You have the right to:</p>
              <ul>
                <li>Access and review your personal data</li>
                <li>Request correction or deletion of your data</li>
                <li>Revoke access to any connected platform</li>
                <li>Disconnect wallets (for Web3 platforms)</li>
              </ul>
              <p>To manage these settings, visit your <strong>InSync dashboard</strong> or contact us.</p>

              <h3>9. Data Deletion</h3>
              <p>You may delete your data by:</p>
              <ul>
                <li>Disconnecting your connected accounts/wallets</li>
                <li>Visiting: <a href="https://www.notion.so/Data-Deletion-Instructions-22411682d63980b6a021cdf54684b1fa?pvs=21" target="_blank" rel="noopener noreferrer">Data Deletion Instructions</a></li>
                <li>Emailing us at: <strong>insyncreators@gmail.com</strong></li>
              </ul>
              <p>
                Upon request, we will remove your account data and associated content from our systems within a reasonable timeframe.
              </p>

              <h3>10. Children's Privacy</h3>
              <p>
                InSync is not intended for individuals under the age of 13. We do not knowingly collect data from children.
              </p>

              <h3>11. Changes to This Policy</h3>
              <p>
                We may update this Privacy Policy occasionally. If we make significant changes, we will notify you via email or app notification.
              </p>

              <h3>12. Contact Us</h3>
              <p>If you have any questions about this Privacy Policy or your data, please contact:</p>
              <p>
                <strong>Email:</strong> <strong>insyncreators@gmail.com</strong><br />
                <strong>Website:</strong> <a href="https://insyncapp.xyz" target="_blank" rel="noopener noreferrer">Insyncapp.xyz</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;