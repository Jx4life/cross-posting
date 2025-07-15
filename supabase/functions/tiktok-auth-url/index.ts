
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
    const { redirectUri } = await req.json();
    
    if (!redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Missing redirectUri parameter' }),
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
    
    // Generate a state parameter for CSRF protection
    const state = crypto.randomUUID();
    
    // Generate the authorization URL
    const authUrl = tiktokAPI.generateAuthUrl(state);
    
    return new Response(
      JSON.stringify({ success: true, authUrl }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
    
  } catch (error) {
    console.error('Error generating TikTok auth URL:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate TikTok authorization URL' }),
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
