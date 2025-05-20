
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process a single platform post
async function processPostForPlatform(
  supabaseAdmin,
  postId,
  platform,
  content,
  mediaUrl,
  mediaType
) {
  console.log(`Processing ${platform} post for post ${postId}`);
  
  try {
    let success = false;
    let error = null;
    let data = null;
    
    // Invoke the appropriate function based on platform
    if (platform === 'twitter' || platform === 'farcaster' || platform === 'lens') {
      const functionName = `post-to-${platform}`;
      console.log(`Invoking edge function: ${functionName}`);
      
      const { data: responseData, error: responseError } = await supabaseAdmin.functions.invoke(functionName, {
        body: { 
          content,
          mediaUrl,
          mediaType
        }
      });
      
      success = !responseError;
      error = responseError?.message;
      data = responseData;
      
      console.log(`${platform} posting ${success ? 'succeeded' : 'failed'}:`, success ? data : error);
    } 
    // Handle simulated platforms (these would be real API calls in production)
    else if (['facebook', 'instagram', 'tiktok', 'youtubeShorts'].includes(platform)) {
      console.log(`Simulating ${platform} post: ${content}`);
      
      // Platform-specific validation
      if (platform === 'instagram' && !mediaUrl) {
        return { 
          platform, 
          success: false,
          error: "Instagram requires media"
        };
      }
      
      if ((platform === 'tiktok' || platform === 'youtubeShorts') && 
          (!mediaUrl || mediaType !== 'video')) {
        return { 
          platform, 
          success: false,
          error: `${platform === 'tiktok' ? 'TikTok' : 'YouTube Shorts'} requires video content`
        };
      }
      
      // Simulate successful response for supported content
      success = true;
      data = { id: `${platform.substring(0, 2)}-${Date.now()}` };
      console.log(`${platform} posting simulated successfully`);
    }
    
    return { platform, success, error, data };
  } catch (err) {
    console.error(`Error processing ${platform} post:`, err);
    return { 
      platform, 
      success: false, 
      error: err.message || `Failed to process ${platform} post` 
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting scheduled posts processing");
    
    // Get the supabase client with admin privileges for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        auth: {
          persistSession: false,
        }
      }
    );
    
    // Get current time
    const now = new Date().toISOString();
    console.log(`Current timestamp: ${now}`);
    
    // Fetch scheduled posts that are due
    const { data: posts, error: fetchError } = await supabaseAdmin
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true });
    
    if (fetchError) {
      console.error("Error fetching scheduled posts:", fetchError);
      throw fetchError;
    }
    
    console.log(`Found ${posts?.length || 0} posts to process`);
    
    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No posts to process" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Process each post
    const results = [];
    for (const post of posts) {
      try {
        console.log(`Processing post ${post.id} scheduled for ${post.scheduled_at}`);
        
        // Parse platforms
        const platforms = typeof post.platforms === 'string' ? 
          JSON.parse(post.platforms) : post.platforms;
        
        console.log(`Post platforms:`, platforms);
        
        const processingResult = { post_id: post.id, platforms_results: [] };
        const processingPromises = [];
        
        // Process each enabled platform in parallel
        for (const platform of Object.keys(platforms)) {
          if (platforms[platform]) {
            console.log(`Preparing to post to ${platform}`);
            processingPromises.push(
              processPostForPlatform(
                supabaseAdmin, 
                post.id, 
                platform, 
                post.content, 
                post.media_url, 
                post.media_type
              )
            );
          }
        }
        
        // Wait for all platform operations to complete
        console.log(`Waiting for all platform processing to complete`);
        const platformResults = await Promise.all(processingPromises);
        processingResult.platforms_results = platformResults;
        
        console.log(`All platforms processed for post ${post.id}:`, platformResults);
        
        // Update post status to 'completed'
        console.log(`Updating post ${post.id} status to completed`);
        const { error: updateError } = await supabaseAdmin
          .from('scheduled_posts')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString(),
            processing_results: platformResults
          })
          .eq('id', post.id);
        
        if (updateError) {
          console.error(`Error updating post ${post.id}:`, updateError);
          throw updateError;
        }
        
        results.push(processingResult);
        console.log(`Post ${post.id} successfully processed`);
        
      } catch (postError) {
        console.error(`Error processing post ${post.id}:`, postError);
        
        // Mark as failed
        await supabaseAdmin
          .from('scheduled_posts')
          .update({ 
            status: 'failed',
            processed_at: new Date().toISOString(),
            processing_results: [{ error: postError.message }]
          })
          .eq('id', post.id);
        
        results.push({ 
          post_id: post.id, 
          error: postError.message 
        });
      }
    }
    
    console.log(`Processing complete. Processed ${posts.length} scheduled posts`);
    
    return new Response(
      JSON.stringify({ 
        message: `Processed ${posts.length} scheduled posts`, 
        results 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error processing scheduled posts:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process scheduled posts", 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
