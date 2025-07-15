
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { TikTokAPI } from '../_shared/tiktok-api.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const { code, redirectUri } = await req.json();
    
    if (!code || !redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    // Get client credentials from environment variables
    const clientId = Deno.env.get('TIKTOK_CLIENT_ID');
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'TikTok API credentials not configured' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    const tiktokConfig = {
      clientId,
      clientSecret,
      redirectUri,
      scopes: ['user.info.basic', 'video.publish']
    };

    const tiktokAPI = new TikTokAPI(tiktokConfig);
    
    // Exchange the authorization code for tokens
    const tokenResponse = await tiktokAPI.exchangeCodeForToken(code);
    
    if (!tokenResponse || !tokenResponse.access_token) {
      throw new Error('Failed to exchange code for token');
    }
    
    // Get user info using the access token
    const userInfo = await tiktokAPI.getUserInfo(tokenResponse.access_token);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
        userInfo
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
    
  } catch (error) {
    console.error('Error exchanging TikTok code:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to exchange authorization code' }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});
