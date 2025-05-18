
import React from "react";
import { Toggle } from "../ui/toggle";

interface PlatformToggleButtonsProps {
  isTwitterEnabled: boolean;
  setIsTwitterEnabled: (enabled: boolean) => void;
  isLensEnabled: boolean;
  setIsLensEnabled: (enabled: boolean) => void;
  isFarcasterEnabled: boolean;
  setIsFarcasterEnabled: (enabled: boolean) => void;
  isFacebookEnabled: boolean;
  setIsFacebookEnabled: (enabled: boolean) => void;
  isInstagramEnabled: boolean;
  setIsInstagramEnabled: (enabled: boolean) => void;
  isTikTokEnabled: boolean;
  setIsTikTokEnabled: (enabled: boolean) => void;
  isYouTubeShortsEnabled: boolean;
  setIsYouTubeShortsEnabled: (enabled: boolean) => void;
}

export const PlatformToggleButtons: React.FC<PlatformToggleButtonsProps> = ({
  isTwitterEnabled,
  setIsTwitterEnabled,
  isLensEnabled,
  setIsLensEnabled,
  isFarcasterEnabled,
  setIsFarcasterEnabled,
  isFacebookEnabled,
  setIsFacebookEnabled,
  isInstagramEnabled,
  setIsInstagramEnabled,
  isTikTokEnabled,
  setIsTikTokEnabled,
  isYouTubeShortsEnabled,
  setIsYouTubeShortsEnabled
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-wrap gap-2">
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
        <Toggle 
          pressed={isFacebookEnabled}
          onPressedChange={setIsFacebookEnabled}
          className="data-[state=on]:bg-blue-700"
        >
          Facebook
        </Toggle>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Toggle 
          pressed={isInstagramEnabled}
          onPressedChange={setIsInstagramEnabled}
          className="data-[state=on]:bg-pink-600"
        >
          Instagram
        </Toggle>
        <Toggle 
          pressed={isTikTokEnabled}
          onPressedChange={setIsTikTokEnabled}
          className="data-[state=on]:bg-black"
        >
          TikTok
        </Toggle>
        <Toggle 
          pressed={isYouTubeShortsEnabled}
          onPressedChange={setIsYouTubeShortsEnabled}
          className="data-[state=on]:bg-red-600"
        >
          YouTube Shorts
        </Toggle>
      </div>
    </div>
  );
};
