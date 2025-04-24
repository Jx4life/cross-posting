
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the supabase client with admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        auth: {
          persistSession: false,
        }
      }
    );
    
    // Parse the request body
    const { content, platforms, scheduledAt, userId } = await req.json();
    
    if (!content || !scheduledAt || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Store the scheduled post in the database
    const { data, error } = await supabaseAdmin
      .from('scheduled_posts')
      .insert({
        user_id: userId,
        content,
        platforms: JSON.stringify(platforms),
        scheduled_at: scheduledAt,
        status: 'pending'
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
