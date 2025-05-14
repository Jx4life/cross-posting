
import React, { useState } from 'react';
import { toast } from 'sonner';
import { MediaUploadButton } from './media/MediaUploadButton';
import { MediaPreview } from './media/MediaPreview';
import { ImageEditor } from './media/ImageEditor';
import { uploadMediaToStorage } from './media/MediaUploaderService';

interface MediaUploaderProps {
  onMediaUpload: (mediaUrl: string, mediaType: 'image' | 'video') => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ onMediaUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (file: File) => {
    const fileType = file.type.split('/')[0];
    
    if (fileType !== 'image' && fileType !== 'video') {
      toast.error('Please upload an image or video file');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleProcessedImage = (file: File) => {
    setProcessedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      const fileToUpload = processedFile || selectedFile;
      if (!fileToUpload) return;
      
      const result = await uploadMediaToStorage(fileToUpload);
      if (result) {
        onMediaUpload(result.url, result.type);
        resetMedia();
      }
    } finally {
      setIsUploading(false);
    }
  };

  const resetMedia = () => {
    setSelectedFile(null);
    setProcessedFile(null);
    setPreviewUrl(null);
    // Release object URLs to avoid memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const isImage = selectedFile?.type.startsWith('image/');

  if (!selectedFile) {
    return <MediaUploadButton onFileSelect={handleFileSelect} />;
  }

  return (
    <div className="flex flex-col space-y-2">
      <MediaPreview 
        previewUrl={previewUrl!} 
        mediaType={selectedFile.type} 
        onReset={resetMedia}
      >
        {isImage ? (
          <ImageEditor 
            selectedFile={selectedFile} 
            previewUrl={previewUrl!} 
            onProcessedImage={handleProcessedImage} 
          />
        ) : (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="mt-4 w-full"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Confirm Upload'}
          </Button>
        )}
      </MediaPreview>
      
      {isImage && (
        <Button
          type="button"
          variant="default"
          size="sm"
          className="w-full"
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Confirm Upload'}
        </Button>
      )}
    </div>
  );
};
