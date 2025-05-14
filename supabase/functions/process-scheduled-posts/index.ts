
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
        console.log(`Processing post ${post.id}`);
        
        // Parse platforms
        const platforms = typeof post.platforms === 'string' ? 
          JSON.parse(post.platforms) : post.platforms;
        
        const processingResult = { post_id: post.id, platforms_results: [] };
        
        // Post to each enabled platform
        if (platforms.twitter) {
          const { data, error } = await supabaseAdmin.functions.invoke('post-to-twitter', {
            body: { 
              content: post.content,
              mediaUrl: post.media_url,
              mediaType: post.media_type
            }
          });
          
          const result = { platform: 'twitter', success: !error, error: error?.message };
          processingResult.platforms_results.push(result);
        }
        
        if (platforms.farcaster) {
          const { data, error } = await supabaseAdmin.functions.invoke('post-to-farcaster', {
            body: { 
              content: post.content,
              mediaUrl: post.media_url,
              mediaType: post.media_type
            }
          });
          
          const result = { platform: 'farcaster', success: !error, error: error?.message };
          processingResult.platforms_results.push(result);
        }
        
        if (platforms.lens) {
          // For Lens, we would need to get the user's wallet and handle
          const { data, error } = await supabaseAdmin.functions.invoke('post-to-lens', {
            body: { 
              content: post.content, 
              mediaUrl: post.media_url,
              mediaType: post.media_type
            }
          });
          
          const result = { platform: 'lens', success: !error, error: error?.message };
          processingResult.platforms_results.push(result);
        }
        
        // Handle new platforms
        
        if (platforms.facebook) {
          // Simulate Facebook posting
          console.log("Simulating Facebook post:", post.content);
          const result = { 
            platform: 'facebook', 
            success: true,
            data: { id: 'fb-' + Date.now() } 
          };
          processingResult.platforms_results.push(result);
        }
        
        if (platforms.instagram) {
          // Simulate Instagram posting (requires media)
          console.log("Simulating Instagram post:", post.content);
          
          const success = !!post.media_url;
          const result = { 
            platform: 'instagram', 
            success: success,
            error: success ? undefined : "Instagram requires media",
            data: success ? { id: 'ig-' + Date.now() } : undefined 
          };
          processingResult.platforms_results.push(result);
        }
        
        if (platforms.tiktok) {
          // Simulate TikTok posting (requires video)
          console.log("Simulating TikTok post:", post.content);
          
          const success = post.media_url && post.media_type === 'video';
          const result = { 
            platform: 'tiktok', 
            success: success,
            error: success ? undefined : "TikTok requires video content",
            data: success ? { id: 'tt-' + Date.now() } : undefined 
          };
          processingResult.platforms_results.push(result);
        }
        
        if (platforms.youtubeShorts) {
          // Simulate YouTube Shorts posting (requires video)
          console.log("Simulating YouTube Shorts post:", post.content);
          
          const success = post.media_url && post.media_type === 'video';
          const result = { 
            platform: 'youtubeShorts', 
            success: success,
            error: success ? undefined : "YouTube Shorts requires video content",
            data: success ? { id: 'yt-' + Date.now() } : undefined 
          };
          processingResult.platforms_results.push(result);
        }
        
        // Update post status to 'completed'
        const { error: updateError } = await supabaseAdmin
          .from('scheduled_posts')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString(),
            processing_results: processingResult.platforms_results
          })
          .eq('id', post.id);
        
        if (updateError) {
          console.error(`Error updating post ${post.id}:`, updateError);
          throw updateError;
        }
        
        results.push(processingResult);
        
      } catch (postError) {
        console.error(`Error processing post ${post.id}:`, postError);
        
        // Mark as failed
        await supabaseAdmin
          .from('scheduled_posts')
          .update({ 
            status: 'failed',
            processed_at: new Date().toISOString(),
            processing_results: { error: postError.message }
          })
          .eq('id', post.id);
        
        results.push({ 
          post_id: post.id, 
          error: postError.message 
        });
      }
    }
    
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
