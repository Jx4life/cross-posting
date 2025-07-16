import { TikTokConfig, TikTokTokenResponse, TikTokUserInfo } from './TikTokAPI';

export interface TikTokAPIError {
  code: string;
  message: string;
  details?: any;
}

export interface TikTokVideoUploadSession {
  publish_id: string;
  upload_url: string;
}

export interface TikTokPhotoUploadSession {
  publish_id: string;
  upload_urls: string[];
}

export interface TikTokPublishRequest {
  post_info: {
    title: string;
    description?: string;
    privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
    disable_duet?: boolean;
    disable_comment?: boolean;
    disable_stitch?: boolean;
    video_cover_timestamp_ms?: number;
    brand_content_toggle?: boolean;
    brand_organic_toggle?: boolean;
  };
  source_info: {
    source: 'FILE_UPLOAD' | 'PULL_FROM_URL';
    video_size?: number;
    chunk_size?: number;
    total_chunk_count?: number;
    video_url?: string;
    photo_count?: number;
    photos?: Array<{
      photo_size: number;
      photo_format: string;
    }>;
  };
}

export interface TikTokPublishResponse {
  data: {
    publish_id: string;
    upload_url?: string;
    upload_urls?: string[];
  };
  error?: TikTokAPIError;
}

export interface TikTokStatusCheckResponse {
  data: {
    status: 'PROCESSING_DOWNLOAD' | 'PROCESSING_UPLOAD' | 'PROCESSING_PUBLISH' | 'PUBLISHED' | 'FAILED';
    fail_reason?: string;
    uploaded_bytes?: number;
    total_bytes?: number;
  };
  error?: TikTokAPIError;
}

export class TikTokAPIClient {
  private config: TikTokConfig;
  private baseUrl = 'https://open.tiktokapis.com';
  
  constructor(config: TikTokConfig) {
    this.config = config;
  }

  /**
   * Make authenticated API request with proper error handling
   */
  private async makeAPIRequest<T>(
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
    console.log(`TikTok API response (${response.status}):`, responseText);

    // Check if response is HTML (error page)
    if (responseText.trim().startsWith('<')) {
      throw new Error(`TikTok API returned HTML error page. Status: ${response.status}`);
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response from TikTok API: ${responseText}`);
    }

    if (!response.ok) {
      const error: TikTokAPIError = {
        code: data.error?.code || 'UNKNOWN_ERROR',
        message: data.error?.message || data.error_description || `HTTP ${response.status}`,
        details: data
      };
      throw error;
    }

    if (data.error) {
      const error: TikTokAPIError = {
        code: data.error.code || 'API_ERROR',
        message: data.error.message || 'Unknown API error',
        details: data.error
      };
      throw error;
    }

    return data;
  }

  /**
   * Initialize video upload session
   */
  async initializeVideoUpload(
    accessToken: string,
    request: TikTokPublishRequest
  ): Promise<TikTokVideoUploadSession> {
    const response = await this.makeAPIRequest<TikTokPublishResponse>(
      '/v2/post/publish/video/init/',
      {
        method: 'POST',
        accessToken,
        body: request
      }
    );

    // Handle the case where upload_url might not be in the response
    return {
      publish_id: response.data.publish_id,
      upload_url: response.data.upload_url || ''
    };
  }

  /**
   * Initialize photo upload session
   */
  async initializePhotoUpload(
    accessToken: string,
    photos: Array<{ size: number; format: string }>,
    title: string,
    description?: string
  ): Promise<TikTokPhotoUploadSession> {
    const request: TikTokPublishRequest = {
      post_info: {
        title,
        description: description || '',
        privacy_level: 'SELF_ONLY',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        photo_count: photos.length,
        photos: photos.map(photo => ({
          photo_size: photo.size,
          photo_format: photo.format
        }))
      }
    };

    const response = await this.makeAPIRequest<TikTokPublishResponse>(
      '/v2/post/publish/photo/init/',
      {
        method: 'POST',
        accessToken,
        body: request
      }
    );

    return {
      publish_id: response.data.publish_id,
      upload_urls: response.data.upload_urls || []
    };
  }

  /**
   * Upload video file to TikTok's servers
   */
  async uploadVideoFile(
    uploadUrl: string,
    videoBuffer: ArrayBuffer,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    console.log(`Uploading video file (${videoBuffer.byteLength} bytes) to: ${uploadUrl}`);

    // For large files, we might want to implement chunked upload
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

    if (onProgress) {
      onProgress(100);
    }

    console.log('Video upload completed successfully');
  }

  /**
   * Upload photo files to TikTok's servers
   */
  async uploadPhotoFiles(
    uploadUrls: string[],
    photoBuffers: ArrayBuffer[],
    onProgress?: (progress: number) => void
  ): Promise<void> {
    console.log(`Uploading ${photoBuffers.length} photos`);

    if (uploadUrls.length !== photoBuffers.length) {
      throw new Error('Mismatch between upload URLs and photo buffers');
    }

    const uploadPromises = uploadUrls.map(async (uploadUrl, index) => {
      const photoBuffer = photoBuffers[index];
      console.log(`Uploading photo ${index + 1} (${photoBuffer.byteLength} bytes)`);

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes 0-${photoBuffer.byteLength - 1}/${photoBuffer.byteLength}`,
          'Content-Length': photoBuffer.byteLength.toString(),
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

    if (onProgress) {
      onProgress(100);
    }

    console.log('All photos uploaded successfully');
  }

  /**
   * Publish the uploaded content (video or photos)
   */
  async publishContent(
    accessToken: string,
    publishId: string
  ): Promise<void> {
    await this.makeAPIRequest(
      '/v2/post/publish/',
      {
        method: 'POST',
        accessToken,
        body: { publish_id: publishId }
      }
    );
  }

  /**
   * Check the status of a published video
   */
  async checkVideoStatus(
    accessToken: string,
    publishId: string
  ): Promise<TikTokStatusCheckResponse> {
    return this.makeAPIRequest<TikTokStatusCheckResponse>(
      '/v2/post/publish/status/fetch/',
      {
        method: 'POST',
        accessToken,
        body: { publish_id: publishId }
      }
    );
  }

  /**
   * Get user information
   */
  async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    const response = await this.makeAPIRequest<{ data: { user: TikTokUserInfo } }>(
      '/v2/user/info/',
      {
        method: 'POST',
        accessToken,
        body: {
          fields: ['open_id', 'union_id', 'avatar_url', 'display_name', 'username']
        }
      }
    );

    return response.data.user;
  }

  /**
   * Create post using direct URL method (alternative approach for videos)
   */
  async createPostFromURL(
    accessToken: string,
    videoUrl: string,
    title: string,
    description?: string
  ): Promise<TikTokPublishResponse> {
    return this.makeAPIRequest<TikTokPublishResponse>(
      '/v2/post/publish/content/init/',
      {
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
      }
    );
  }
}
