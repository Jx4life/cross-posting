
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Database } from "@/integrations/supabase/types";

type PlatformType = Database["public"]["Enums"]["platform_type"];
type PostConfiguration = Database["public"]["Tables"]["post_configurations"]["Row"];

export const usePostConfigurations = () => {
  return useQuery({
    queryKey: ["post-configurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_configurations")
        .select("*");

      if (error) throw error;
      return data as PostConfiguration[];
    },
  });
};
