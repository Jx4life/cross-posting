
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CropIcon, ZoomOut, RotateCcw, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

interface ImageEditorProps {
  selectedFile: File;
  previewUrl: string;
  onProcessedImage: (file: File) => void;
}

type ProcessingOption = 'none' | 'resize' | 'compress' | 'rotate';

export const ImageEditor: React.FC<ImageEditorProps> = ({ selectedFile, previewUrl, onProcessedImage }) => {
  const [processingOption, setProcessingOption] = useState<ProcessingOption>('none');
  const [quality, setQuality] = useState(80); // Default quality setting
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update dimensions when a new file is selected
  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.onload = () => {
        setWidth(img.width);
        setHeight(img.height);
      };
      img.onerror = (error) => {
        console.error("Error loading image:", error);
        toast.error("Failed to load image preview");
      };
      img.src = URL.createObjectURL(selectedFile);
    }
  }, [selectedFile]);

  // Handle rotation of image
  const rotateImage = (direction: 'clockwise' | 'counterclockwise') => {
    const degrees = direction === 'clockwise' ? 90 : -90;
    setRotation((prev) => (prev + degrees) % 360);
    setProcessingOption('rotate');
  };

  const toggleCompress = () => {
    setProcessingOption(prev => prev === 'compress' ? 'none' : 'compress');
  };
  
  const toggleResize = () => {
    setProcessingOption(prev => prev === 'resize' ? 'none' : 'resize');
  };

  const processImage = async () => {
    if (!selectedFile || !selectedFile.type.startsWith('image/') || processingOption === 'none') {
      onProcessedImage(selectedFile);
      return;
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
      
      onProcessedImage(processedFile);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error('Error processing image');
      onProcessedImage(selectedFile);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <img 
        src={previewUrl} 
        alt="Media preview" 
        className="max-h-48 w-full object-cover rounded-md"
        style={{ transform: `rotate(${rotation}deg)` }}
      />
      
      <div className="flex gap-2">
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
      
      {processingOption === 'compress' && (
        <div>
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
      
      {processingOption === 'resize' && (
        <div className="grid grid-cols-2 gap-2">
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
        className="w-full"
        onClick={processImage}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Apply Changes'}
      </Button>
    </div>
  );
};
