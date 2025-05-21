
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
  const [platforms, setPlatforms] = useState<PlatformSettings>({
    twitter: true,
    lens: true,
    farcaster: true,
    facebook: false,
    instagram: false,
    tiktok: false,
    youtubeShorts: false
  });
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const { data: configurations } = usePostConfigurations();
  const { isPosting, crossPost, schedulePost } = usePostIntegrations();
  const isMobile = useIsMobile();

  const handleMediaUpload = (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaUrl) {
      toast({
        title: "Missing Content",
        description: "Please enter some content or upload media",
        variant: "destructive"
      });
      return;
    }

    // If scheduled, use schedulePost instead of crossPost
    if (scheduledAt) {
      const results = await schedulePost(content, platforms, scheduledAt, mediaUrl, mediaType);
      
      if (results.success) {
        toast({
          title: "Post Scheduled",
          description: `Post scheduled for ${scheduledAt.toLocaleString()}`,
        });
        resetForm();
      }
    } else {
      const results = await crossPost(content, platforms, mediaUrl, mediaType);
      
      if (results.some(result => result.success)) {
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setContent("");
    setMediaUrl(null);
    setMediaType(null);
    setScheduledAt(null);
  };

  const isContentValid = Boolean((content.trim() || mediaUrl) && content.length <= 280);

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
        
        <ComposerActions 
          isPosting={isPosting}
          isContentValid={isContentValid}
          scheduledAt={scheduledAt}
          onScheduleChange={setScheduledAt}
          onMediaUpload={handleMediaUpload}
          onPost={handlePost}
        />
      </div>
    </Card>
  );
};
