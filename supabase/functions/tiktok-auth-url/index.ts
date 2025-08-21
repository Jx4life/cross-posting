
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
    const { redirectUri } = await req.json();
    
    console.log('TikTok auth URL request:', { redirectUri });
    
    // Use your correct sandbox client ID - sbawwup5buvyikd3wt
    const TIKTOK_CLIENT_ID = 'sbawwup5buvyikd3wt';
    
    console.log('Using correct sandbox client ID:', TIKTOK_CLIENT_ID);
    
    // TikTok OAuth scopes
    const scopes = ['user.info.basic', 'video.upload', 'video.publish'];
    const state = crypto.randomUUID();
    
    // Build OAuth URL with correct parameter name
    const params = new URLSearchParams({
      client_key: TIKTOK_CLIENT_ID,  // TikTok uses 'client_key' not 'client_id'
      scope: scopes.join(','),
      response_type: 'code',
      redirect_uri: redirectUri,
      state: state
    });
    
    // Based on TikTok documentation, construct the URL manually to ensure proper formatting
    let authUrl = "https://www.tiktok.com/v2/auth/authorize/";
    authUrl += "?client_key=" + encodeURIComponent(TIKTOK_CLIENT_ID);
    authUrl += "&scope=" + encodeURIComponent(scopes.join(','));
    authUrl += "&response_type=code";
    authUrl += "&redirect_uri=" + encodeURIComponent(redirectUri);
    authUrl += "&state=" + encodeURIComponent(state);
    
    console.log('=== FINAL DEBUG ===');
    console.log('CLIENT_KEY:', TIKTOK_CLIENT_ID);
    console.log('REDIRECT_URI:', redirectUri);
    console.log('SCOPES:', scopes.join(','));
    console.log('FULL AUTH URL:', authUrl);
    console.log('URL PARAMS MANUAL:', `client_key=${TIKTOK_CLIENT_ID}&scope=${scopes.join(',')}&response_type=code&redirect_uri=${redirectUri}&state=${state}`);
    
    return new Response(
      JSON.stringify({ authUrl, state }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('TikTok auth URL error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate TikTok auth URL',
        details: error.stack || 'No stack trace available'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
