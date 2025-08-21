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
    const TIKTOK_CLIENT_ID = Deno.env.get('TIKTOK_CLIENT_ID');
    const TIKTOK_CLIENT_SECRET = Deno.env.get('TIKTOK_CLIENT_SECRET');
    
    console.log('=== TIKTOK SECRETS VERIFICATION ===');
    console.log('CLIENT_ID exists:', !!TIKTOK_CLIENT_ID);
    console.log('CLIENT_SECRET exists:', !!TIKTOK_CLIENT_SECRET);
    console.log('CLIENT_ID length:', TIKTOK_CLIENT_ID?.length || 0);
    console.log('CLIENT_SECRET length:', TIKTOK_CLIENT_SECRET?.length || 0);
    console.log('CLIENT_ID first 4 chars:', TIKTOK_CLIENT_ID?.substring(0, 4) || 'NONE');
    console.log('CLIENT_SECRET first 4 chars:', TIKTOK_CLIENT_SECRET?.substring(0, 4) || 'NONE');
    
    return new Response(
      JSON.stringify({
        client_id_configured: !!TIKTOK_CLIENT_ID,
        client_secret_configured: !!TIKTOK_CLIENT_SECRET,
        client_id_length: TIKTOK_CLIENT_ID?.length || 0,
        client_secret_length: TIKTOK_CLIENT_SECRET?.length || 0,
        client_id_preview: TIKTOK_CLIENT_ID?.substring(0, 4) + '***' || 'MISSING',
        client_secret_preview: TIKTOK_CLIENT_SECRET?.substring(0, 4) + '***' || 'MISSING'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Verification error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to verify secrets' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});