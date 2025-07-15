
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
    console.log('=== FARCASTER FUNCTION START ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Get secret environment variables
    const NEYNAR_API_KEY = Deno.env.get("NEYNAR_API_KEY");
    const FARCASTER_SIGNER_UUID = Deno.env.get("FARCASTER_SIGNER_UUID");
    
    console.log('Environment check:', {
      hasNeynarKey: !!NEYNAR_API_KEY,
      hasSignerUuid: !!FARCASTER_SIGNER_UUID,
      neynarKeyLength: NEYNAR_API_KEY ? NEYNAR_API_KEY.length : 0,
      signerUuidLength: FARCASTER_SIGNER_UUID ? FARCASTER_SIGNER_UUID.length : 0
    });
    
    // Validate environment variables first
    if (!NEYNAR_API_KEY) {
      console.error("CRITICAL: NEYNAR_API_KEY not found in environment");
      return new Response(
        JSON.stringify({ 
          error: "Neynar API key not configured",
          details: "NEYNAR_API_KEY environment variable is missing. Please add it to Supabase Edge Function Secrets.",
          debugInfo: {
            timestamp: new Date().toISOString(),
            hasNeynarKey: false,
            hasSignerUuid: !!FARCASTER_SIGNER_UUID
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!FARCASTER_SIGNER_UUID) {
      console.error("CRITICAL: FARCASTER_SIGNER_UUID not found in environment");
      return new Response(
        JSON.stringify({ 
          error: "Farcaster signer UUID not configured",
          details: "FARCASTER_SIGNER_UUID environment variable is missing. Please add it to Supabase Edge Function Secrets.",
          debugInfo: {
            timestamp: new Date().toISOString(),
            hasNeynarKey: !!NEYNAR_API_KEY,
            hasSignerUuid: false
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse the request body
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      requestBody = JSON.parse(bodyText);
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON in request body",
          details: parseError.message,
          debugInfo: {
            timestamp: new Date().toISOString(),
            parseError: parseError.name
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const { content, mediaUrl, mediaType } = requestBody;
    
    console.log('Extracted content:', { content, mediaUrl, mediaType });
    
    if (!content && !mediaUrl) {
      console.error("No content or media provided");
      return new Response(
        JSON.stringify({ 
          error: "No content or media provided",
          details: "Either content text or media URL is required",
          debugInfo: {
            timestamp: new Date().toISOString(),
            receivedContent: !!content,
            receivedMedia: !!mediaUrl
          }
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

    console.log('Prepared cast data:', JSON.stringify(castData, null, 2));

    // Make the actual API call to Neynar
    console.log('Making request to Neynar API...');
    
    let neynarResponse;
    try {
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Api-Key': NEYNAR_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(castData)
      };
      
      console.log('Fetch options (without API key):', {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Api-Key': '[REDACTED]'
        }
      });
      
      neynarResponse = await fetch('https://api.neynar.com/v2/farcaster/cast', fetchOptions);
    } catch (fetchError) {
      console.error('Fetch error when calling Neynar:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: "Network error when calling Farcaster API", 
          details: fetchError.message,
          debugInfo: {
            timestamp: new Date().toISOString(),
            errorType: fetchError.name,
            neynarEndpoint: 'https://api.neynar.com/v2/farcaster/cast'
          }
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log('Neynar response status:', neynarResponse.status);
    console.log('Neynar response headers:', Object.fromEntries(neynarResponse.headers.entries()));

    const responseText = await neynarResponse.text();
    console.log('Neynar response body (raw):', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Neynar response body (parsed):', responseData);
    } catch (parseError) {
      console.error('Failed to parse Neynar response as JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid response from Farcaster API", 
          details: `Received non-JSON response from Neynar API`,
          debugInfo: {
            timestamp: new Date().toISOString(),
            neynarStatus: neynarResponse.status,
            responsePreview: responseText.substring(0, 200),
            parseError: parseError.message
          }
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
          debugInfo: {
            timestamp: new Date().toISOString(),
            neynarStatus: neynarResponse.status,
            neynarStatusText: neynarResponse.statusText,
            neynarResponse: responseData,
            endpoint: 'https://api.neynar.com/v2/farcaster/cast'
          }
        }),
        { 
          status: neynarResponse.status >= 400 && neynarResponse.status < 500 ? 400 : 502, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Farcaster post successful:", responseData);
    console.log('=== FARCASTER FUNCTION SUCCESS ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Content posted to Farcaster successfully",
        cast: responseData.cast,
        debugInfo: {
          timestamp: new Date().toISOString(),
          neynarStatus: neynarResponse.status
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("=== FARCASTER FUNCTION ERROR ===");
    console.error("Unexpected error in Farcaster function:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message,
        debugInfo: {
          timestamp: new Date().toISOString(),
          errorType: error.name || 'UnknownError',
          errorStack: error.stack?.split('\n').slice(0, 5) // First 5 lines of stack trace
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
