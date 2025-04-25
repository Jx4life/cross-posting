
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        auth: {
          persistSession: false,
        }
      }
    );
    
    const { 
      content, 
      platforms, 
      scheduledAt, 
      userId, 
      mediaUrl, 
      mediaType 
    } = await req.json();
    
    if (!content || !scheduledAt || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('scheduled_posts')
      .insert({
        user_id: userId,
        content,
        platforms: JSON.stringify(platforms),
        scheduled_at: scheduledAt,
        status: 'pending',
        media_url: mediaUrl,
        media_type: mediaType
      })
      .select()
      .single();
    
    if (error) {
      console.error("Database error:", error);
      throw error;
    }
    
    console.log("Scheduled post saved:", data);
    
    return new Response(
      JSON.stringify({ 
        message: "Post scheduled successfully", 
        id: data.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error scheduling post:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to schedule post", 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
