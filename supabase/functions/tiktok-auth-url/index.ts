
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
    
    // Get client ID from Supabase secrets - THIS MUST BE YOUR REAL TIKTOK APP CLIENT KEY
    const TIKTOK_CLIENT_ID = Deno.env.get('TIKTOK_CLIENT_ID');
    
    if (!TIKTOK_CLIENT_ID) {
      throw new Error('TIKTOK_CLIENT_ID secret not configured. Please set your actual TikTok app client key in Supabase secrets.');
    }
    
    console.log('Using client ID from secrets:', TIKTOK_CLIENT_ID.substring(0, 8) + '...');
    
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
    
    // Use the correct TikTok Login Kit authorization endpoint
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
