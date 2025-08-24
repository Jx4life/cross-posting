
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
    const TIKTOK_CLIENT_ID = Deno.env.get("TIKTOK_CLIENT_ID");
    const TIKTOK_CLIENT_SECRET = Deno.env.get("TIKTOK_CLIENT_SECRET");
    
    if (!TIKTOK_CLIENT_ID || !TIKTOK_CLIENT_SECRET) {
      throw new Error('TikTok credentials not configured');
    }
    
    const params = new URLSearchParams({
      client_key: TIKTOK_CLIENT_ID,
      client_secret: TIKTOK_CLIENT_SECRET,
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
    
    // TikTok OAuth token response also follows the same pattern - check for error.code
    if (!response.ok || (data.error && data.error.code !== 'ok')) {
      const errorMessage = data.error?.message || data.error_description || data.error || 'Token refresh failed';
      throw new Error(`Token refresh failed: ${errorMessage}`);
    }
    
    return data;
  }
  
  async getValidAccessToken(userId: string): Promise<string> {
    console.log('Getting valid access token for user:', userId);
    
    try {
      // Get encrypted tokens
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

      // Decrypt tokens using server-side function
      const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');
      if (!encryptionKey) {
        throw new Error('Encryption key not configured');
      }

      const { data: decryptedAccessToken, error: decryptError1 } = await this.supabase
        .rpc('decrypt_token', {
          encrypted_token: config.access_token,
          encryption_key: encryptionKey
        });

      const { data: decryptedRefreshToken, error: decryptError2 } = await this.supabase
        .rpc('decrypt_token', {
          encrypted_token: config.refresh_token,
          encryption_key: encryptionKey
        });

      if (decryptError1 || decryptError2) {
        throw new Error('Failed to decrypt tokens');
      }

      // Simple client-side decryption (reverse of the encryption process)
      const clientKey = encryptionKey.substring(0, 16);
      const accessToken = this.simpleDecrypt(decryptedAccessToken, clientKey);
      const refreshToken = this.simpleDecrypt(decryptedRefreshToken, clientKey);

      // Check if token needs refresh
      if (await this.isTokenExpired(config)) {
        console.log('Access token expired, refreshing...');
        
        try {
          const tokenResponse = await this.refreshToken(refreshToken);
          
          // Re-encrypt and store new tokens
          const newEncryptedAccess = await this.encryptToken(tokenResponse.access_token, encryptionKey);
          const newEncryptedRefresh = await this.encryptToken(
            tokenResponse.refresh_token || refreshToken, 
            encryptionKey
          );
          
          // Update database with new encrypted tokens
          const { error: updateError } = await this.supabase
            .from('post_configurations')
            .update({
              access_token: newEncryptedAccess,
              refresh_token: newEncryptedRefresh,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('platform', 'tiktok');
          
          if (updateError) {
            throw updateError;
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
      return accessToken;
      
    } catch (error) {
      console.error('Error getting valid access token:', error);
      throw error;
    }
  }

  // Helper methods for client-side encryption/decryption
  private simpleEncrypt(text: string, key: string): string {
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      encrypted += String.fromCharCode(charCode);
    }
    return btoa(encrypted);
  }

  private simpleDecrypt(encryptedText: string, key: string): string {
    const encrypted = atob(encryptedText);
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  }

  private async encryptToken(token: string, encryptionKey: string): Promise<string> {
    // Client-side encryption layer
    const clientEncrypted = this.simpleEncrypt(token, encryptionKey.substring(0, 16));
    
    // Server-side encryption
    const { data, error } = await this.supabase.rpc('encrypt_token', {
      token: clientEncrypted,
      encryption_key: encryptionKey
    });
    
    if (error) {
      throw new Error('Failed to encrypt token');
    }
    
    return data;
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
  console.log("API response url", url)
  console.log("API response data", data)
} catch (parseError) {
  throw new Error(`Invalid JSON response from TikTok API: ${responseText.substring(0, 200)}`);
}

    if (!response.ok) {
      const errorMessage = data.error?.message || data.error_description || `HTTP ${response.status}`;
      throw new Error(`TikTok API error: ${errorMessage}`);
    }

    // TikTok always returns an error object, check if error.code is not "ok"
    if (data.error && data.error.code !== 'ok') {
      throw new Error(`TikTok API error: ${data.error.message || data.error.code || 'Unknown API error'}`);
    }

    return data;
  }

  async initializeVideoUpload(accessToken: string, videoSize: number, title: string, description?: string) {
    return this.makeAPIRequest('/v2/post/publish/video/init/', {
      method: 'POST',
      accessToken,
      body: {
        post_info: {
          title: title || 'Video via API',
          privacy_level: 'SELF_ONLY',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: videoSize,
          total_chunk_count: 1,
        }
      }
    });
  }

  async initializePhotoUpload(accessToken: string, photos: Array<{ size: number, format: string }>, title: string, description?: string, photoUrls?: string[]) {
    const reqBody = {
      post_info: {
        title: title || 'Photo via API',
        description: description || '',
      },
      post_mode: 'MEDIA_UPLOAD',
      media_type: 'PHOTO'
    };

    if (photoUrls && photoUrls.length > 0) {
      // Use URL method
      reqBody.source_info = {
        source: 'PULL_FROM_URL',
        photo_cover_index: 0,
        photo_images: photoUrls
      };
    } else {
      // Use file upload method
      reqBody.source_info = {
        source: 'FILE_UPLOAD'
      };
    }

    console.log("DEBUG INITPHOTO BODY", reqBody);
    return this.makeAPIRequest('/v2/post/publish/content/init/', {
      method: 'POST',
      accessToken,
      body: reqBody
    });
  }

  async uploadVideoFile(uploadUrl: string, videoBuffer: ArrayBuffer, mimeType?: string): Promise<void> {
    console.log(`Uploading video file (${videoBuffer.byteLength} bytes)`);

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes 0-${videoBuffer.byteLength - 1}/${videoBuffer.byteLength}`,
        'Content-Type': mimeType || 'video/mp4',
      },
      body: videoBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Video upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    console.log('Video upload completed successfully');
  }

  async uploadPhotoFiles(uploadUrls: string[], photoBuffers: ArrayBuffer[], mimeTypes?: string[]): Promise<void> {
    console.log(`Uploading ${photoBuffers.length} photos`);

    if (uploadUrls.length !== photoBuffers.length) {
      throw new Error('Mismatch between upload URLs and photo buffers');
    }

    const uploadPromises = uploadUrls.map(async (uploadUrl, index) => {
      const photoBuffer = photoBuffers[index];
      const mimeType = mimeTypes?.[index] || 'image/jpeg';
      console.log(`Uploading photo ${index + 1} (${photoBuffer.byteLength} bytes)`);

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
        },
        body: photoBuffer
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Photo ${index + 1} upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log(`Photo ${index + 1} upload completed successfully`);
    });

    await Promise.all(uploadPromises);
    console.log('All photos uploaded successfully');
  }

  async publishContent(accessToken: string, publishId: string) {
    return this.makeAPIRequest('/v2/post/publish/', {
      method: 'POST',
      accessToken,
      body: { publish_id: publishId }
    });
  }

  async checkContentStatus(accessToken: string, publishId: string) {
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
          title: title || 'Video via API',
          description: description || '',
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl
        },
        media_type: 'VIDEO',
        post_mode: 'DIRECT_POST'
      }
    });
  }
}

async function downloadMediaFiles(mediaUrls: string[]): Promise<ArrayBuffer[]> {
  const downloadPromises = mediaUrls.map(async (url) => {
    console.log('Downloading media from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download media: ${response.statusText}`);
    }
    return response.arrayBuffer();
  });

  return Promise.all(downloadPromises);
}

