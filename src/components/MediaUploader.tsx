
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from './ui/button';
import { Image, Video, Upload, X, PenLine, CropIcon, ZoomIn, ZoomOut, RotateCcw, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Slider } from './ui/slider';

interface MediaUploaderProps {
  onMediaUpload: (mediaUrl: string, mediaType: 'image' | 'video') => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ onMediaUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState(80); // Default quality setting
  const [processingOption, setProcessingOption] = useState<'none' | 'resize' | 'compress' | 'rotate'>('none');
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0); // New state for rotation angle
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Update dimensions when a new file is selected
  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.onload = () => {
        setWidth(img.width);
        setHeight(img.height);
        if (imageRef.current) {
          imageRef.current.src = img.src;
        }
      };
      img.onerror = (error) => {
        console.error("Error loading image:", error);
        toast.error("Failed to load image preview");
      };
      img.src = URL.createObjectURL(selectedFile);
    }
  }, [selectedFile]);

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
      setProcessingOption('none');
      setRotation(0); // Reset rotation when new file is selected
    }
  };

  // Handle rotation of image
  const rotateImage = (direction: 'clockwise' | 'counterclockwise') => {
    const degrees = direction === 'clockwise' ? 90 : -90;
    setRotation((prev) => (prev + degrees) % 360);
    setProcessingOption('rotate');
  };

  const processImage = async (): Promise<File | null> => {
    if (!selectedFile || !selectedFile.type.startsWith('image/') || processingOption === 'none') {
      return selectedFile;
    }

    setIsProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          let targetWidth = img.width;
          let targetHeight = img.height;
          
          // Apply resize if selected
          if (processingOption === 'resize' && width && height) {
            targetWidth = width;
            targetHeight = height;
          }
          
          // Swap dimensions if rotation is 90 or 270 degrees
          if (Math.abs(rotation % 180) === 90) {
            canvas.width = targetHeight;
            canvas.height = targetWidth;
          } else {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
          }
          
          // Apply rotation
          ctx?.save();
          ctx?.translate(canvas.width / 2, canvas.height / 2);
          ctx?.rotate((rotation * Math.PI) / 180);
          
          // Draw rotated image (adjust position based on rotation)
          if (Math.abs(rotation % 180) === 90) {
            ctx?.drawImage(
              img, 
              -targetHeight / 2, 
              -targetWidth / 2, 
              targetHeight, 
              targetWidth
            );
          } else {
            ctx?.drawImage(
              img, 
              -targetWidth / 2, 
              -targetHeight / 2, 
              targetWidth, 
              targetHeight
            );
          }
          ctx?.restore();
          
          resolve();
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = URL.createObjectURL(selectedFile);
      });
      
      // Get format from original file or use jpg as default
      const format = selectedFile.type.includes('png') ? 'image/png' : 'image/jpeg';
      
      // Convert to blob with specified quality
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) {
              resolve(b);
            } else {
              reject(new Error("Failed to create blob"));
            }
          }, 
          format, 
          quality / 100
        );
      });
      
      // Create new file from blob
      const processedFile = new File(
        [blob], 
        selectedFile.name.split('.')[0] + (format === 'image/png' ? '.png' : '.jpg'),
        { type: format }
      );
      
      // Update preview
      setPreviewUrl(URL.createObjectURL(processedFile));
      
      return processedFile;
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error('Error processing image');
      return selectedFile;
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadMediaToStorage = async () => {
    let fileToUpload = selectedFile;
    
    if (selectedFile?.type.startsWith('image/')) {
      fileToUpload = await processImage();
    }
    
    if (!fileToUpload) return null;

    try {
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      toast.info('Uploading media...');
      
      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(filePath, fileToUpload);

      if (uploadError) {
        toast.error('Error uploading media');
        console.error(uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(filePath);

      toast.success('Media uploaded successfully');
      return { 
        url: publicUrl, 
        type: fileToUpload.type.split('/')[0] as 'image' | 'video' 
      };
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
    setProcessingOption('none');
    setWidth(null);
    setHeight(null);
    setRotation(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleCompress = () => {
    setProcessingOption(prev => prev === 'compress' ? 'none' : 'compress');
  };
  
  const toggleResize = () => {
    setProcessingOption(prev => prev === 'resize' ? 'none' : 'resize');
  };

  const isImage = selectedFile?.type.startsWith('image/');
  
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
          {isImage ? (
            <img 
              ref={imageRef}
              src={previewUrl} 
              alt="Media preview" 
              className="max-h-48 w-full object-cover rounded-md"
              style={{ transform: `rotate(${rotation}deg)` }}
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
          
          {isImage && (
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={processingOption === 'compress' ? "default" : "outline"}
                size="sm"
                onClick={toggleCompress}
                className="flex items-center gap-1"
                title="Compress image"
              >
                <ZoomOut className="h-4 w-4" />
                Compress
              </Button>
              
              <Button
                type="button"
                variant={processingOption === 'resize' ? "default" : "outline"}
                size="sm"
                onClick={toggleResize}
                className="flex items-center gap-1"
                title="Resize image"
              >
                <CropIcon className="h-4 w-4" />
                Resize
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => rotateImage('counterclockwise')}
                className="flex items-center gap-1"
                title="Rotate counterclockwise"
              >
                <RotateCcw className="h-4 w-4" />
                Rotate
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => rotateImage('clockwise')}
                className="flex items-center gap-1"
                title="Rotate clockwise"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {isImage && processingOption === 'compress' && (
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Quality: {quality}%</span>
              </div>
              <Slider 
                value={[quality]} 
                min={10} 
                max={100} 
                step={5}
                onValueChange={(value) => setQuality(value[0])} 
                className="my-2"
              />
            </div>
          )}
          
          {isImage && processingOption === 'resize' && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <span className="text-sm block mb-1">Width (px)</span>
                <input
                  type="number"
                  value={width || ''}
                  onChange={(e) => setWidth(parseInt(e.target.value) || null)}
                  className="w-full p-2 text-sm rounded border"
                  placeholder="Width"
                />
              </div>
              <div>
                <span className="text-sm block mb-1">Height (px)</span>
                <input
                  type="number"
                  value={height || ''}
                  onChange={(e) => setHeight(parseInt(e.target.value) || null)}
                  className="w-full p-2 text-sm rounded border"
                  placeholder="Height"
                />
              </div>
            </div>
          )}
          
          <Button
            type="button"
            variant="default"
            size="sm"
            className="mt-4 w-full"
            onClick={handleUpload}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm Upload'}
          </Button>
        </div>
      )}
    </div>
  );
};
