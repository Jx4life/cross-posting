
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
    
    // Use sandbox client ID directly since we're in sandbox mode
    const TIKTOK_CLIENT_ID = 'sbawwup5buvyikd3wt';
    
    console.log('Using sandbox client ID:', TIKTOK_CLIENT_ID);
    
    // Generate TikTok OAuth URL using correct Login Kit format
    const scopes = ['user.info.basic', 'video.upload', 'video.publish'];
    const state = crypto.randomUUID();
    
    const params = new URLSearchParams({
      client_key: TIKTOK_CLIENT_ID,
      scope: scopes.join(','),
      response_type: 'code',
      redirect_uri: redirectUri,
      state: state
    });
    
    // Use Login Kit authorization URL format from TikTok docs
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
    
    console.log('=== DEBUG CLIENT_KEY ===');
    console.log('CLIENT_ID source: Supabase secrets');
    console.log('CLIENT_ID (partial):', TIKTOK_CLIENT_ID.substring(0, 8) + '...');
    console.log('Generated TikTok auth URL:', authUrl);
    console.log('Scopes:', scopes.join(','));
    console.log('Redirect URI:', redirectUri);
    
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
