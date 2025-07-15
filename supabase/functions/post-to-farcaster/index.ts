
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
    console.log('Farcaster function invoked');
    
    // Get secret environment variables
    const NEYNAR_API_KEY = Deno.env.get("NEYNAR_API_KEY");
    const FARCASTER_SIGNER_UUID = Deno.env.get("FARCASTER_SIGNER_UUID");
    
    console.log('Environment check:', {
      hasNeynarKey: !!NEYNAR_API_KEY,
      hasSignerUuid: !!FARCASTER_SIGNER_UUID,
      neynarKeyLength: NEYNAR_API_KEY ? NEYNAR_API_KEY.length : 0
    });
    
    if (!NEYNAR_API_KEY) {
      console.error("NEYNAR_API_KEY not found in environment");
      return new Response(
        JSON.stringify({ 
          error: "Neynar API key not configured",
          details: "NEYNAR_API_KEY environment variable is missing"
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!FARCASTER_SIGNER_UUID) {
      console.error("FARCASTER_SIGNER_UUID not found in environment");
      return new Response(
        JSON.stringify({ 
          error: "Farcaster signer UUID not configured",
          details: "FARCASTER_SIGNER_UUID environment variable is missing"
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse the request body
    const requestBody = await req.json();
    const { content, mediaUrl, mediaType } = requestBody;
    
    console.log('Request body received:', { content, mediaUrl, mediaType });
    
    if (!content && !mediaUrl) {
      console.error("No content or media provided");
      return new Response(
        JSON.stringify({ 
          error: "No content or media provided",
          details: "Either content text or media URL is required"
        }),
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

    console.log(`Posting to Farcaster via Neynar:`, JSON.stringify(castData, null, 2));

    // Make the actual API call to Neynar
    const neynarResponse = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Api-Key': NEYNAR_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(castData)
    });

    console.log('Neynar response status:', neynarResponse.status);
    console.log('Neynar response headers:', Object.fromEntries(neynarResponse.headers.entries()));

    const responseText = await neynarResponse.text();
    console.log('Neynar response body (raw):', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Neynar response as JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid response from Farcaster API", 
          details: `Received non-JSON response: ${responseText.substring(0, 200)}...`
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!neynarResponse.ok) {
      console.error("Neynar API error:", {
        status: neynarResponse.status,
        statusText: neynarResponse.statusText,
        responseData
      });
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to post to Farcaster", 
          details: responseData?.message || responseData?.error || `HTTP ${neynarResponse.status}: ${neynarResponse.statusText}`,
          neynarStatus: neynarResponse.status,
          neynarResponse: responseData
        }),
        { 
          status: neynarResponse.status >= 400 && neynarResponse.status < 500 ? 400 : 502, 
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
    console.error("Unexpected error in Farcaster function:", error);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message,
        type: error.name || 'UnknownError'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
