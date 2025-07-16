
import React from "react";
import { Button } from "@/components/ui/button";
import { MediaUploader } from "@/components/MediaUploader";
import { SchedulePicker } from "@/components/SchedulePicker";
import { Send, Clock } from "lucide-react";

interface ComposerActionsProps {
  isPosting: boolean;
  isContentValid: boolean;
  scheduledAt: Date | null;
  onScheduleChange: (date: Date | null) => void;
  onMediaUpload: (url: string, type: 'image' | 'video') => void;
  onPhotosUpload?: (urls: string[]) => void;
  onPost: () => void;
  supportBatchPhotos?: boolean;
}

export const ComposerActions: React.FC<ComposerActionsProps> = ({
  isPosting,
  isContentValid,
  scheduledAt,
  onScheduleChange,
  onMediaUpload,
  onPhotosUpload,
  onPost,
  supportBatchPhotos = false
}) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <MediaUploader 
            onMediaUpload={onMediaUpload}
            onPhotosUpload={onPhotosUpload}
            supportBatchPhotos={supportBatchPhotos}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <SchedulePicker
            scheduledTime={scheduledAt}
            onScheduleChange={onScheduleChange}
          />
          
          <Button
            onClick={onPost}
            disabled={!isContentValid || isPosting}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6 py-2"
          >
            {isPosting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Posting...
              </>
            ) : scheduledAt ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Schedule Post
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post Now
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
