
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { TikTokContentAPI, TikTokVideoMetadata } from "@/services/tiktok/TikTokContentAPI";

interface TikTokVideoValidatorProps {
  onValidationComplete?: (isValid: boolean, errors: string[], warnings: string[]) => void;
}

export const TikTokVideoValidator = ({ onValidationComplete }: TikTokVideoValidatorProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    metadata?: TikTokVideoMetadata;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const getVideoMetadata = (file: File): Promise<TikTokVideoMetadata> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        const metadata: TikTokVideoMetadata = {
          duration: video.duration,
          size: file.size,
          format: file.name.split('.').pop()?.toLowerCase() || '',
          resolution: {
            width: video.videoWidth,
            height: video.videoHeight
          },
          aspectRatio: `${Math.round((video.videoWidth / video.videoHeight) * 16)}:16`
        };
        
        URL.revokeObjectURL(url);
        resolve(metadata);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = url;
    });
  };

  const validateFile = async (file: File) => {
    setIsValidating(true);
    try {
      const metadata = await getVideoMetadata(file);
      const result = TikTokContentAPI.validateVideo(metadata);
      
      setValidationResult({
        ...result,
        metadata
      });
      
      if (onValidationComplete) {
        onValidationComplete(result.isValid, result.errors, result.warnings);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        isValid: false,
        errors: ['Failed to validate video file'],
        warnings: []
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      validateFile(videoFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateFile(file);
    }
  };

  const requirements = TikTokContentAPI.getVideoRequirements();

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          TikTok Video Validator
        </h3>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
        >
          <div className="space-y-4">
            <div className="text-gray-600">
              Drop a video file here or click to select
            </div>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
            />
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('video-upload')?.click()}
              disabled={isValidating}
            >
              {isValidating ? 'Validating...' : 'Select Video File'}
            </Button>
          </div>
        </div>

        {validationResult && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {validationResult.isValid ? 'Video is valid for TikTok!' : 'Video validation failed'}
              </span>
            </div>

            {validationResult.metadata && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div><strong>Duration:</strong> {Math.round(validationResult.metadata.duration)}s</div>
                  <div><strong>Size:</strong> {Math.round(validationResult.metadata.size / (1024 * 1024))}MB</div>
                </div>
                <div className="space-y-2">
                  <div><strong>Format:</strong> {validationResult.metadata.format.toUpperCase()}</div>
                  <div><strong>Resolution:</strong> {validationResult.metadata.resolution.width}x{validationResult.metadata.resolution.height}</div>
                </div>
              </div>
            )}

            {validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {validationResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <div key={index}>• {warning}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
          <Info className="h-4 w-4" />
          TikTok Video Requirements
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <strong>Supported Formats:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {requirements.format.map(format => (
                  <Badge key={format} variant="secondary">{format.toUpperCase()}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <strong>File Size:</strong> Up to {Math.round(requirements.maxSize / (1024 * 1024))}MB
            </div>
            
            <div>
              <strong>Duration:</strong> {requirements.minDuration}s - {requirements.maxDuration}s
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <strong>Aspect Ratios:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {requirements.aspectRatio.map(ratio => (
                  <Badge key={ratio} variant="secondary">{ratio}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <strong>Resolution:</strong>
              <div>Min: {requirements.resolution.min.width}x{requirements.resolution.min.height}</div>
              <div>Max: {requirements.resolution.max.width}x{requirements.resolution.max.height}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
