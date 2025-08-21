
export interface TikTokVideoRequirements {
  format: string[];
  maxSize: number; // in bytes
  maxDuration: number; // in seconds
  minDuration: number; // in seconds
  aspectRatio: string[];
  resolution: {
    min: { width: number; height: number };
    max: { width: number; height: number };
  };
}

export interface TikTokContentGuidelines {
  maxTitleLength: number;
  maxCaptionLength: number;
  prohibitedContent: string[];
  requiredDisclosures: string[];
}

export interface TikTokVideoMetadata {
  duration: number;
  size: number;
  format: string;
  resolution: { width: number; height: number };
  aspectRatio: string;
}

export class TikTokContentAPI {
  private static readonly VIDEO_REQUIREMENTS: TikTokVideoRequirements = {
    format: ['mp4', 'mov', 'mpeg', 'mpg', 'avi', '3gp', 'webm'],
    maxSize: 287 * 1024 * 1024, // 287MB
    maxDuration: 180, // 3 minutes
    minDuration: 1, // 1 second
    aspectRatio: ['9:16', '1:1', '16:9'],
    resolution: {
      min: { width: 720, height: 720 },
      max: { width: 1920, height: 1920 }
    }
  };

  private static readonly CONTENT_GUIDELINES: TikTokContentGuidelines = {
    maxTitleLength: 150,
    maxCaptionLength: 2200,
    prohibitedContent: [
      'violence', 'hate speech', 'harassment', 'spam',
      'misleading information', 'adult content', 'dangerous activities'
    ],
    requiredDisclosures: ['#ad', '#sponsored', '#promotion']
  };

  /**
   * Validate video meets TikTok requirements
   */
  static validateVideo(metadata: TikTokVideoMetadata): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file format
    if (!this.VIDEO_REQUIREMENTS.format.includes(metadata.format.toLowerCase())) {
      errors.push(`Unsupported video format: ${metadata.format}. Supported formats: ${this.VIDEO_REQUIREMENTS.format.join(', ')}`);
    }

    // Check file size
    if (metadata.size > this.VIDEO_REQUIREMENTS.maxSize) {
      errors.push(`Video file too large: ${Math.round(metadata.size / (1024 * 1024))}MB. Maximum allowed: ${Math.round(this.VIDEO_REQUIREMENTS.maxSize / (1024 * 1024))}MB`);
    }

    // Check duration
    if (metadata.duration > this.VIDEO_REQUIREMENTS.maxDuration) {
      errors.push(`Video too long: ${metadata.duration}s. Maximum allowed: ${this.VIDEO_REQUIREMENTS.maxDuration}s`);
    }
    if (metadata.duration < this.VIDEO_REQUIREMENTS.minDuration) {
      errors.push(`Video too short: ${metadata.duration}s. Minimum required: ${this.VIDEO_REQUIREMENTS.minDuration}s`);
    }

    // Check resolution
    const { width, height } = metadata.resolution;
    if (width < this.VIDEO_REQUIREMENTS.resolution.min.width || 
        height < this.VIDEO_REQUIREMENTS.resolution.min.height) {
      errors.push(`Resolution too low: ${width}x${height}. Minimum: ${this.VIDEO_REQUIREMENTS.resolution.min.width}x${this.VIDEO_REQUIREMENTS.resolution.min.height}`);
    }
    if (width > this.VIDEO_REQUIREMENTS.resolution.max.width || 
        height > this.VIDEO_REQUIREMENTS.resolution.max.height) {
      errors.push(`Resolution too high: ${width}x${height}. Maximum: ${this.VIDEO_REQUIREMENTS.resolution.max.width}x${this.VIDEO_REQUIREMENTS.resolution.max.height}`);
    }

    // Check aspect ratio
    const aspectRatio = `${Math.round((width / height) * 16)}:16`;
    if (!this.VIDEO_REQUIREMENTS.aspectRatio.some(ar => ar === aspectRatio)) {
      warnings.push(`Non-optimal aspect ratio: ${aspectRatio}. Recommended: ${this.VIDEO_REQUIREMENTS.aspectRatio.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate content meets TikTok guidelines
   */
  static validateContent(title: string, caption: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check title length
    if (title.length > this.CONTENT_GUIDELINES.maxTitleLength) {
      errors.push(`Title too long: ${title.length} characters. Maximum: ${this.CONTENT_GUIDELINES.maxTitleLength}`);
    }

    // Check caption length
    if (caption.length > this.CONTENT_GUIDELINES.maxCaptionLength) {
      errors.push(`Caption too long: ${caption.length} characters. Maximum: ${this.CONTENT_GUIDELINES.maxCaptionLength}`);
    }

    // Check for prohibited content (basic keyword detection)
    const contentText = `${title} ${caption}`.toLowerCase();
    const foundProhibited = this.CONTENT_GUIDELINES.prohibitedContent.filter(
      term => contentText.includes(term.toLowerCase())
    );
    if (foundProhibited.length > 0) {
      warnings.push(`Content may contain prohibited terms: ${foundProhibited.join(', ')}`);
    }

    // Check for required disclosures for sponsored content
    const hasSponsorship = contentText.includes('sponsor') || 
                          contentText.includes('partner') || 
                          contentText.includes('collab');
    if (hasSponsorship) {
      const hasDisclosure = this.CONTENT_GUIDELINES.requiredDisclosures.some(
        disclosure => contentText.includes(disclosure.toLowerCase())
      );
      if (!hasDisclosure) {
        warnings.push(`Sponsored content should include disclosure: ${this.CONTENT_GUIDELINES.requiredDisclosures.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get video requirements for display
   */
  static getVideoRequirements(): TikTokVideoRequirements {
    return { ...this.VIDEO_REQUIREMENTS };
  }

  /**
   * Get content guidelines for display
   */
  static getContentGuidelines(): TikTokContentGuidelines {
    return { ...this.CONTENT_GUIDELINES };
  }
}
