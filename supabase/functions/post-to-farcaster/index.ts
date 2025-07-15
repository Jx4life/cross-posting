
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
    // Get secret environment variables
    const NEYNAR_API_KEY = Deno.env.get("NEYNAR_API_KEY");
    const FARCASTER_SIGNER_UUID = Deno.env.get("FARCASTER_SIGNER_UUID");
    
    if (!NEYNAR_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Neynar API key not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!FARCASTER_SIGNER_UUID) {
      return new Response(
        JSON.stringify({ error: "Farcaster signer UUID not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse the request body
    const { content, mediaUrl, mediaType } = await req.json();
    
    if (!content && !mediaUrl) {
      return new Response(
        JSON.stringify({ error: "No content or media provided" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Prepare the cast data for Neynar API
    const castData: any = {
      signer_uuid: FARCASTER_SIGNER_UUID,
      text: content || "",
    };

    // Add media if provided
    if (mediaUrl) {
      castData.embeds = [{ url: mediaUrl }];
    }

    console.log(`Posting to Farcaster via Neynar: ${JSON.stringify(castData)}`);

    // Make the actual API call to Neynar
    const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Api-Key': NEYNAR_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(castData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Neynar API error:", responseData);
      return new Response(
        JSON.stringify({ 
          error: "Failed to post to Farcaster", 
          details: responseData.message || responseData.error || "Unknown error"
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Farcaster post successful:", responseData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Content posted to Farcaster successfully",
        cast: responseData.cast,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error posting to Farcaster:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to post to Farcaster", 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
