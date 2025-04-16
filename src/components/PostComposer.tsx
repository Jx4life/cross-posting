
import React, { useState } from "react";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Toggle } from "./ui/toggle";
import { PlatformConfigDialog } from "./PlatformConfigDialog";
import { usePostConfigurations } from "@/hooks/usePostConfigurations";
import { toast } from "sonner";

export const PostComposer = () => {
  const [content, setContent] = useState("");
  const [isTwitterEnabled, setIsTwitterEnabled] = useState(true);
  const [isLensEnabled, setIsLensEnabled] = useState(true);
  const [isFarcasterEnabled, setIsFarcasterEnabled] = useState(true);
  const { data: configurations } = usePostConfigurations();

  const handlePost = () => {
    if (!content.trim()) {
      toast.error("Please enter some content to post");
      return;
    }

    // This will be implemented when we add posting functionality
    console.log("Posting to platforms:", { 
      content, 
      isTwitterEnabled, 
      isLensEnabled, 
      isFarcasterEnabled,
      configurations 
    });
    toast.success("Post created! Cross-posting coming soon.");
  };

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
          className="min-h-[150px] bg-white/10 border-purple-500/20"
        />
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {280 - content.length} characters remaining
          </div>
          <Button 
            onClick={handlePost}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Post
          </Button>
        </div>
      </div>
    </Card>
  );
};
