
import React, { useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from './ui/button';
import { Image, Video, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MediaUploaderProps {
  onMediaUpload: (mediaUrl: string, mediaType: 'image' | 'video') => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ onMediaUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileType = file.type.split('/')[0];
      
      if (fileType !== 'image' && fileType !== 'video') {
        toast.error('Please upload an image or video file');
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadMediaToStorage = async () => {
    if (!selectedFile) return null;

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(filePath, selectedFile);

      if (uploadError) {
        toast.error('Error uploading media');
        console.error(uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(filePath);

      return { url: publicUrl, type: selectedFile.type.split('/')[0] as 'image' | 'video' };
    } catch (error) {
      toast.error('Error uploading media');
      console.error(error);
      return null;
    }
  };

  const handleUpload = async () => {
    const result = await uploadMediaToStorage();
    if (result) {
      onMediaUpload(result.url, result.type);
      resetMedia();
    }
  };

  const resetMedia = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {!selectedFile && (
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Media
        </Button>
      )}

      {previewUrl && (
        <div className="relative">
          {selectedFile?.type.startsWith('image/') ? (
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
            onClick={resetMedia}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="mt-2"
            onClick={handleUpload}
          >
            Confirm Upload
          </Button>
        </div>
      )}
    </div>
  );
};
