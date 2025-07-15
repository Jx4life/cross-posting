
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
    
    console.log('Environment check:', {
      hasApiKey: !!NEYNAR_API_KEY,
      hasSignerUuid: !!FARCASTER_SIGNER_UUID,
      apiKeyPrefix: NEYNAR_API_KEY ? NEYNAR_API_KEY.substring(0, 8) + '...' : 'none',
      signerUuidPrefix: FARCASTER_SIGNER_UUID ? FARCASTER_SIGNER_UUID.substring(0, 8) + '...' : 'none'
    });
    
    if (!NEYNAR_API_KEY || !FARCASTER_SIGNER_UUID) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required environment variables",
          success: false,
          details: {
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

    // First, let's check the signer info to verify it's properly configured
    console.log('Checking signer info...');
    const signerResponse = await fetch(`https://api.neynar.com/v2/farcaster/signer?signer_uuid=${FARCASTER_SIGNER_UUID}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
      }
    });

    const signerData = await signerResponse.json();
    console.log('Signer info:', {
      status: signerResponse.status,
      signerData: signerData
    });

    if (!signerResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid signer configuration",
          success: false,
          details: {
            signerError: signerData,
            message: "Your Farcaster signer may not be properly configured or approved"
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Check if signer is approved
    if (signerData.status !== 'approved') {
      return new Response(
        JSON.stringify({ 
          error: "Signer not approved",
          success: false,
          details: {
            signerStatus: signerData.status,
            message: "Your Farcaster signer needs to be approved before you can post. Please check your Neynar dashboard."
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Construct the payload according to Neynar managed signers documentation
    const castPayload: any = {
      signer_uuid: FARCASTER_SIGNER_UUID,
      text: content || "",
    };

    // Add embeds if media is provided
    if (mediaUrl) {
      castPayload.embeds = [{ url: mediaUrl }];
    }

    console.log('Sending to Neynar:', {
      url: 'https://api.neynar.com/v2/farcaster/cast',
      payload: castPayload,
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY ? NEYNAR_API_KEY.substring(0, 8) + '...' : 'none',
        'content-type': 'application/json'
      }
    });

    // Make the API call to Neynar
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
    console.log('Neynar response headers:', Object.fromEntries(neynarResponse.headers.entries()));

    const responseText = await neynarResponse.text();
    console.log('Neynar response body:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Neynar response as JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid response from Neynar API",
          success: false,
          details: {
            status: neynarResponse.status,
            responseText: responseText.substring(0, 500)
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!neynarResponse.ok) {
      console.error('Neynar API error:', {
        status: neynarResponse.status,
        statusText: neynarResponse.statusText,
        responseData
      });
      
      return new Response(
        JSON.stringify({ 
          error: responseData?.message || responseData?.error || "Failed to post to Farcaster",
          success: false,
          details: {
            status: neynarResponse.status,
            neynarError: responseData
          }
        }),
        { 
          status: neynarResponse.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log('Successful cast response:', responseData);

    // Extract more detailed information about the cast
    const castInfo = responseData.cast || responseData;
    const castHash = castInfo.hash;
    const author = castInfo.author;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Content posted to Farcaster successfully",
        cast: responseData.cast,
        details: {
          castHash: castHash,
          castUrl: `https://warpcast.com/${author?.username}/${castHash}`,
          authorUsername: author?.username,
          authorFid: author?.fid,
          text: castInfo.text,
          signerInfo: {
            fid: signerData.fid,
            username: signerData.username
          }
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
        details: {
          errorType: error.constructor.name,
          stack: error.stack
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
