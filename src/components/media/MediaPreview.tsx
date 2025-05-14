
import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface MediaPreviewProps {
  previewUrl: string;
  mediaType: string;
  onReset: () => void;
  children?: React.ReactNode;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ 
  previewUrl, 
  mediaType, 
  onReset,
  children 
}) => {
  return (
    <div className="relative">
      {mediaType.startsWith('image') ? (
        <img 
          src={previewUrl} 
          alt="Media preview" 
          className="max-h-48 w-full object-cover rounded-md"
        />
      ) : (
        <video 
          src={previewUrl} 
          controls 
          className="max-h-48 w-full rounded-md"
        />
      )}
      
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 rounded-full"
        onClick={onReset}
      >
        <X className="h-4 w-4" />
      </Button>

      {children}
    </div>
  );
};
