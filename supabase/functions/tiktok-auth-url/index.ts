
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
    
    // Get TikTok credentials from Supabase secrets instead of hardcoding
    const TIKTOK_CLIENT_ID = Deno.env.get('TIKTOK_CLIENT_ID');
    
    if (!TIKTOK_CLIENT_ID) {
      throw new Error('TIKTOK_CLIENT_ID not configured in Supabase secrets');
    }
    
    console.log('Using client ID from secrets:', TIKTOK_CLIENT_ID.substring(0, 8) + '...');
    
    // Generate TikTok OAuth URL using the correct endpoint with video upload scope
    const scopes = ['user.info.basic', 'video.upload', 'video.publish'];
    const state = crypto.randomUUID();
    
    const params = new URLSearchParams({
      client_key: TIKTOK_CLIENT_ID,
      scope: scopes.join(','),
      response_type: 'code',
      redirect_uri: redirectUri,
      state: state
    });
    
    // Use the correct TikTok OAuth authorization endpoint according to official docs
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
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate TikTok auth URL' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
