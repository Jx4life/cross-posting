
import React from "react";

interface MediaPreviewProps {
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  mediaUrl,
  mediaType
}) => {
  if (!mediaUrl) return null;
  
  return (
    <div className="mt-2">
      {mediaType === 'image' ? (
        <img 
          src={mediaUrl} 
          alt="Uploaded media" 
          className="max-h-64 w-full object-cover rounded-md"
        />
      ) : (
        <video 
          src={mediaUrl} 
          controls 
          className="max-h-64 w-full rounded-md"
        />
      )}
    </div>
  );
};
