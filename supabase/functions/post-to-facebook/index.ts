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
    console.log('📨 Facebook post request received');
    
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { content, mediaUrl, mediaType, accessToken, pageId, pageAccessToken } = requestBody;
    
    console.log('📋 Request data:', { 
      content: content?.substring(0, 50) + '...', 
      mediaUrl: mediaUrl ? 'present' : 'none',
      mediaType, 
      accessToken: accessToken ? 'present' : 'missing',
      pageId: pageId || 'none',
      pageAccessToken: pageAccessToken ? 'present' : 'missing'
    });
    
    if (!accessToken) {
      console.error('❌ No access token provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Access token is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let endpoint: string;
    let postData: any;

    // For posting to Facebook, we prefer pages but allow personal timeline as fallback
    if (!pageId) {
      console.log('No page ID provided, posting to personal timeline (limited functionality)');
      
      // Use personal timeline endpoint with user access token
      endpoint = `https://graph.facebook.com/v18.0/me/feed`;
      
      // Prepare the post data using user access token
      postData = {
        message: content,
        access_token: accessToken
      };
    } else {
      if (!pageAccessToken) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Page Access Token is required when posting to a specific page' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Use page endpoint with page access token
      endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;
      
      // Prepare the post data using page access token
      postData = {
        message: content,
        access_token: pageAccessToken
      };
    }

    // Add media if provided
    if (mediaUrl) {
      if (mediaType === 'image') {
        postData.link = mediaUrl;
      } else if (mediaType === 'video') {
        // For videos, determine the correct endpoint and access token
        const videoEndpoint = pageId 
          ? `https://graph.facebook.com/v18.0/${pageId}/videos`
          : `https://graph.facebook.com/v18.0/me/videos`;
        
        const videoAccessToken = pageAccessToken || accessToken;
        
        const videoResponse = await fetch(videoEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: content,
            file_url: mediaUrl,
            access_token: videoAccessToken
          })
        });

        const videoResult = await videoResponse.json();
        
        if (!videoResponse.ok) {
          console.error('❌ Video upload failed:', videoResult);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: videoResult.error?.message || 'Failed to post video to Facebook'
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
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

    console.log('📤 Posting to Facebook endpoint:', endpoint);
    console.log('📋 Post data:', { ...postData, access_token: 'hidden' });

    // Post to Facebook
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });

    const result = await response.json();
    console.log('📥 Facebook API response:', response.status, result);
    
    if (!response.ok) {
      console.error('❌ Facebook API error:', result);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: result.error?.message || 'Failed to post to Facebook'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
    console.error('❌ Facebook posting error:', error);
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