
export interface PlatformSettings {
  twitter: boolean;
  lens: boolean;
  farcaster: boolean;
  facebook: boolean;
  instagram: boolean;
  tiktok: boolean;
  youtubeShorts: boolean;
}

export interface SchedulePostResult {
  success: boolean;
  message: string;
  id?: string;
}
