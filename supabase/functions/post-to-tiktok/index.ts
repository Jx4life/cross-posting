
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, mediaUrl, mediaType } = await req.json();
    
    console.log('TikTok posting request:', { content, mediaUrl, mediaType });
    
    // TikTok requires video content
    if (!mediaUrl || mediaType !== 'video') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'TikTok requires video content' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization required' 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid authentication' 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Authenticated user:', user.id);

    // Get user's TikTok configuration from the database
    const { data: config, error: configError } = await supabase
      .from('post_configurations')
      .select('access_token, refresh_token')
      .eq('user_id', user.id)
      .eq('platform', 'tiktok')
      .eq('is_enabled', true)
      .single();

    if (configError || !config) {
      console.error('TikTok configuration error:', configError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'TikTok account not connected. Please connect your TikTok account first.' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!config.access_token) {
      console.error('No TikTok access token found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'TikTok access token not found. Please reconnect your TikTok account.' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Found TikTok configuration for user');

    // Get TikTok API credentials from Supabase secrets (for API calls)
    const tiktokClientId = Deno.env.get('TIKTOK_CLIENT_ID');
    const tiktokClientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');
    
    if (!tiktokClientId || !tiktokClientSecret) {
      console.error('Missing TikTok API credentials in secrets');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'TikTok API credentials not configured' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('TikTok API credentials found');
    
    // For now, simulate the TikTok API call since implementing the full TikTok video upload
    // requires multiple complex steps (video upload initialization, chunked upload, post creation)
    // In a real implementation, you would:
    // 1. Download the video from mediaUrl
    // 2. Initialize video upload with TikTok API
    // 3. Upload video in chunks to TikTok's servers
    // 4. Create the post with the content as description
    
    console.log('Simulating TikTok video upload with user access token...');
    console.log('Access token available:', !!config.access_token);
    console.log('Video URL:', mediaUrl);
    console.log('Content:', content);
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const videoId = 'tt_' + Date.now();
    const shareUrl = `https://www.tiktok.com/@user/video/${videoId}`;
    
    console.log('TikTok post simulation complete:', { videoId, shareUrl });
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          video_id: videoId,
          share_url: shareUrl,
          status: 'published'
        },
        message: 'Video posted to TikTok successfully (simulated)'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('TikTok posting error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to post to TikTok' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
