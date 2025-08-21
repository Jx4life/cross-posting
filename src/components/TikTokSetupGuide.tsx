import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, ExternalLink, AlertTriangle, Copy } from 'lucide-react';
import { toast } from './ui/use-toast';

export const TikTokSetupGuide = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const redirectUri = `https://insyncapp.xyz/oauth/tiktok/callback`;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const steps = [
    {
      title: "Create TikTok Developer Account",
      description: "Sign up for TikTok for Developers",
      content: (
        <div className="space-y-4">
          <p>First, you need to create a TikTok Developer account if you don't have one:</p>
          <Button 
            variant="outline" 
            onClick={() => window.open('https://developers.tiktok.com/', '_blank')}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Visit TikTok Developers Portal
          </Button>
          <p className="text-sm text-muted-foreground">
            Sign up with your TikTok account and complete the developer verification process.
          </p>
        </div>
      )
    },
    {
      title: "Create New App",
      description: "Set up your TikTok application",
      content: (
        <div className="space-y-4">
          <p>Create a new application in the TikTok Developer Portal:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to the <strong>Apps</strong> section</li>
            <li>Click <strong>"Create an App"</strong></li>
            <li>Fill in your app details:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li><strong>App Name:</strong> Your Social Media Manager</li>
                <li><strong>Description:</strong> Social media content management platform</li>
                <li><strong>Category:</strong> Social Media</li>
              </ul>
            </li>
            <li>Submit for review and wait for approval</li>
          </ol>
        </div>
      )
    },
    {
      title: "Configure OAuth Settings",
      description: "Set up Login Kit and redirect URI",
      content: (
        <div className="space-y-4">
          <p>Configure your app's OAuth settings:</p>
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li>In your app dashboard, go to <strong>Login Kit</strong></li>
            <li>Click <strong>"Add products"</strong> and enable Login Kit</li>
            <li>Go to <strong>Login Kit → Settings</strong></li>
            <li>Add this redirect URI:
              <div className="bg-muted p-3 rounded-md font-mono text-sm mt-2 flex items-center justify-between">
                <span className="break-all">{redirectUri}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(redirectUri)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </li>
            <li>Set required scopes:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li><code>user.info.basic</code></li>
                <li><code>video.publish</code></li>
              </ul>
            </li>
          </ol>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The redirect URI must match EXACTLY - including the protocol (https://) and no trailing slash.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      title: "Domain Verification",
      description: "Verify your domain with TikTok",
      content: (
        <div className="space-y-4">
          <p>Verify your domain to enable OAuth:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>In your app settings, go to <strong>Domain Verification</strong></li>
            <li>Add your domain: <code>{window.location.hostname}</code></li>
            <li>The verification meta tag is already added to your site:
              <div className="bg-muted p-3 rounded-md font-mono text-xs mt-2">
                &lt;meta name="tiktok-developers-site-verification" content="DdXHQR44CVq49tXdjR7GwN3eMFYaKfYN" /&gt;
              </div>
            </li>
            <li>Click <strong>"Verify"</strong> in the TikTok Developer Portal</li>
          </ol>
        </div>
      )
    },
    {
      title: "Get App Credentials",
      description: "Copy your Client ID and Client Secret",
      content: (
        <div className="space-y-4">
          <p>Get your app credentials from the developer portal:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to your app dashboard</li>
            <li>Find the <strong>Client Key</strong> (this is your Client ID)</li>
            <li>Find the <strong>Client Secret</strong></li>
            <li>Copy both values - you'll need them for the next step</li>
          </ol>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Keep your Client Secret secure and never share it publicly. It will be stored securely in your Supabase project.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      title: "Configure Credentials",
      description: "Add your TikTok credentials to the system",
      content: (
        <div className="space-y-4">
          <p>The TikTok credentials are already configured in your Supabase secrets. If you need to update them:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to your Supabase project dashboard</li>
            <li>Navigate to <strong>Settings → Edge Functions</strong></li>
            <li>Update these secrets:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li><code>TIKTOK_CLIENT_ID</code> - Your TikTok Client Key</li>
                <li><code>TIKTOK_CLIENT_SECRET</code> - Your TikTok Client Secret</li>
              </ul>
            </li>
          </ol>
          
          <Button 
            variant="outline" 
            onClick={() => window.open('https://supabase.com/dashboard/project/eppgmfcebxhjsyhosxtm/settings/functions', '_blank')}
            className="w-full mt-3"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Supabase Edge Functions Settings
          </Button>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep - 1];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            TikTok Integration Setup Guide
            <span className="text-sm font-normal text-muted-foreground">
              Step {currentStep} of {steps.length}
            </span>
          </CardTitle>
          <CardDescription>
            Follow these steps to connect your TikTok account for content posting
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress indicator */}
          <div className="flex items-center mb-6">
            {steps.map((_, index) => (
              <React.Fragment key={index}>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index + 1 < currentStep 
                      ? 'bg-green-500 text-white' 
                      : index + 1 === currentStep 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1 < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`flex-1 h-1 mx-2 ${
                      index + 1 < currentStep ? 'bg-green-500' : 'bg-muted'
                    }`} 
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Current step content */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">{currentStepData.title}</h3>
              <p className="text-muted-foreground mb-4">{currentStepData.description}</p>
              {currentStepData.content}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              <Button 
                onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                disabled={currentStep === steps.length}
              >
                {currentStep === steps.length ? 'Complete' : 'Next'}
              </Button>
            </div>

            {currentStep === steps.length && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Setup complete! You can now try connecting your TikTok account. Make sure your TikTok app is approved and all settings are saved.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TikTokSetupGuide;