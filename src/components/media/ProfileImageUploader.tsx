
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileImageUploaderProps {
  currentAvatarUrl: string | null;
  onImageUploaded: (url: string) => void;
  username?: string;
}

export const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({ 
  currentAvatarUrl, 
  onImageUploaded, 
  username 
}) => {
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${Math.random()}.${fileExt}`;

      toast.info('Uploading profile image...');
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      onImageUploaded(publicUrl);
      toast.success('Profile image uploaded successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Error uploading image');
      console.error('Error uploading image:', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Avatar className="h-24 w-24 cursor-pointer group relative">
        <AvatarImage src={currentAvatarUrl || ''} />
        <AvatarFallback className="bg-purple-200 text-purple-800">
          {username?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity">
          <Camera className="text-white h-8 w-8" />
        </div>
      </Avatar>
      
      <label className="mt-4">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="text-sm border-purple-200"
          disabled={uploading}
        >
          <Camera className="mr-2 h-4 w-4" />
          {uploading ? 'Uploading...' : 'Change Profile Picture'}
        </Button>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </label>
    </div>
  );
};
