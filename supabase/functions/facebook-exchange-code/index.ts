import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirectUri } = await req.json();
    
    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
    
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Facebook credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `client_secret=${FACEBOOK_APP_SECRET}&` +
      `code=${code}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}`
    );

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error?.message || 'Failed to exchange code for token');
    }

    // Get user info and pages
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${tokenData.access_token}`
    );
    
    const userData = await userResponse.json();
    
    if (!userResponse.ok) {
      throw new Error(userData.error?.message || 'Failed to get user info');
    }

    // Get user's Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
    );
    
    const pagesData = await pagesResponse.json();
    let pages = [];
    
    if (pagesResponse.ok && pagesData.data) {
      pages = pagesData.data;
    }

    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        user: userData,
        pages: pages
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Facebook token exchange error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to exchange code for token' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});