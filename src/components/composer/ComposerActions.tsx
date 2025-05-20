
import React from "react";
import { Button } from "../ui/button";
import { Loader2, CalendarCheck2 } from "lucide-react";
import { MediaUploader } from "../MediaUploader";
import { SchedulePicker } from "../SchedulePicker";
import { PlatformConfigDialog } from "../PlatformConfigDialog";
import { format } from "date-fns";

interface ComposerActionsProps {
  isPosting: boolean;
  isContentValid: boolean;
  scheduledAt: Date | null;
  onScheduleChange: (date: Date | null) => void;
  onMediaUpload: (url: string, type: 'image' | 'video') => void;
  onPost: () => void;
}

export const ComposerActions: React.FC<ComposerActionsProps> = ({
  isPosting,
  isContentValid,
  scheduledAt,
  onScheduleChange,
  onMediaUpload,
  onPost
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <MediaUploader onMediaUpload={onMediaUpload} />
        <SchedulePicker onScheduleChange={onScheduleChange} />
        <PlatformConfigDialog />
      </div>
      <div className="flex items-center gap-2">
        {scheduledAt && (
          <div className="text-sm text-muted-foreground flex items-center">
            <CalendarCheck2 className="h-4 w-4 mr-1" />
            <span>Scheduled for: {format(scheduledAt, 'MMM d, h:mm a')}</span>
          </div>
        )}
        <Button 
          onClick={onPost}
          className="bg-purple-600 hover:bg-purple-700"
          disabled={isPosting || !isContentValid}
        >
          {isPosting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {scheduledAt ? 'Scheduling...' : 'Posting...'}
            </>
          ) : (
            scheduledAt ? 'Schedule Post' : 'Post'
          )}
        </Button>
      </div>
    </div>
  );
};
