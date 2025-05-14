
import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, RotateCw } from 'lucide-react';

interface RotationControlsProps {
  onRotate: (direction: 'clockwise' | 'counterclockwise') => void;
}

export const RotationControls: React.FC<RotationControlsProps> = ({ onRotate }) => {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onRotate('counterclockwise')}
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
        onClick={() => onRotate('clockwise')}
        className="flex items-center gap-1"
        title="Rotate clockwise"
      >
        <RotateCw className="h-4 w-4" />
      </Button>
    </>
  );
};
