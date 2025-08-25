import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    const { 
      prompt, 
      provider = 'huggingface', 
      model = 'FLUX.1-schnell',
      size = '1024x1024',
      quality = 'auto'
    } = await req.json();

    console.log('Processing image generation request:', { userId: user.id, provider, model });

    const startTime = Date.now();
    let imageData;
    let tokensUsed = 0;

    if (provider === 'openai' && openaiApiKey) {
      // Use OpenAI for image generation
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt,
          size,
          quality,
          response_format: 'b64_json',
          n: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      imageData = `data:image/png;base64,${data.data[0].b64_json}`;
      tokensUsed = 1; // OpenAI doesn't provide token count for images

    } else if (provider === 'huggingface' && hfToken) {
      // Use Hugging Face for image generation
      const hf = new HfInference(hfToken);
      
      const image = await hf.textToImage({
        inputs: prompt,
        model: 'black-forest-labs/FLUX.1-schnell',
      });

      // Convert the blob to a base64 string
      const arrayBuffer = await image.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      imageData = `data:image/png;base64,${base64}`;
      tokensUsed = 1; // HF doesn't provide token count for images

    } else {
      throw new Error('No valid image generation provider configured');
    }

    const processingTime = Date.now() - startTime;

    // Log analytics
    await supabase.from('user_analytics').insert({
      user_id: user.id,
      event_type: 'ai_image_generation',
      event_data: {
        provider,
        model,
        prompt_length: prompt.length,
        processing_time_ms: processingTime,
        size,
        quality,
      },
    });

    return new Response(JSON.stringify({
      image: imageData,
      provider,
      model,
      processingTime,
      tokensUsed,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-image-generation function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});