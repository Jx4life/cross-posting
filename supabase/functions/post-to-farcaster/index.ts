
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const NEYNAR_API_KEY = Deno.env.get("NEYNAR_API_KEY");
    const FARCASTER_SIGNER_UUID = Deno.env.get("FARCASTER_SIGNER_UUID");
    
    if (!NEYNAR_API_KEY || !FARCASTER_SIGNER_UUID) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required environment variables",
          success: false 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { content, mediaUrl, mediaType } = await req.json();
    
    if (!content && !mediaUrl) {
      return new Response(
        JSON.stringify({ 
          error: "Content or media required",
          success: false 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const castData: any = {
      signer_uuid: FARCASTER_SIGNER_UUID,
      text: content || "",
    };

    if (mediaUrl) {
      castData.embeds = [{ url: mediaUrl }];
    }

    const neynarResponse = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Api-Key': NEYNAR_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(castData)
    });

    const responseData = await neynarResponse.json();

    if (!neynarResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: responseData?.message || "Failed to post to Farcaster",
          success: false 
        }),
        { 
          status: neynarResponse.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Content posted to Farcaster successfully",
        cast: responseData.cast
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
