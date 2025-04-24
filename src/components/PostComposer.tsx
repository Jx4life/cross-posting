
import React, { useState } from "react";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Toggle } from "./ui/toggle";
import { PlatformConfigDialog } from "./PlatformConfigDialog";
import { usePostConfigurations } from "@/hooks/usePostConfigurations";
import { usePostIntegrations } from "@/hooks/usePostIntegrations";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SchedulePicker } from "./SchedulePicker";

export const PostComposer = () => {
  const [content, setContent] = useState("");
  const [isTwitterEnabled, setIsTwitterEnabled] = useState(true);
  const [isLensEnabled, setIsLensEnabled] = useState(true);
  const [isFarcasterEnabled, setIsFarcasterEnabled] = useState(true);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const { data: configurations } = usePostConfigurations();
  const { isPosting, crossPost, schedulePost } = usePostIntegrations();

  const handlePost = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content to post");
      return;
    }

    // If scheduled, use schedulePost instead of crossPost
    if (scheduledAt) {
      const results = await schedulePost(content, {
        twitter: isTwitterEnabled,
        lens: isLensEnabled,
        farcaster: isFarcasterEnabled
      }, scheduledAt);
      
      if (results.success) {
        toast.success(`Post scheduled for ${scheduledAt.toLocaleString()}`);
        setContent(""); // Clear content after scheduling
        setScheduledAt(null); // Reset schedule
      }
    } else {
      const results = await crossPost(content, {
        twitter: isTwitterEnabled,
        lens: isLensEnabled,
        farcaster: isFarcasterEnabled
      });
      
      if (results.some(result => result.success)) {
        setContent(""); // Clear content if at least one platform was successful
      }
    }
  };

  const maxLength = 280; // Twitter character limit
  const remainingChars = maxLength - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <Card className="w-full max-w-2xl p-6 bg-white/5 backdrop-blur-sm border-purple-500/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Toggle 
              pressed={isTwitterEnabled}
              onPressedChange={setIsTwitterEnabled}
              className="data-[state=on]:bg-blue-500"
            >
              Twitter
            </Toggle>
            <Toggle 
              pressed={isLensEnabled}
              onPressedChange={setIsLensEnabled}
              className="data-[state=on]:bg-green-500"
            >
              Lens
            </Toggle>
            <Toggle 
              pressed={isFarcasterEnabled}
              onPressedChange={setIsFarcasterEnabled}
              className="data-[state=on]:bg-purple-500"
            >
              Farcaster
            </Toggle>
          </div>
          <PlatformConfigDialog />
        </div>
        
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`min-h-[150px] bg-white/10 border-purple-500/20 ${isOverLimit ? 'border-red-500' : ''}`}
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`text-sm ${isOverLimit ? 'text-red-400' : 'text-gray-400'}`}>
              {remainingChars} characters remaining
            </div>
            <SchedulePicker onScheduleChange={setScheduledAt} />
          </div>
          <Button 
            onClick={handlePost}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={isPosting || isOverLimit || !content.trim()}
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
    </Card>
  );
};
