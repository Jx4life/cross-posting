
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirectUri } = await req.json();
    
    console.log('TikTok token exchange request:', { code, redirectUri });
    
    // Use sandbox credentials
    const clientId = 'sbawjmn8p4yrizyuis';
    const clientSecret = 'F51RS5h2sDaZUUxLbDWoe9p5TXEalKxj';
    
    console.log('Using sandbox client ID:', clientId);
    console.log('Using redirect URI:', redirectUri);
    
    // Exchange code for access token using the correct endpoint
    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
    const params = new URLSearchParams({
      client_key: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });
    
    console.log('Making token exchange request to TikTok...');
    console.log('Token URL:', tokenUrl);
    console.log('Request params (without secret):', {
      client_key: clientId,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: params
    });
    
    const responseText = await response.text();
    console.log('TikTok token response status:', response.status);
    console.log('TikTok token response:', responseText);
    
    if (!response.ok) {
      console.error('TikTok token exchange failed:', response.status, responseText);
      throw new Error(`TikTok API error: ${response.status} ${response.statusText} - ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    
    if (data.error) {
      console.error('TikTok API error:', data.error, data.error_description);
      throw new Error(`TikTok API error: ${data.error} - ${data.error_description || ''}`);
    }
    
    console.log('TikTok token exchange successful');
    console.log('Access token received:', data.access_token ? 'Yes' : 'No');
    console.log('Open ID:', data.open_id);
    console.log('Scope:', data.scope);
    
    return new Response(
      JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        open_id: data.open_id,
        scope: data.scope
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('TikTok token exchange error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to exchange TikTok authorization code' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