function determineMediaType(url: string): 'image' | 'video' {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm'];
  
  if (imageExtensions.includes(extension)) return 'image';
  if (videoExtensions.includes(extension)) return 'video';
  
  // Default based on common patterns
  return url.includes('video') || url.includes('.mp4') ? 'video' : 'image';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, mediaUrl, mediaType, mediaUrls } = await req.json();
    
    console.log('TikTok posting request:', { 
      content: content?.substring(0, 100), 
      mediaUrl, 
      mediaType,
      mediaUrls: mediaUrls?.length || 0 
    });
    
    // TikTok requires video or photo content
    if (!mediaUrl && (!mediaUrls || mediaUrls.length === 0)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'TikTok requires media content (video or photos)' 
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

    const title = content?.substring(0, 150) || 'Posted via Social Media Manager';
    const description = content || '';

    // Handle multiple photos (carousel post)
    if (mediaUrls && mediaUrls.length > 0) {
      console.log(`Processing ${mediaUrls.length} photos for carousel post`);

      // Download all photos
      const photoBuffers = await downloadMediaFiles(mediaUrls);
      
      // Validate photo sizes
      const maxPhotoSize = 50 * 1024 * 1024; // 50MB per photo
      const oversizedPhotos = photoBuffers.filter(buffer => buffer.byteLength > maxPhotoSize);
      if (oversizedPhotos.length > 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `${oversizedPhotos.length} photo(s) exceed the 50MB limit` 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Prepare photo metadata
      const photos = photoBuffers.map((buffer, index) => ({
        size: buffer.byteLength,
        format: mediaUrls[index].split('.').pop()?.toLowerCase() || 'jpg'
      }));

      console.log('Initializing TikTok photo upload...');
      const initResult = await apiClient.initializePhotoUpload(accessToken, photos, title, description);
      
      const uploadUrls = initResult.data.upload_urls || [];
      const publishId = initResult.data.publish_id;
      
      console.log('Upload URLs received, Publish ID:', publishId);

      // Upload all photos
      await apiClient.uploadPhotoFiles(uploadUrls, photoBuffers);

      // Publish the photos
      console.log('Publishing photos on TikTok...');
      let publishSuccess = false;
      let publishError: any = null;
      
      try {
        const publishResult = await apiClient.publishContent(accessToken, publishId);
        console.log('Photos published successfully:', publishResult);
        publishSuccess = true;
      } catch (error) {
        console.error('Publish step failed:', error);
        publishError = error;
      }

      // Check final status
      let finalStatus = 'UPLOADED';
      let statusResult: any = null;
      
      try {
        statusResult = await apiClient.checkContentStatus(accessToken, publishId);
        finalStatus = statusResult.data?.status || 'UPLOADED';
        console.log('Final photo post status:', finalStatus, 'Full result:', JSON.stringify(statusResult));
      } catch (statusError) {
        console.error('Status check failed:', statusError);
        
        // If both publish and status check failed, return error
        if (!publishSuccess) {
          throw new Error(`TikTok publish failed: ${publishError?.message || 'Unknown error'}. Status check also failed: ${statusError.message}`);
        }
      }

      // If publish failed but we got here, it means status check worked
      if (!publishSuccess && finalStatus !== 'PUBLISHED' && finalStatus !== 'PROCESSING') {
        throw new Error(`TikTok publish failed: ${publishError?.message || 'Unknown error'}. Current status: ${finalStatus}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            publish_id: publishId,
            status: finalStatus,
            method: 'photo_upload',
            photo_count: photoBuffers.length
          },
          message: finalStatus === 'PUBLISHED' ? 
            `${photoBuffers.length} photos uploaded and published to TikTok successfully!` :
            `${photoBuffers.length} photos uploaded to TikTok successfully and are being processed!`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle single media (video or photo)
    const actualMediaType = mediaType || determineMediaType(mediaUrl);
    
    // Download the media file
    console.log('Downloading media from:', mediaUrl);
    const mediaResponse = await fetch(mediaUrl);
    if (!mediaResponse.ok) {
      throw new Error(`Failed to download media: ${mediaResponse.statusText}`);
    }
    
    const mediaBuffer = await mediaResponse.arrayBuffer();
    const mediaSize = mediaBuffer.byteLength;
    console.log('Media downloaded, size:', mediaSize, 'bytes, type:', actualMediaType);

    if (actualMediaType === 'video') {
      // Handle video upload (existing logic)
      const maxSize = 287 * 1024 * 1024;
      if (mediaSize > maxSize) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Video file too large: ${Math.round(mediaSize / (1024 * 1024))}MB. Maximum allowed: 287MB` 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Try direct URL approach first
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

      // Fallback to file upload method for video
      console.log('Initializing TikTok video upload...');
      const initResult = await apiClient.initializeVideoUpload(accessToken, mediaSize, title, description);
      
      const uploadUrl = initResult.data.upload_url;
      const publishId = initResult.data.publish_id;
      
      console.log('Upload URL received, Publish ID:', publishId);

      // Upload video file
      await apiClient.uploadVideoFile(uploadUrl, mediaBuffer);

      // Publish the video
      console.log('Publishing video on TikTok...');
      let publishSuccess = false;
      let publishError: any = null;
      
      try {
        const publishResult = await apiClient.publishContent(accessToken, publishId);
        console.log('Video published successfully:', publishResult);
        publishSuccess = true;
      } catch (error) {
        console.error('Publish step failed:', error);
        publishError = error;
      }

      // Check final status
      let finalStatus = 'UPLOADED';
      let statusResult: any = null;
      
      try {
        statusResult = await apiClient.checkContentStatus(accessToken, publishId);
        finalStatus = statusResult.data?.status || 'UPLOADED';
        console.log('Final video status:', finalStatus, 'Full result:', JSON.stringify(statusResult));
      } catch (statusError) {
        console.error('Status check failed:', statusError);
        
        // If both publish and status check failed, return error
        if (!publishSuccess) {
          throw new Error(`TikTok publish failed: ${publishError?.message || 'Unknown error'}. Status check also failed: ${statusError.message}`);
        }
      }

      // If publish failed but we got here, it means status check worked
      if (!publishSuccess && finalStatus !== 'PUBLISHED' && finalStatus !== 'PROCESSING') {
        throw new Error(`TikTok publish failed: ${publishError?.message || 'Unknown error'}. Current status: ${finalStatus}`);
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

    } else {
      // Handle single photo upload
      const maxPhotoSize = 50 * 1024 * 1024; // 50MB
      if (mediaSize > maxPhotoSize) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Photo file too large: ${Math.round(mediaSize / (1024 * 1024))}MB. Maximum allowed: 50MB` 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const photoFormat = mediaUrl.split('.').pop()?.toLowerCase() || 'jpg';
      const photos = [{ size: mediaSize, format: photoFormat }];

      console.log('Initializing TikTok single photo upload...');
      const initResult = await apiClient.initializePhotoUpload(accessToken, photos, title, description);
      
      const uploadUrls = initResult.data.upload_urls || [];
      const publishId = initResult.data.publish_id;
      
      console.log('Upload URL received, Publish ID:', publishId);

      // Upload photo
      await apiClient.uploadPhotoFiles(uploadUrls, [mediaBuffer]);

      // Publish the photo
      console.log('Publishing photo on TikTok...');
      let publishSuccess = false;
      let publishError: any = null;
      
      try {
        const publishResult = await apiClient.publishContent(accessToken, publishId);
        console.log('Photo published successfully:', publishResult);
        publishSuccess = true;
      } catch (error) {
        console.error('Publish step failed:', error);
        publishError = error;
      }

      // Check final status
      let finalStatus = 'UPLOADED';
      let statusResult: any = null;
      
      try {
        statusResult = await apiClient.checkContentStatus(accessToken, publishId);
        finalStatus = statusResult.data?.status || 'UPLOADED';
        console.log('Final photo status:', finalStatus, 'Full result:', JSON.stringify(statusResult));
      } catch (statusError) {
        console.error('Status check failed:', statusError);
        
        // If both publish and status check failed, return error
        if (!publishSuccess) {
          throw new Error(`TikTok publish failed: ${publishError?.message || 'Unknown error'}. Status check also failed: ${statusError.message}`);
        }
      }

      // If publish failed but we got here, it means status check worked
      if (!publishSuccess && finalStatus !== 'PUBLISHED' && finalStatus !== 'PROCESSING') {
        throw new Error(`TikTok publish failed: ${publishError?.message || 'Unknown error'}. Current status: ${finalStatus}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            publish_id: publishId,
            status: finalStatus,
            method: 'photo_upload'
          },
          message: finalStatus === 'PUBLISHED' ? 
            'Photo uploaded and published to TikTok successfully!' :
            'Photo uploaded to TikTok successfully and is being processed!'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
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
