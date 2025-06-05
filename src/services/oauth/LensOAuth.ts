
export interface LensConnection {
  handle: string;
  walletAddress: string;
  profileId: string;
}

export class LensOAuth {
  async connectWallet(): Promise<{ address: string; signature: string }> {
    // Check if MetaMask is available
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to connect to Lens.');
    }
    
    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];
      
      // Create a message to sign
      const message = `Connect to InSync Lens Integration\n\nAddress: ${address}\nTimestamp: ${Date.now()}`;
      
      // Sign the message
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      });
      
      return { address, signature };
    } catch (error: any) {
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }
  
  async authenticateWithLens(walletAddress: string, signature: string): Promise<LensConnection> {
    // This would call your backend to authenticate with Lens Protocol
    const response = await fetch('/api/auth/lens/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, signature })
    });
    
    if (!response.ok) {
      throw new Error('Failed to authenticate with Lens Protocol');
    }
    
    return response.json();
  }
  
  async getLensProfile(walletAddress: string): Promise<{ handle: string; profileId: string } | null> {
    try {
      const response = await fetch('/api/lens/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });
      
      if (!response.ok) return null;
      
      return response.json();
    } catch {
      return null;
    }
  }
}

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
