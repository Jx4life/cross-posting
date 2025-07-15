
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
    
    console.log('=== FARCASTER POST WITH NEYNAR START ===');
    console.log('Environment check:', {
      hasApiKey: !!NEYNAR_API_KEY,
      apiKeyPrefix: NEYNAR_API_KEY ? NEYNAR_API_KEY.substring(0, 8) + '...' : 'none'
    });
    
    if (!NEYNAR_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: "Missing NEYNAR_API_KEY environment variable",
          success: false
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { content, mediaUrl, mediaType, accessToken } = await req.json();
    console.log('Request payload:', { content, mediaUrl, mediaType, hasAccessToken: !!accessToken });
    
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

    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          error: "Access token required for SIWN authentication",
          success: false 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Construct the payload for authenticated posting via SIWN
    const castPayload: any = {
      text: content || "",
    };

    // Add embeds if media is provided
    if (mediaUrl) {
      castPayload.embeds = [{ url: mediaUrl }];
    }

    console.log('=== POSTING TO NEYNAR WITH SIWN ===');
    console.log('Cast payload:', JSON.stringify(castPayload, null, 2));

    // Make the API call to Neynar using the user's access token
    const neynarResponse = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
        'authorization': `Bearer ${accessToken}`,
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

    // Extract cast information from the response
    const castInfo = responseData.cast || responseData;
    const castHash = castInfo?.hash;
    const author = castInfo?.author;
    
    console.log('Cast hash:', castHash);
    console.log('Author info:', author);
    console.log('Cast text:', castInfo?.text);
    
    const castUrl = author?.username && castHash ? 
      `https://warpcast.com/${author.username}/${castHash}` : null;
    
    console.log('Generated cast URL:', castUrl);
    console.log('=== FARCASTER POST WITH NEYNAR END ===');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Content posted to Farcaster successfully via SIWN",
        cast: responseData.cast,
        details: {
          castHash: castHash,
          castUrl: castUrl,
          authorUsername: author?.username,
          authorFid: author?.fid,
          text: castInfo?.text,
          authMethod: 'SIWN',
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
