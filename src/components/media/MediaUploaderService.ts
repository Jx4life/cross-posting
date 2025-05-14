
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const uploadMediaToStorage = async (file: File): Promise<{ url: string; type: 'image' | 'video' } | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    toast.info('Uploading media...');
    
    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(filePath, file);

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
      type: file.type.split('/')[0] as 'image' | 'video' 
    };
  } catch (error) {
    toast.error('Error uploading media');
    console.error(error);
    return null;
  }
};
