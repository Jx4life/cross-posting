
import React, { useState } from "react";
import { Card } from "./ui/card";
import { toast } from "@/components/ui/use-toast";
import { usePostConfigurations } from "@/hooks/usePostConfigurations";
import { usePostIntegrations } from "@/hooks/usePostIntegrations";
import { PlatformToggleButtons } from "./composer/PlatformToggleButtons";
import { ContentEditor } from "./composer/ContentEditor";
import { MediaPreview } from "./composer/MediaPreview";
import { ComposerActions } from "./composer/ComposerActions";
import { PlatformSettings } from "@/types/platform";
import { useIsMobile } from "@/hooks/use-mobile";

export const PostComposer = () => {
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<PlatformSettings>({
    twitter: true,
    lens: true,
    farcaster: true,
    facebook: true,
    instagram: false,
    tiktok: true,
    youtubeShorts: false
  });
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const { data: configurations } = usePostConfigurations();
  const { isPosting, crossPost, schedulePost } = usePostIntegrations();
  const isMobile = useIsMobile();

  const handleMediaUpload = (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
    // Clear photo carousel when single media is uploaded
    setPhotoUrls([]);
  };

  const handlePhotosUpload = (urls: string[]) => {
    setPhotoUrls(urls);
    // Clear single media when photo carousel is uploaded
    setMediaUrl(null);
    setMediaType(null);
  };

  const handlePost = async () => {
    const hasContent = content.trim();
    const hasSingleMedia = mediaUrl && mediaType;
    const hasPhotoCarousel = photoUrls.length > 0;
    
    if (!hasContent && !hasSingleMedia && !hasPhotoCarousel) {
      toast({
        title: "Missing Content",
        description: "Please enter some content or upload media",
        variant: "destructive"
      });
      return;
    }

    // Prepare media data for posting
    let postMediaUrl = mediaUrl;
    let postMediaType = mediaType;
    let postMediaUrls = photoUrls.length > 0 ? photoUrls : undefined;

    // If scheduled, use schedulePost instead of crossPost
    if (scheduledAt) {
      const results = await schedulePost(
        content, 
        platforms, 
        scheduledAt, 
        postMediaUrl, 
        postMediaType,
        postMediaUrls
      );
      
      if (results.success) {
        toast({
          title: "Post Scheduled",
          description: `Post scheduled for ${scheduledAt.toLocaleString()}`,
        });
        resetForm();
      }
    } else {
      const results = await crossPost(
        content, 
        platforms, 
        postMediaUrl, 
        postMediaType,
        postMediaUrls
      );
      
      if (results.some(result => result.success)) {
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setContent("");
    setMediaUrl(null);
    setMediaType(null);
    setPhotoUrls([]);
    setScheduledAt(null);
  };

  const isContentValid = Boolean(
    (content.trim() || mediaUrl || photoUrls.length > 0) && 
    content.length <= 280
  );

  const hasMedia = mediaUrl || photoUrls.length > 0;

  return (
    <Card className="w-full max-w-2xl p-4 md:p-6 bg-white/5 backdrop-blur-sm border-purple-500/20">
      <div className="space-y-4">
        <PlatformToggleButtons 
          platforms={platforms}
          onChange={setPlatforms}
        />
        
        <ContentEditor 
          content={content}
          setContent={setContent}
        />
        
        {mediaUrl && (
          <MediaPreview 
            mediaUrl={mediaUrl}
            mediaType={mediaType}
            size={isMobile ? 'sm' : 'md'}
          />
        )}
        
        {photoUrls.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Photo Carousel ({photoUrls.length} photos)
            </p>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {photoUrls.slice(0, 8).map((url, index) => (
                <img 
                  key={index}
                  src={url} 
                  alt={`Photo ${index + 1}`}
                  className="w-full h-20 object-cover rounded-md"
                />
              ))}
              {photoUrls.length > 8 && (
                <div className="w-full h-20 bg-gray-200 rounded-md flex items-center justify-center text-sm text-gray-600">
                  +{photoUrls.length - 8} more
                </div>
              )}
            </div>
          </div>
        )}
        
        <ComposerActions 
          isPosting={isPosting}
          isContentValid={isContentValid}
          scheduledAt={scheduledAt}
          onScheduleChange={setScheduledAt}
          onMediaUpload={handleMediaUpload}
          onPhotosUpload={handlePhotosUpload}
          onPost={handlePost}
          supportBatchPhotos={platforms.tiktok}
        />
      </div>
    </Card>
  );
};
