
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const LensConnector = () => {
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [isConnectingLens, setIsConnectingLens] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [lensHandle, setLensHandle] = useState<string | null>(null);
  
  // Connect wallet function (simplified for demo)
  const connectWallet = async () => {
    setIsConnectingWallet(true);
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum !== 'undefined') {
        // Request wallet connection
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        setWalletAddress(address);
        toast.success("Wallet connected successfully!");
        localStorage.setItem('walletAddress', address);
      } else {
        toast.error("MetaMask is not installed. Please install MetaMask to connect your wallet.");
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast.error(error.message || "Failed to connect wallet");
    } finally {
      setIsConnectingWallet(false);
    }
  };
  
  // Connect Lens account function
  const connectLensAccount = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setIsConnectingLens(true);
    try {
      // In a real implementation, you would:
      // 1. Generate a challenge from Lens API
      // 2. Ask user to sign the challenge with their wallet
      // 3. Verify the signature with Lens API
      // 4. Get access and refresh tokens
      
      // For demo purposes, we'll simulate this process
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      // Simulate getting a handle (in reality, this would come from the API)
      const simulatedHandle = `lens/${walletAddress.substring(0, 8)}`;
      setLensHandle(simulatedHandle);
      localStorage.setItem('lensHandle', simulatedHandle);
      
      toast.success("Lens account connected successfully!");
    } catch (error: any) {
      console.error("Error connecting Lens account:", error);
      toast.error(error.message || "Failed to connect Lens account");
    } finally {
      setIsConnectingLens(false);
    }
  };
  
  // Check for existing connections on component mount
  useState(() => {
    const savedWalletAddress = localStorage.getItem('walletAddress');
    const savedLensHandle = localStorage.getItem('lensHandle');
    
    if (savedWalletAddress) {
      setWalletAddress(savedWalletAddress);
    }
    
    if (savedLensHandle) {
      setLensHandle(savedLensHandle);
    }
  });
  
  const disconnectAccounts = () => {
    setWalletAddress(null);
    setLensHandle(null);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('lensHandle');
    toast.info("Disconnected wallet and Lens account");
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h3 className="text-lg font-medium">Wallet Connection</h3>
        <p className="text-sm text-gray-400">Connect your wallet to authenticate with Lens Protocol</p>
        
        {!walletAddress ? (
          <Button 
            onClick={connectWallet} 
            disabled={isConnectingWallet}
            className="w-full"
          >
            {isConnectingWallet ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting Wallet...
              </>
            ) : "Connect Wallet"}
          </Button>
        ) : (
          <Alert className="bg-green-500/10 border border-green-500/20">
            <AlertDescription>
              Wallet connected: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <div className="flex flex-col space-y-2">
        <h3 className="text-lg font-medium">Lens Account</h3>
        <p className="text-sm text-gray-400">Connect your Lens Protocol account to post content</p>
        
        {!lensHandle ? (
          <Button 
            onClick={connectLensAccount} 
            disabled={isConnectingLens || !walletAddress}
            className="w-full"
          >
            {isConnectingLens ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting to Lens...
              </>
            ) : "Connect Lens Account"}
          </Button>
        ) : (
          <Alert className="bg-green-500/10 border border-green-500/20">
            <AlertDescription>
              Lens handle connected: {lensHandle}
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {(walletAddress || lensHandle) && (
        <Button 
          variant="outline" 
          onClick={disconnectAccounts}
          className="w-full mt-4"
        >
          Disconnect Accounts
        </Button>
      )}
    </div>
  );
};
