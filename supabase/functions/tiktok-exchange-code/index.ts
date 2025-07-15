
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
    
    // Get TikTok credentials from Supabase secrets
    const clientId = Deno.env.get('TIKTOK_CLIENT_ID');
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      console.error('Missing TikTok credentials');
      return new Response(
        JSON.stringify({ error: 'TikTok credentials not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Exchange code for access token
    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
    const params = new URLSearchParams({
      client_key: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });
    
    console.log('Making token exchange request to TikTok...');
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });
    
    const responseText = await response.text();
    console.log('TikTok token response:', responseText);
    
    if (!response.ok) {
      console.error('TikTok token exchange failed:', response.status, responseText);
      throw new Error(`TikTok API error: ${response.status} ${response.statusText}`);
    }
    
    const data = JSON.parse(responseText);
    
    if (data.error) {
      console.error('TikTok API error:', data.error, data.error_description);
      throw new Error(`TikTok API error: ${data.error} - ${data.error_description || ''}`);
    }
    
    console.log('TikTok token exchange successful');
    
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
