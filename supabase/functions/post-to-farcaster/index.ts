
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
    
    console.log('=== FARCASTER POST DEBUG START ===');
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
    console.log('=== CHECKING SIGNER INFO ===');
    const signerResponse = await fetch(`https://api.neynar.com/v2/farcaster/signer?signer_uuid=${FARCASTER_SIGNER_UUID}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
      }
    });

    const signerData = await signerResponse.json();
    console.log('Signer response status:', signerResponse.status);
    console.log('Full signer data:', JSON.stringify(signerData, null, 2));

    if (!signerResponse.ok) {
      console.error('SIGNER ERROR:', signerData);
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
    console.log('Signer status:', signerData.status);
    console.log('Signer FID:', signerData.fid);
    console.log('Signer username:', signerData.username);
    
    if (signerData.status !== 'approved') {
      console.error('SIGNER NOT APPROVED:', signerData.status);
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

    console.log('=== POSTING TO NEYNAR ===');
    console.log('Cast payload:', JSON.stringify(castPayload, null, 2));

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
    console.log('Raw Neynar response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed response data:', JSON.stringify(responseData, null, 2));
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
      console.error('NEYNAR API ERROR:', {
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

    console.log('=== SUCCESS RESPONSE ANALYSIS ===');
    console.log('Full success response:', JSON.stringify(responseData, null, 2));

    // Extract more detailed information about the cast
    const castInfo = responseData.cast || responseData;
    const castHash = castInfo?.hash;
    const author = castInfo?.author;
    
    console.log('Cast hash:', castHash);
    console.log('Author info:', author);
    console.log('Cast text:', castInfo?.text);
    
    // Check if we actually have the required fields
    if (!castHash || !author?.username) {
      console.error('MISSING CAST DATA:', {
        hasCastHash: !!castHash,
        hasAuthor: !!author,
        hasUsername: !!author?.username,
        castInfo
      });
    }
    
    const castUrl = author?.username && castHash ? 
      `https://warpcast.com/${author.username}/${castHash}` : null;
    
    console.log('Generated cast URL:', castUrl);
    console.log('=== FARCASTER POST DEBUG END ===');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Content posted to Farcaster successfully",
        cast: responseData.cast,
        details: {
          castHash: castHash,
          castUrl: castUrl,
          authorUsername: author?.username,
          authorFid: author?.fid,
          text: castInfo?.text,
          signerInfo: {
            fid: signerData.fid,
            username: signerData.username
          },
          debug: {
            signerApproved: signerData.status === 'approved',
            responseHasCast: !!responseData.cast,
            responseHasHash: !!castHash,
            responseHasAuthor: !!author
          }
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
    console.error('Error stack:', error.stack);
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
