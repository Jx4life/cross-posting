
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TikTok Token Manager for server-side
class TikTokTokenManager {
  private supabase: any;
  
  constructor(supabase: any) {
    this.supabase = supabase;
  }
  
  async isTokenExpired(tokenInfo: any): Promise<boolean> {
    const now = Date.now() / 1000;
    const createdAt = new Date(tokenInfo.created_at).getTime() / 1000;
    const expiresAt = createdAt + (24 * 60 * 60); // 24 hours
    const buffer = 300; // 5 minutes buffer
    
    return now >= (expiresAt - buffer);
  }
  
  async refreshToken(refreshToken: string): Promise<any> {
    const clientId = 'sbawjmn8p4yrizyuis';
    const clientSecret = 'F51RS5h2sDaZUUxLbDWoe9p5TXEalKxj';
    
    const params = new URLSearchParams({
      client_key: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });
    
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: params
    });
    
    const data = await response.json();
    
    if (!response.ok || data.error) {
      throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
    }
    
    return data;
  }
  
  async getValidAccessToken(userId: string): Promise<string> {
    console.log('Getting valid access token for user:', userId);
    
    const { data: config, error } = await this.supabase
      .from('post_configurations')
      .select('access_token, refresh_token, created_at')
      .eq('user_id', userId)
      .eq('platform', 'tiktok')
      .eq('is_enabled', true)
      .single();
    
    if (error || !config) {
      throw new Error('TikTok account not connected');
    }
    
    if (!config.access_token || !config.refresh_token) {
      throw new Error('TikTok tokens not found');
    }
    
    // Check if token needs refresh
    if (await this.isTokenExpired(config)) {
      console.log('Access token expired, refreshing...');
      
      try {
        const tokenResponse = await this.refreshToken(config.refresh_token);
        
        // Update database with new tokens
        const { error: updateError } = await this.supabase
          .from('post_configurations')
          .update({
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token || config.refresh_token,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('platform', 'tiktok');
        
        if (updateError) {
          throw new Error('Failed to save refreshed tokens');
        }
        
        console.log('Successfully refreshed TikTok access token');
        return tokenResponse.access_token;
        
      } catch (refreshError: any) {
        console.error('Token refresh failed:', refreshError);
        
        // Mark token as invalid
        await this.supabase
          .from('post_configurations')
          .update({ is_enabled: false })
          .eq('user_id', userId)
          .eq('platform', 'tiktok');
        
        throw new Error('TikTok authentication expired. Please reconnect your account.');
      }
    }
    
    console.log('Access token is still valid');
    return config.access_token;
  }
}

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

    // Initialize token manager
    const tokenManager = new TikTokTokenManager(supabase);
    
    let accessToken: string;
    try {
      accessToken = await tokenManager.getValidAccessToken(user.id);
    } catch (tokenError: any) {
      console.error('Token management error:', tokenError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: tokenError.message || 'TikTok authentication failed. Please reconnect your account.'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Using valid access token for TikTok API');

    // Step 1: Download the video file from the provided URL
    console.log('Downloading video from:', mediaUrl);
    const videoResponse = await fetch(mediaUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    
    const videoBuffer = await videoResponse.arrayBuffer();
    const videoSize = videoBuffer.byteLength;
    console.log('Video downloaded, size:', videoSize, 'bytes');

    // Try the direct content post approach first
    console.log('Attempting TikTok video post using direct content approach...');
    const directPostResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: content || 'Posted via Social Media Manager',
          description: content || '',
          privacy_level: 'SELF_ONLY',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: mediaUrl
        }
      })
    });

    console.log('Direct post response status:', directPostResponse.status);
    
    if (directPostResponse.ok) {
      const directData = await directPostResponse.json();
      console.log('Direct post success:', directData);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            publish_id: directData.data?.publish_id || 'direct-post',
            method: 'direct_url'
          },
          message: 'Video posted to TikTok successfully using direct URL method!'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Direct post failed, trying file upload method...');

    // Initialize video upload with TikTok API (original method)
    console.log('Initializing TikTok video upload...');
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: content || 'Posted via Social Media Manager',
          description: content || '',
          privacy_level: 'SELF_ONLY',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: Math.min(videoSize, 10 * 1024 * 1024),
          total_chunk_count: Math.ceil(videoSize / (10 * 1024 * 1024))
        }
      })
    });

    const initData = await initResponse.json();
    console.log('TikTok init response:', initData);

    if (!initResponse.ok) {
      console.error('TikTok video init failed:', initData);
      
      // Handle token expiration errors
      if (initData.error?.code === 'access_token_invalid' || 
          initData.error?.code === 'access_token_expired') {
        console.log('Access token invalid/expired, attempting refresh...');
        
        try {
          const newAccessToken = await tokenManager.getValidAccessToken(user.id);
          // Retry the request with the new token
          // (This would require recursive call or retry logic)
          console.log('Token refreshed, but request retry not implemented in this example');
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'TikTok authentication expired. Please reconnect your account.',
            code: 'TOKEN_EXPIRED'
          }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Handle specific TikTok API errors
      if (initData.error?.code === 'unaudited_client_can_only_post_to_private_accounts') {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'TikTok App Review Required',
            message: 'Your TikTok app needs to be reviewed by TikTok before it can post to public accounts. Please ensure your TikTok account privacy is set to "Private" in your TikTok settings.',
            code: 'UNAUDITED_CLIENT'
          }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw new Error(`TikTok video init failed: ${initData.error?.message || 'Unknown error'}`);
    }

    const uploadUrl = initData.data.upload_url;
    const publishId = initData.data.publish_id;
    
    console.log('Upload URL received:', uploadUrl);
    console.log('Publish ID:', publishId);

    // Upload video file to TikTok's servers
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

    // Commit the video using the correct endpoint
    console.log('Publishing video on TikTok using commit endpoint...');
    const commitResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/commit/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publish_id: publishId
      })
    });

    console.log('Commit response status:', commitResponse.status);

    let commitData;
    if (commitResponse.headers.get('content-type')?.includes('application/json')) {
      commitData = await commitResponse.json();
      console.log('TikTok commit response:', commitData);
    } else {
      const responseText = await commitResponse.text();
      console.log('TikTok commit response (non-JSON):', responseText);
    }

    // Return success regardless of commit status since video was uploaded
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          publish_id: publishId,
          status: commitResponse.ok ? 'PUBLISHED' : 'UPLOADED',
          share_url: commitData?.data?.share_url,
          method: 'file_upload'
        },
        message: commitResponse.ok ? 
          'Video uploaded and published to TikTok successfully!' :
          'Video uploaded to TikTok successfully! (Publish step had issues but upload completed)'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
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
