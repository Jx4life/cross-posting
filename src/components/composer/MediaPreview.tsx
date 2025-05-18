
import React from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface MediaPreviewProps {
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  size?: 'sm' | 'md' | 'lg';
  onRemove?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  mediaUrl,
  mediaType,
  size = 'md',
  onRemove,
  isLoading = false,
  className
}) => {
  if (isLoading) {
    return (
      <div className={cn(
        "mt-2 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md",
        size === 'sm' ? 'h-32' : size === 'lg' ? 'h-96' : 'h-64',
        className
      )}>
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }
  
  if (!mediaUrl) return null;
  
  const sizeClasses = {
    sm: "max-h-32",
    md: "max-h-64",
    lg: "max-h-96"
  };
  
  return (
    <div className={cn("mt-2 relative group", className)}>
      {mediaType === 'image' ? (
        <img 
          src={mediaUrl} 
          alt="Uploaded media" 
          className={cn(
            "w-full object-cover rounded-md", 
            sizeClasses[size]
          )}
        />
      ) : (
        <video 
          src={mediaUrl} 
          controls 
          className={cn(
            "w-full rounded-md", 
            sizeClasses[size]
          )}
        />
      )}
      
      {onRemove && (
        <Button 
          variant="destructive" 
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
