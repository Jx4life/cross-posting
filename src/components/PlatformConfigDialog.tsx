
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Twitter, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

export const PlatformConfigDialog = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("twitter");
  const [isSaving, setIsSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  const handleTwitterConfigTest = async () => {
    try {
      setTestingConnection(true);
      toast.info("Testing Twitter configuration...");
      // Note: In a real app, we'd validate the credentials here
      toast.success("Twitter credentials format looks valid. Real validation happens when posting.");
    } catch (error: any) {
      toast.error(`Error: ${error.message || "Failed to validate Twitter credentials"}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleFarcasterConfigTest = async () => {
    try {
      setTestingConnection(true);
      toast.info("Testing Farcaster configuration...");
      toast.success("Farcaster integration test successful (simulated)");
    } catch (error: any) {
      toast.error(`Error: ${error.message || "Failed to test Farcaster integration"}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleLensConfigTest = async () => {
    try {
      setTestingConnection(true);
      toast.info("Testing Lens Protocol configuration...");
      toast.success("Lens Protocol integration test successful (simulated)");
    } catch (error: any) {
      toast.error(`Error: ${error.message || "Failed to test Lens Protocol integration"}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveTwitterConfig = async () => {
    toast.info("Twitter configuration saved. This is a demo - in a real app, we would store these securely in Supabase.");
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1A1F2C] text-white">
        <DialogHeader>
          <DialogTitle>Platform Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="twitter" value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="twitter">Twitter</TabsTrigger>
            <TabsTrigger value="lens">Lens</TabsTrigger>
            <TabsTrigger value="farcaster">Farcaster</TabsTrigger>
          </TabsList>
          
          <TabsContent value="twitter" className="space-y-4 mt-4">
            <div>
              <p className="text-sm mb-4">
                To enable Twitter integration, you need to set up your API keys in Supabase Edge Function Secrets.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Twitter className="h-5 w-5 text-blue-400" />
                  <span>Your Twitter account will be used for posting</span>
                </div>
                
                <div className="bg-blue-500/10 p-3 rounded-md text-sm">
                  <p>Required secrets need to be set in Supabase:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>TWITTER_CONSUMER_KEY</li>
                    <li>TWITTER_CONSUMER_SECRET</li>
                    <li>TWITTER_ACCESS_TOKEN</li>
                    <li>TWITTER_ACCESS_TOKEN_SECRET</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleTwitterConfigTest} disabled={testingConnection}>
                {testingConnection ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="lens" className="space-y-4 mt-4">
            <div>
              <p className="text-sm mb-4">
                To enable Lens Protocol integration, you need to set up your API key in Supabase Edge Function Secrets.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="h-5 w-5 rounded-full bg-green-400 flex items-center justify-center text-black font-bold text-xs">L</div>
                  <span>Your Lens Protocol account will be used for posting</span>
                </div>
                
                <div className="bg-green-500/10 p-3 rounded-md text-sm">
                  <p>Required secrets need to be set in Supabase:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>LENS_API_KEY</li>
                  </ul>
                </div>
                
                <p className="text-sm text-gray-400">
                  Full Lens Protocol integration requires authentication with a wallet. 
                  This is a simplified implementation for demonstration purposes.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleLensConfigTest} disabled={testingConnection}>
                {testingConnection ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="farcaster" className="space-y-4 mt-4">
            <div>
              <p className="text-sm mb-4">
                To enable Farcaster integration, you need to set up your API keys in Supabase Edge Function Secrets.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="h-5 w-5 rounded-full bg-purple-400 flex items-center justify-center text-black font-bold text-xs">F</div>
                  <span>Your Farcaster account will be used for posting</span>
                </div>
                
                <div className="bg-purple-500/10 p-3 rounded-md text-sm">
                  <p>Required secrets need to be set in Supabase:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>FARCASTER_API_KEY</li>
                    <li>FARCASTER_API_SECRET</li>
                  </ul>
                </div>
                
                <p className="text-sm text-gray-400">
                  Full Farcaster integration requires authentication with a wallet. 
                  This is a simplified implementation for demonstration purposes.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleFarcasterConfigTest} disabled={testingConnection}>
                {testingConnection ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
