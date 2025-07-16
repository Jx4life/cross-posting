
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { uploadMediaToStorage } from './MediaUploaderService';

interface PhotoBatchUploaderProps {
  onPhotosUpload: (photoUrls: string[]) => void;
  maxPhotos?: number;
}

export const PhotoBatchUploader: React.FC<PhotoBatchUploaderProps> = ({ 
  onPhotosUpload, 
  maxPhotos = 35 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Please select only image files",
        variant: "destructive"
      });
    }

    if (selectedFiles.length + imageFiles.length > maxPhotos) {
      toast({
        title: "Too Many Photos",
        description: `Maximum ${maxPhotos} photos allowed for TikTok carousel`,
        variant: "destructive"
      });
      return;
    }

    const newFiles = [...selectedFiles, ...imageFiles];
    const newPreviews = [...previewUrls];
    
    imageFiles.forEach(file => {
      newPreviews.push(URL.createObjectURL(file));
    });
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const removePhoto = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    
    // Clean up object URL
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Photos Selected",
        description: "Please select photos to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = selectedFiles.map(file => uploadMediaToStorage(file));
      const results = await Promise.all(uploadPromises);
      
      const successfulUploads = results.filter(result => result !== null);
      if (successfulUploads.length === 0) {
        throw new Error('No photos were uploaded successfully');
      }

      const photoUrls = successfulUploads.map(result => result!.url);
      onPhotosUpload(photoUrls);
      
      // Clean up
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      
      toast({
        title: "Photos Uploaded",
        description: `${successfulUploads.length} photos uploaded for TikTok carousel`,
      });
      
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photos",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetSelection = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  if (selectedFiles.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="photo-batch-upload"
        />
        <label htmlFor="photo-batch-upload" className="cursor-pointer">
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">Select photos for TikTok carousel</p>
          <p className="text-sm text-gray-500">Up to {maxPhotos} photos allowed</p>
          <Button type="button" variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Select Photos
          </Button>
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Selected Photos ({selectedFiles.length}/{maxPhotos})
        </h3>
        <div className="space-x-2">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="add-more-photos"
          />
          <label htmlFor="add-more-photos">
            <Button type="button" variant="outline" size="sm" asChild>
              <span>
                <Plus className="h-4 w-4 mr-2" />
                Add More
              </span>
            </Button>
          </label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={resetSelection}
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {previewUrls.map((url, index) => (
          <div key={index} className="relative group">
            <img 
              src={url} 
              alt={`Preview ${index + 1}`}
              className="w-full h-32 object-cover rounded-md"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
              onClick={() => removePhoto(index)}
            >
              <X className="h-3 w-3" />
            </Button>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      <Button 
        type="button" 
        onClick={handleUploadAll}
        disabled={isUploading}
        className="w-full"
      >
        {isUploading ? 'Uploading Photos...' : `Upload ${selectedFiles.length} Photos for TikTok`}
      </Button>
    </div>
  );
};
