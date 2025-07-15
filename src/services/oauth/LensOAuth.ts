
export interface LensProfile {
  handle: string;
  profileId: string;
}

export class LensOAuth {
  async connectWallet(): Promise<{ address: string; signature: string }> {
    try {
      console.log('=== LENS OAUTH DEBUG ===');
      console.log('Checking for ethereum provider...');
      
      // Check if ethereum is available
      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }
      
      // Safely check for ethereum without redefining
      const ethereum = (window as any).ethereum;
      
      if (!ethereum) {
        throw new Error('No Ethereum provider found. Please install MetaMask.');
      }
      
      console.log('Ethereum provider found:', ethereum);
      
      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      const address = accounts[0];
      console.log('Connected address:', address);
      
      // Create a message to sign
      const message = `Connect to Lens Protocol\n\nAddress: ${address}\nTimestamp: ${Date.now()}`;
      
      // Sign the message
      const signature = await ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });
      
      console.log('Message signed successfully');
      
      return {
        address: address.toLowerCase(),
        signature
      };
      
    } catch (error: any) {
      console.error('Lens OAuth error:', error);
      
      // Handle specific error cases
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      } else if (error.code === -32002) {
        throw new Error('Connection request is already pending');
      } else if (error.message?.includes('User rejected')) {
        throw new Error('User rejected the connection request');
      }
      
      throw new Error(error.message || 'Failed to connect wallet');
    }
  }
  
  async getLensProfile(address: string): Promise<LensProfile | null> {
    try {
      console.log('Fetching Lens profile for address:', address);
      
      // This is a simplified demo implementation
      // In a real app, you would query the Lens Protocol API
      const mockProfiles = [
        { address: '0x123...', handle: 'demo.lens', profileId: '0x01' },
        { address: '0x456...', handle: 'user.lens', profileId: '0x02' }
      ];
      
      const profile = mockProfiles.find(p => 
        p.address.toLowerCase() === address.toLowerCase()
      );
      
      if (profile) {
        console.log('Found Lens profile:', profile);
        return {
          handle: profile.handle,
          profileId: profile.profileId
        };
      }
      
      // For demo purposes, create a mock profile
      const mockProfile = {
        handle: `user_${address.slice(2, 8)}.lens`,
        profileId: `0x${address.slice(2, 8)}`
      };
      
      console.log('Created mock Lens profile:', mockProfile);
      return mockProfile;
      
    } catch (error: any) {
      console.error('Error fetching Lens profile:', error);
      return null;
    }
  }
}
