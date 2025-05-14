
import React from 'react';
import { toast } from 'sonner';

interface ImageProcessingProps {
  selectedFile: File;
  width: number | null;
  height: number | null;
  rotation: number;
  quality: number;
  processingOption: 'none' | 'resize' | 'compress' | 'rotate';
  onProcessed: (file: File) => void;
}

export const processImage = async ({
  selectedFile,
  width,
  height,
  rotation,
  quality,
  processingOption,
  onProcessed
}: ImageProcessingProps) => {
  if (!selectedFile || !selectedFile.type.startsWith('image/') || processingOption === 'none') {
    onProcessed(selectedFile);
    return;
  }

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
    
    onProcessed(processedFile);
  } catch (error) {
    console.error("Error processing image:", error);
    toast.error('Error processing image');
    onProcessed(selectedFile);
  }
};
