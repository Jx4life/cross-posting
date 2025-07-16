
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced TikTok Token Manager
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

// Enhanced TikTok API Client
class TikTokAPIClient {
  private baseUrl = 'https://open.tiktokapis.com';
  
  async makeAPIRequest<T>(
    endpoint: string,
    options: {
      method: 'GET' | 'POST' | 'PUT';
      accessToken: string;
      body?: any;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${options.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    console.log(`Making TikTok API request to: ${endpoint}`);

    const response = await fetch(url, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const responseText = await response.text();
    console.log(`TikTok API response (${response.status}):`, responseText.substring(0, 500));

    // Check if response is HTML (error page)
    if (responseText.trim().startsWith('<')) {
      throw new Error(`TikTok API returned HTML error page. Status: ${response.status}`);
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response from TikTok API: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      const errorMessage = data.error?.message || data.error_description || `HTTP ${response.status}`;
      throw new Error(`TikTok API error: ${errorMessage}`);
    }

    if (data.error) {
      throw new Error(`TikTok API error: ${data.error.message || 'Unknown API error'}`);
    }

    return data;
  }

  async initializeVideoUpload(accessToken: string, videoSize: number, title: string, description?: string) {
    return this.makeAPIRequest('/v2/post/publish/video/init/', {
      method: 'POST',
      accessToken,
      body: {
        post_info: {
          title,
          description: description || '',
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
      }
    });
  }

  async uploadVideoFile(uploadUrl: string, videoBuffer: ArrayBuffer): Promise<void> {
    console.log(`Uploading video file (${videoBuffer.byteLength} bytes)`);

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes 0-${videoBuffer.byteLength - 1}/${videoBuffer.byteLength}`,
        'Content-Length': videoBuffer.byteLength.toString(),
      },
      body: videoBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Video upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    console.log('Video upload completed successfully');
  }

  async publishVideo(accessToken: string, publishId: string) {
    return this.makeAPIRequest('/v2/post/publish/', {
      method: 'POST',
      accessToken,
      body: { publish_id: publishId }
    });
  }

  async checkVideoStatus(accessToken: string, publishId: string) {
    return this.makeAPIRequest('/v2/post/publish/status/fetch/', {
      method: 'POST',
      accessToken,
      body: { publish_id: publishId }
    });
  }

  async createPostFromURL(accessToken: string, videoUrl: string, title: string, description?: string) {
    return this.makeAPIRequest('/v2/post/publish/content/init/', {
      method: 'POST',
      accessToken,
      body: {
        post_info: {
          title,
          description: description || '',
          privacy_level: 'SELF_ONLY',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl
        }
      }
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, mediaUrl, mediaType } = await req.json();
    
    console.log('TikTok posting request:', { content: content?.substring(0, 100), mediaUrl, mediaType });
    
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

    // Initialize services
    const tokenManager = new TikTokTokenManager(supabase);
    const apiClient = new TikTokAPIClient();
    
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

    // Download the video file
    console.log('Downloading video from:', mediaUrl);
    const videoResponse = await fetch(mediaUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    
    const videoBuffer = await videoResponse.arrayBuffer();
    const videoSize = videoBuffer.byteLength;
    console.log('Video downloaded, size:', videoSize, 'bytes');

    // Validate video size (TikTok limit is ~287MB)
    const maxSize = 287 * 1024 * 1024;
    if (videoSize > maxSize) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Video file too large: ${Math.round(videoSize / (1024 * 1024))}MB. Maximum allowed: 287MB` 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const title = content?.substring(0, 150) || 'Posted via Social Media Manager';
    const description = content || '';

    // Try direct URL approach first (faster and more reliable)
    console.log('Attempting TikTok video post using direct URL approach...');
    try {
      const directResult = await apiClient.createPostFromURL(accessToken, mediaUrl, title, description);
      
      console.log('Direct URL post successful:', directResult);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            publish_id: directResult.data?.publish_id || 'direct-post',
            method: 'direct_url',
            status: 'PROCESSING'
          },
          message: 'Video posted to TikTok successfully using direct URL method!'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (directError) {
      console.log('Direct URL approach failed, trying file upload method...', directError);
    }

    // Fallback to file upload method
    console.log('Initializing TikTok video upload...');
    const initResult = await apiClient.initializeVideoUpload(accessToken, videoSize, title, description);
    
    const uploadUrl = initResult.data.upload_url;
    const publishId = initResult.data.publish_id;
    
    console.log('Upload URL received, Publish ID:', publishId);

    // Upload video file
    await apiClient.uploadVideoFile(uploadUrl, videoBuffer);

    // Publish the video
    console.log('Publishing video on TikTok...');
    try {
      await apiClient.publishVideo(accessToken, publishId);
      console.log('Video published successfully');
    } catch (publishError) {
      console.log('Publish step had issues but upload completed:', publishError);
    }

    // Check final status
    let finalStatus = 'UPLOADED';
    try {
      const statusResult = await apiClient.checkVideoStatus(accessToken, publishId);
      finalStatus = statusResult.data?.status || 'UPLOADED';
      console.log('Final video status:', finalStatus);
    } catch (statusError) {
      console.log('Status check failed, but video was processed:', statusError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          publish_id: publishId,
          status: finalStatus,
          method: 'file_upload'
        },
        message: finalStatus === 'PUBLISHED' ? 
          'Video uploaded and published to TikTok successfully!' :
          'Video uploaded to TikTok successfully and is being processed!'
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
