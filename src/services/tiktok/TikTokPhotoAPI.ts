
export interface TikTokPhotoRequirements {
  format: string[];
  maxSize: number; // in bytes per photo
  maxCount: number; // maximum photos in carousel
  minCount: number; // minimum photos in carousel
  resolution: {
    min: { width: number; height: number };
    max: { width: number; height: number };
  };
  aspectRatio: string[];
}

export interface TikTokPhotoMetadata {
  size: number;
  format: string;
  resolution: { width: number; height: number };
  aspectRatio: string;
}

export class TikTokPhotoAPI {
  private static readonly PHOTO_REQUIREMENTS: TikTokPhotoRequirements = {
    format: ['jpg', 'jpeg', 'png', 'webp'],
    maxSize: 50 * 1024 * 1024, // 50MB per photo
    maxCount: 35, // TikTok allows up to 35 photos in carousel
    minCount: 1,
    resolution: {
      min: { width: 720, height: 720 },
      max: { width: 20480, height: 20480 }
    },
    aspectRatio: ['1:1', '9:16', '16:9', '3:4', '4:3']
  };

  /**
   * Validate photos meet TikTok requirements
   */
  static validatePhotos(photos: TikTokPhotoMetadata[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check photo count
    if (photos.length < this.PHOTO_REQUIREMENTS.minCount) {
      errors.push(`Too few photos: ${photos.length}. Minimum required: ${this.PHOTO_REQUIREMENTS.minCount}`);
    }
    if (photos.length > this.PHOTO_REQUIREMENTS.maxCount) {
      errors.push(`Too many photos: ${photos.length}. Maximum allowed: ${this.PHOTO_REQUIREMENTS.maxCount}`);
    }

    // Validate each photo
    photos.forEach((photo, index) => {
      const photoNum = index + 1;

      // Check file format
      if (!this.PHOTO_REQUIREMENTS.format.includes(photo.format.toLowerCase())) {
        errors.push(`Photo ${photoNum}: Unsupported format ${photo.format}. Supported: ${this.PHOTO_REQUIREMENTS.format.join(', ')}`);
      }

      // Check file size
      if (photo.size > this.PHOTO_REQUIREMENTS.maxSize) {
        errors.push(`Photo ${photoNum}: File too large ${Math.round(photo.size / (1024 * 1024))}MB. Maximum: ${Math.round(this.PHOTO_REQUIREMENTS.maxSize / (1024 * 1024))}MB`);
      }

      // Check resolution
      const { width, height } = photo.resolution;
      if (width < this.PHOTO_REQUIREMENTS.resolution.min.width || 
          height < this.PHOTO_REQUIREMENTS.resolution.min.height) {
        errors.push(`Photo ${photoNum}: Resolution too low ${width}x${height}. Minimum: ${this.PHOTO_REQUIREMENTS.resolution.min.width}x${this.PHOTO_REQUIREMENTS.resolution.min.height}`);
      }
      if (width > this.PHOTO_REQUIREMENTS.resolution.max.width || 
          height > this.PHOTO_REQUIREMENTS.resolution.max.height) {
        errors.push(`Photo ${photoNum}: Resolution too high ${width}x${height}. Maximum: ${this.PHOTO_REQUIREMENTS.resolution.max.width}x${this.PHOTO_REQUIREMENTS.resolution.max.height}`);
      }

      // Check aspect ratio
      const aspectRatio = width > height ? `${Math.round((width/height) * 16)}:16` : `16:${Math.round((height/width) * 16)}`;
      if (!this.PHOTO_REQUIREMENTS.aspectRatio.some(ar => ar === aspectRatio)) {
        warnings.push(`Photo ${photoNum}: Non-optimal aspect ratio ${aspectRatio}. Recommended: ${this.PHOTO_REQUIREMENTS.aspectRatio.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get photo requirements for display
   */
  static getPhotoRequirements(): TikTokPhotoRequirements {
    return { ...this.PHOTO_REQUIREMENTS };
  }

  /**
   * Extract photo metadata from file
   */
  static async extractPhotoMetadata(file: File): Promise<TikTokPhotoMetadata> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          size: file.size,
          format: file.name.split('.').pop()?.toLowerCase() || 'unknown',
          resolution: { width: img.width, height: img.height },
          aspectRatio: `${img.width}:${img.height}`
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}
