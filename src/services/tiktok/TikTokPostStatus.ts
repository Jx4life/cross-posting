
export type TikTokPostStatus = 'PROCESSING_DOWNLOAD' | 'PROCESSING_UPLOAD' | 'PROCESSING_PUBLISH' | 'PUBLISHED' | 'FAILED';

export interface TikTokPostStatusInfo {
  status: TikTokPostStatus;
  progress?: number; // 0-100
  message?: string;
  error?: string;
  shareUrl?: string;
  publishId?: string;
}

export class TikTokPostStatusTracker {
  private status: TikTokPostStatus = 'PROCESSING_DOWNLOAD';
  private progress: number = 0;
  private message: string = '';
  private error?: string;
  private shareUrl?: string;
  private publishId?: string;
  private callbacks: ((status: TikTokPostStatusInfo) => void)[] = [];

  constructor(publishId?: string) {
    this.publishId = publishId;
  }

  /**
   * Update the status and notify listeners
   */
  updateStatus(
    status: TikTokPostStatus, 
    options: {
      progress?: number;
      message?: string;
      error?: string;
      shareUrl?: string;
    } = {}
  ) {
    this.status = status;
    if (options.progress !== undefined) this.progress = options.progress;
    if (options.message) this.message = options.message;
    if (options.error) this.error = options.error;
    if (options.shareUrl) this.shareUrl = options.shareUrl;

    this.notifyListeners();
  }

  /**
   * Add a callback to be notified of status changes
   */
  onStatusChange(callback: (status: TikTokPostStatusInfo) => void) {
    this.callbacks.push(callback);
    // Immediately notify with current status
    callback(this.getCurrentStatus());
  }

  /**
   * Get current status information
   */
  getCurrentStatus(): TikTokPostStatusInfo {
    return {
      status: this.status,
      progress: this.progress,
      message: this.message,
      error: this.error,
      shareUrl: this.shareUrl,
      publishId: this.publishId
    };
  }

  /**
   * Check if the post is complete (success or failure)
   */
  isComplete(): boolean {
    return this.status === 'PUBLISHED' || this.status === 'FAILED';
  }

  /**
   * Check if the post was successful
   */
  isSuccess(): boolean {
    return this.status === 'PUBLISHED';
  }

  private notifyListeners() {
    const currentStatus = this.getCurrentStatus();
    this.callbacks.forEach(callback => {
      try {
        callback(currentStatus);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    });
  }
}
