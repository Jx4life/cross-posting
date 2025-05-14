
import React from 'react';

interface ImageResizeProps {
  width: number | null;
  height: number | null;
  setWidth: (width: number | null) => void;
  setHeight: (height: number | null) => void;
}

export const ImageResize: React.FC<ImageResizeProps> = ({ 
  width, 
  height, 
  setWidth, 
  setHeight 
}) => {
  return (
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
  );
};
