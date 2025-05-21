
import React from "react";
import { Button } from "../ui/button";
import { Loader2, CalendarCheck2 } from "lucide-react";
import { MediaUploader } from "../MediaUploader";
import { SchedulePicker } from "../SchedulePicker";
import { PlatformConfigDialog } from "../PlatformConfigDialog";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  
  return (
    <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex items-center justify-between'}`}>
      <div className="flex items-center space-x-2">
        <MediaUploader onMediaUpload={onMediaUpload} />
        <SchedulePicker onScheduleChange={onScheduleChange} />
        <PlatformConfigDialog />
      </div>
      
      <div className="flex items-center gap-2 mt-2 md:mt-0">
        {scheduledAt && !isMobile && (
          <div className="text-xs md:text-sm text-muted-foreground flex items-center">
            <CalendarCheck2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            <span>Scheduled for: {format(scheduledAt, 'MMM d, h:mm a')}</span>
          </div>
        )}
        
        <Button 
          onClick={onPost}
          className={`bg-purple-600 hover:bg-purple-700 ${isMobile ? 'w-full' : ''}`}
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
      
      {scheduledAt && isMobile && (
        <div className="text-xs text-center text-muted-foreground flex items-center justify-center">
          <CalendarCheck2 className="h-3 w-3 mr-1" />
          <span>Scheduled for: {format(scheduledAt, 'MMM d, h:mm a')}</span>
        </div>
      )}
    </div>
  );
};
