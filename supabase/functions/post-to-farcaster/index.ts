
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
    
    console.log('=== FARCASTER POST FUNCTION ===');
    console.log('Environment check:', {
      hasApiKey: !!NEYNAR_API_KEY,
      hasSignerUuid: !!FARCASTER_SIGNER_UUID,
      apiKeyPrefix: NEYNAR_API_KEY ? NEYNAR_API_KEY.substring(0, 8) + '...' : 'missing',
      signerUuidPrefix: FARCASTER_SIGNER_UUID ? FARCASTER_SIGNER_UUID.substring(0, 8) + '...' : 'missing'
    });
    
    if (!NEYNAR_API_KEY || !FARCASTER_SIGNER_UUID) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ 
          error: "Missing NEYNAR_API_KEY or FARCASTER_SIGNER_UUID environment variables",
          success: false,
          debug: {
            hasApiKey: !!NEYNAR_API_KEY,
            hasSignerUuid: !!FARCASTER_SIGNER_UUID
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { content, mediaUrl, mediaType, signer_uuid } = await req.json();
    console.log('Request payload:', { content, mediaUrl, mediaType, signer_uuid });
    
    if (!content && !mediaUrl) {
      console.error('No content or media provided');
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

    // Use provided signer_uuid or fall back to default
    const finalSignerUuid = signer_uuid || FARCASTER_SIGNER_UUID;
    console.log('Using signer UUID:', finalSignerUuid.substring(0, 8) + '...');
    
    // Prepare the cast payload
    const castPayload = {
      signer_uuid: finalSignerUuid,
      text: content || "",
    };

    // Add embeds if media is provided
    if (mediaUrl) {
      castPayload.embeds = [{ url: mediaUrl }];
    }

    console.log('Posting to Neynar API...');
    console.log('Cast payload:', JSON.stringify(castPayload, null, 2));

    const neynarResponse = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(castPayload)
    });

    console.log('Neynar API response status:', neynarResponse.status);
    console.log('Neynar API response headers:', Object.fromEntries(neynarResponse.headers.entries()));

    const responseText = await neynarResponse.text();
    console.log('Raw Neynar response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed response data:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.error('Failed to parse Neynar response:', parseError);
      console.error('Response text:', responseText);
      return new Response(
        JSON.stringify({ 
          error: "Invalid response from Neynar API",
          success: false,
          details: {
            status: neynarResponse.status,
            responseText: responseText.substring(0, 500),
            parseError: parseError.message
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!neynarResponse.ok) {
      console.error('Neynar API error response:', responseData);
      return new Response(
        JSON.stringify({ 
          error: responseData?.message || "Failed to post to Farcaster",
          success: false,
          details: {
            status: neynarResponse.status,
            neynarError: responseData,
            apiResponse: responseData
          }
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
    
    console.log('=== FARCASTER POST SUCCESS ===');
    console.log('Cast hash:', castHash);
    console.log('Author:', author?.username);
    console.log('Author FID:', author?.fid);
    console.log('Cast URL:', author?.username && castHash ? `https://warpcast.com/${author.username}/${castHash}` : 'URL not available');
    
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
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error('=== EDGE FUNCTION ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        success: false,
        details: {
          errorType: error.constructor.name,
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
