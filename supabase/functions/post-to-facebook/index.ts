import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const { content, mediaUrl, mediaType, accessToken, pageId, pageAccessToken } = await req.json();
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Access token is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // For posting to Facebook, we need to use pages. Personal profile posting is largely deprecated.
    if (!pageId || !pageAccessToken) {
      return new Response(
        JSON.stringify({ 
          error: 'Page ID and Page Access Token are required for Facebook posting. Personal profile posting is not supported.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use page endpoint with page access token
    const endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;

    // Prepare the post data using page access token
    const postData: any = {
      message: content,
      access_token: pageAccessToken
    };

    // Add media if provided
    if (mediaUrl) {
      if (mediaType === 'image') {
        postData.link = mediaUrl;
      } else if (mediaType === 'video') {
        // For videos, use the page video endpoint
        const videoEndpoint = `https://graph.facebook.com/v18.0/${pageId}/videos`;
        
        const videoResponse = await fetch(videoEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: content,
            file_url: mediaUrl,
            access_token: pageAccessToken
          })
        });

        const videoResult = await videoResponse.json();
        
        if (!videoResponse.ok) {
          throw new Error(videoResult.error?.message || 'Failed to post video to Facebook');
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            postId: videoResult.id,
            message: 'Video posted successfully to Facebook' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Post to Facebook
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to post to Facebook');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        postId: result.id,
        message: 'Posted successfully to Facebook' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Facebook posting error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to post to Facebook' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});