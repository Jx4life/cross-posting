
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name } = await req.json()
    
    console.log('Getting secret:', name)
    
    if (!name) {
      console.error('No secret name provided')
      return new Response(
        JSON.stringify({ error: 'Secret name is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const secret = Deno.env.get(name)
    
    console.log('Secret exists:', !!secret)
    
    if (!secret) {
      console.error(`Secret ${name} not found in environment`)
      return new Response(
        JSON.stringify({ error: `Secret ${name} not found` }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Returning secret successfully')
    return new Response(
      JSON.stringify({ value: secret }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error getting secret:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
