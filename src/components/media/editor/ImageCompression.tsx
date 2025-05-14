
import React from 'react';
import { Slider } from '@/components/ui/slider';

interface ImageCompressionProps {
  quality: number;
  setQuality: (quality: number) => void;
}

export const ImageCompression: React.FC<ImageCompressionProps> = ({ 
  quality, 
  setQuality 
}) => {
  return (
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
  );
};
