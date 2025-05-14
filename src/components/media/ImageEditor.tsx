
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CropIcon, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import { ImageCompression } from './editor/ImageCompression';
import { ImageResize } from './editor/ImageResize';
import { RotationControls } from './editor/RotationControls';
import { processImage } from './editor/ImageProcessing';

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
  const handleRotate = (direction: 'clockwise' | 'counterclockwise') => {
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

  const handleProcessImage = async () => {
    setIsProcessing(true);
    
    await processImage({
      selectedFile,
      width,
      height,
      rotation,
      quality,
      processingOption,
      onProcessed: onProcessedImage
    });
    
    setIsProcessing(false);
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
        
        <RotationControls onRotate={handleRotate} />
      </div>
      
      {processingOption === 'compress' && (
        <ImageCompression quality={quality} setQuality={setQuality} />
      )}
      
      {processingOption === 'resize' && (
        <ImageResize 
          width={width} 
          height={height} 
          setWidth={setWidth} 
          setHeight={setHeight} 
        />
      )}
      
      <Button
        type="button"
        variant="default"
        size="sm"
        className="w-full"
        onClick={handleProcessImage}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Apply Changes'}
      </Button>
    </div>
  );
};
