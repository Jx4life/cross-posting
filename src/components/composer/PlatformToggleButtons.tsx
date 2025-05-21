
import React from "react";
import { Toggle } from "../ui/toggle";
import { cn } from "@/lib/utils";
import { 
  Facebook, 
  Instagram,
  Youtube,
  X
} from "lucide-react";
import { PlatformSettings } from "@/types/platform";

interface PlatformToggleButtonsProps {
  platforms: PlatformSettings;
  onChange: (platforms: PlatformSettings) => void;
}

const TiktokIcon = (props: any) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" {...props}>
    <path
      d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.9 2.9 0 01.88.13V9.4a6.18 6.18 0 00-1-.08A6.26 6.26 0 002 15.58a6.26 6.26 0 009.39 5.43 6.12 6.12 0 002.27-4.8V7.83a8.24 8.24 0 005.83 2.29V6.69a4.67 4.67 0 01-.9-.08z"
      fill="currentColor"
    />
  </svg>
);

export const PlatformToggleButtons: React.FC<PlatformToggleButtonsProps> = ({
  platforms,
  onChange
}) => {
  // Create local handlers that update the platforms object
  const handlePlatformToggle = (platform: keyof PlatformSettings, enabled: boolean) => {
    onChange({
      ...platforms,
      [platform]: enabled
    });
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-wrap gap-2">
        <Toggle 
          pressed={platforms.twitter}
          onPressedChange={(enabled) => handlePlatformToggle('twitter', enabled)}
          className={cn(
            "border-[1px] border-gray-300 dark:border-gray-700 flex items-center gap-1.5",
            "data-[state=on]:bg-black data-[state=on]:text-white data-[state=on]:border-black"
          )}
        >
          <X className="h-4 w-4" />
          <span>X</span>
        </Toggle>
        
        <Toggle 
          pressed={platforms.lens}
          onPressedChange={(enabled) => handlePlatformToggle('lens', enabled)}
          className={cn(
            "border-[1px] border-gray-300 dark:border-gray-700 flex items-center gap-1.5",
            "data-[state=on]:bg-[#00501E] data-[state=on]:text-white data-[state=on]:border-[#00501E]"
          )}
        >
          <svg viewBox="0 0 32 32" className="h-4 w-4">
            <path 
              d="M12.9,9.9c2.1-1.3,4.9-1.3,6.9,0.1c3.1,2.2,4.1,6.2,2.4,9.8c-1.7,3.5-5.4,5.4-9.7,4.1c-1.2-0.4-2.7,0.4-3.1,1.6c-0.1,0.3-0.1,0.7,0,1.1c0.3,0.8,1.1,1.3,1.9,1.2c8.8-1.8,16.2-9.5,16.2-20c0-4.2-1.3-7.7-3.9-10.4C19.8-0.3,13.9-0.5,9.7,1.7c-4.2,2.2-6.8,6.5-6.8,11.4c0,7.3,6,13.3,13.3,13.3c0.7,0,1.3-0.6,1.3-1.3c0-0.7-0.6-1.3-1.3-1.3c-5.8,0-10.7-4.8-10.7-10.7c0-3.8,1.9-7.2,5.1-9C13.9,3,17.6,3.1,20.5,5c1.9,2,2.9,4.6,2.9,8c0,8.5-5.4,14.8-13.2,16.1c0,0-0.1,0-0.1,0c0-0.1,0-0.1-0.1-0.2C9.8,28.7,9.5,28.7,9.3,29c-0.6,0.9-0.5,2.2,0.4,2.8c0.3,0.2,0.7,0.3,1.1,0.3c1.2-0.1,2.1-1.1,2-2.3c-0.1-1.1-1-2-2.1-2.1c-0.1,0-0.3,0-0.4,0c6.1,0,11.5-3,13.8-7.7c2.3-4.7,1-10.1-3.1-13c-2.7-1.9-6.4-1.9-9.1-0.1L12.9,9.9z" 
              fill="currentColor"
            />
          </svg>
          <span>Lens</span>
        </Toggle>
        
        <Toggle 
          pressed={platforms.farcaster}
          onPressedChange={(enabled) => handlePlatformToggle('farcaster', enabled)}
          className={cn(
            "border-[1px] border-gray-300 dark:border-gray-700 flex items-center gap-1.5",
            "data-[state=on]:bg-[#8B5CF6] data-[state=on]:text-white data-[state=on]:border-[#8B5CF6]"
          )}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path 
              d="M12,1.5c5.8,0,10.5,4.7,10.5,10.5S17.8,22.5,12,22.5S1.5,17.8,1.5,12S6.2,1.5,12,1.5z M12,4.5c-4.1,0-7.5,3.4-7.5,7.5 s3.4,7.5,7.5,7.5s7.5-3.4,7.5-7.5S16.1,4.5,12,4.5z M7.9,11.4c0.2-0.2,0.5-0.2,0.7,0l2.8,2.8l2.8-2.8c0.2-0.2,0.5-0.2,0.7,0 c0.2,0.2,0.2,0.5,0,0.7l-3.2,3.2c-0.2,0.2-0.5,0.2-0.7,0L7.9,12.1C7.7,11.9,7.7,11.6,7.9,11.4z M7.9,8.4c0.2-0.2,0.5-0.2,0.7,0 l2.8,2.8l2.8-2.8c0.2-0.2,0.5-0.2,0.7,0c0.2,0.2,0.2,0.5,0,0.7l-3.2,3.2c-0.2,0.2-0.5,0.2-0.7,0L7.9,9.1C7.7,8.9,7.7,8.6,7.9,8.4z" 
              fill="currentColor"
            />
          </svg>
          <span>Farcaster</span>
        </Toggle>
        
        <Toggle 
          pressed={platforms.facebook}
          onPressedChange={(enabled) => handlePlatformToggle('facebook', enabled)}
          className={cn(
            "border-[1px] border-gray-300 dark:border-gray-700 flex items-center gap-1.5",
            "data-[state=on]:bg-[#1877F2] data-[state=on]:text-white data-[state=on]:border-[#1877F2]"
          )}
        >
          <Facebook className="h-4 w-4" />
          <span>Facebook</span>
        </Toggle>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Toggle 
          pressed={platforms.instagram}
          onPressedChange={(enabled) => handlePlatformToggle('instagram', enabled)}
          className={cn(
            "border-[1px] border-gray-300 dark:border-gray-700 flex items-center gap-1.5",
            "data-[state=on]:bg-gradient-to-r data-[state=on]:from-[#833AB4] data-[state=on]:via-[#FD1D1D] data-[state=on]:to-[#FCAF45] data-[state=on]:text-white data-[state=on]:border-transparent"
          )}
        >
          <Instagram className="h-4 w-4" />
          <span>Instagram</span>
        </Toggle>
        
        <Toggle 
          pressed={platforms.tiktok}
          onPressedChange={(enabled) => handlePlatformToggle('tiktok', enabled)}
          className={cn(
            "border-[1px] border-gray-300 dark:border-gray-700 flex items-center gap-1.5",
            "data-[state=on]:bg-black data-[state=on]:text-white data-[state=on]:border-black"
          )}
        >
          <TiktokIcon />
          <span>TikTok</span>
        </Toggle>
        
        <Toggle 
          pressed={platforms.youtubeShorts}
          onPressedChange={(enabled) => handlePlatformToggle('youtubeShorts', enabled)}
          className={cn(
            "border-[1px] border-gray-300 dark:border-gray-700 flex items-center gap-1.5",
            "data-[state=on]:bg-[#FF0000] data-[state=on]:text-white data-[state=on]:border-[#FF0000]"
          )}
        >
          <Youtube className="h-4 w-4" />
          <span>YouTube</span>
        </Toggle>
      </div>
    </div>
  );
};
