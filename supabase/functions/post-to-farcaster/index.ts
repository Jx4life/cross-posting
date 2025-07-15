
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
    
    console.log('=== FARCASTER POST (SIMPLE APPROACH) ===');
    console.log('Environment check:', {
      hasApiKey: !!NEYNAR_API_KEY,
      hasSignerUuid: !!FARCASTER_SIGNER_UUID,
    });
    
    if (!NEYNAR_API_KEY || !FARCASTER_SIGNER_UUID) {
      return new Response(
        JSON.stringify({ 
          error: "Missing NEYNAR_API_KEY or FARCASTER_SIGNER_UUID environment variables",
          success: false
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { content, mediaUrl, mediaType } = await req.json();
    console.log('Request payload:', { content, mediaUrl, mediaType });
    
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

    // Simple cast payload
    const castPayload = {
      signer_uuid: FARCASTER_SIGNER_UUID,
      text: content || "",
    };

    // Add embeds if media is provided
    if (mediaUrl) {
      castPayload.embeds = [{ url: mediaUrl }];
    }

    console.log('Posting to Neynar with payload:', JSON.stringify(castPayload, null, 2));

    const neynarResponse = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(castPayload)
    });

    console.log('Neynar response status:', neynarResponse.status);
    const responseText = await neynarResponse.text();
    console.log('Raw Neynar response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid response from Neynar API",
          success: false,
          details: responseText.substring(0, 500)
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!neynarResponse.ok) {
      console.error('Neynar API error:', responseData);
      return new Response(
        JSON.stringify({ 
          error: responseData?.message || "Failed to post to Farcaster",
          success: false,
          details: responseData
        }),
        { 
          status: neynarResponse.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Extract cast information
    const cast = responseData.cast || responseData;
    const castHash = cast?.hash;
    const author = cast?.author;
    
    console.log('=== POST SUCCESS ===');
    console.log('Cast hash:', castHash);
    console.log('Author:', author?.username);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Content posted to Farcaster successfully",
        cast: cast,
        details: {
          castHash: castHash,
          castUrl: author?.username && castHash ? `https://warpcast.com/${author.username}/${castHash}` : null,
          authorUsername: author?.username,
          authorFid: author?.fid,
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        success: false,
        details: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
