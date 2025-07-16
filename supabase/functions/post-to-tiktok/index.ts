
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

    // Step 1: Download the video file from the provided URL
    console.log('Downloading video from:', mediaUrl);
    const videoResponse = await fetch(mediaUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    
    const videoBuffer = await videoResponse.arrayBuffer();
    const videoSize = videoBuffer.byteLength;
    console.log('Video downloaded, size:', videoSize, 'bytes');

    // Step 2: Initialize video upload with TikTok API
    console.log('Initializing TikTok video upload...');
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: content || 'Posted via Social Media Manager',
          description: content || '',
          privacy_level: 'SELF_ONLY', // Start with private posts for safety
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: videoSize, // Upload in one chunk for simplicity
          total_chunk_count: 1
        }
      })
    });

    const initData = await initResponse.json();
    console.log('TikTok init response:', initData);

    if (!initResponse.ok) {
      console.error('TikTok video init failed:', initData);
      throw new Error(`TikTok video init failed: ${initData.error?.message || 'Unknown error'}`);
    }

    const uploadUrl = initData.data.upload_url;
    const publishId = initData.data.publish_id;
    
    console.log('Upload URL received:', uploadUrl);
    console.log('Publish ID:', publishId);

    // Step 3: Upload video file to TikTok's servers
    console.log('Uploading video to TikTok...');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes 0-${videoSize-1}/${videoSize}`,
        'Content-Length': videoSize.toString(),
      },
      body: videoBuffer
    });

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      console.error('TikTok video upload failed:', uploadError);
      throw new Error(`TikTok video upload failed: ${uploadResponse.statusText}`);
    }

    console.log('Video uploaded successfully');

    // Step 4: Publish the video
    console.log('Publishing video on TikTok...');
    const publishResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publish_id: publishId
      })
    });

    const publishData = await publishResponse.json();
    console.log('TikTok publish response:', publishData);

    if (!publishResponse.ok) {
      console.error('TikTok video publish failed:', publishData);
      throw new Error(`TikTok video publish failed: ${publishData.error?.message || 'Unknown error'}`);
    }

    // Step 5: Check publish status (optional but recommended)
    let publishStatus = 'PROCESSING';
    let attempts = 0;
    const maxAttempts = 10;
    
    while (publishStatus === 'PROCESSING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publish_id: publishId
        })
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        publishStatus = statusData.data?.status || 'PROCESSING';
        console.log(`Publish status check ${attempts + 1}:`, publishStatus);
        
        if (publishStatus === 'PUBLISHED') {
          console.log('Video successfully published to TikTok!');
          break;
        } else if (publishStatus === 'FAILED') {
          throw new Error('TikTok video publish failed during processing');
        }
      }
      
      attempts++;
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          publish_id: publishId,
          status: publishStatus,
          share_url: publishData.data?.share_url || `https://www.tiktok.com/@user/video/${publishId}`,
        },
        message: 'Video uploaded and published to TikTok successfully!'
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
