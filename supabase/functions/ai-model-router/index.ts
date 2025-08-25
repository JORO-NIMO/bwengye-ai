import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
      taskType, 
      complexity = 'medium', 
      priority = 'normal',
      content,
      userPreferences = {}
    } = await req.json();

    console.log('Model routing request:', { userId: user.id, taskType, complexity });

    // Get user profile and preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferences, language_preference')
      .eq('user_id', user.id)
      .single();

    // Get available models
    const { data: models } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true);

    if (!models || models.length === 0) {
      throw new Error('No active AI models available');
    }

    // Model selection logic based on task type and complexity
    let selectedModel;
    
    switch (taskType) {
      case 'chat':
      case 'text':
        if (complexity === 'low' || priority === 'fast') {
          // Use fastest model for simple tasks
          selectedModel = models.find(m => m.name === 'gpt-5-mini-2025-08-07') || 
                         models.find(m => m.model_type === 'chat');
        } else if (complexity === 'high' || content?.length > 5000) {
          // Use most capable model for complex tasks
          selectedModel = models.find(m => m.name === 'gpt-5-2025-08-07') || 
                         models.find(m => m.name === 'gpt-4.1-2025-04-14');
        } else {
          // Default to balanced model
          selectedModel = models.find(m => m.name === 'gpt-5-mini-2025-08-07');
        }
        break;

      case 'code':
        // Prefer models with code capabilities
        selectedModel = models.find(m => 
          m.capabilities?.includes('code') && 
          (m.name === 'gpt-5-2025-08-07' || m.name === 'o4-mini-2025-04-16')
        );
        break;

      case 'reasoning':
      case 'analysis':
        // Use reasoning-optimized models
        selectedModel = models.find(m => m.name === 'o3-2025-04-16') ||
                       models.find(m => m.name === 'gpt-5-2025-08-07');
        break;

      case 'image':
        selectedModel = models.find(m => m.model_type === 'image');
        break;

      case 'audio':
      case 'speech':
        selectedModel = models.find(m => m.model_type === 'audio');
        break;

      default:
        selectedModel = models.find(m => m.name === 'gpt-5-mini-2025-08-07');
    }

    if (!selectedModel) {
      selectedModel = models[0]; // Fallback to first available model
    }

    // Calculate estimated cost and processing time
    const estimatedTokens = content ? Math.ceil(content.length / 4) : 100;
    const estimatedCost = selectedModel.cost_per_token ? 
      (estimatedTokens * parseFloat(selectedModel.cost_per_token.toString())) : 0;

    // Get estimated processing time based on model and complexity
    let estimatedProcessingTime = 1000; // Base 1 second
    if (selectedModel.name.includes('gpt-5')) estimatedProcessingTime *= 1.5;
    if (selectedModel.name.includes('o3')) estimatedProcessingTime *= 3;
    if (complexity === 'high') estimatedProcessingTime *= 2;

    // Log analytics
    await supabase.from('user_analytics').insert({
      user_id: user.id,
      event_type: 'model_routing',
      event_data: {
        task_type: taskType,
        complexity,
        priority,
        selected_model: selectedModel.name,
        estimated_tokens: estimatedTokens,
        estimated_cost: estimatedCost,
      },
    });

    // Return routing decision
    return new Response(JSON.stringify({
      selectedModel: {
        name: selectedModel.name,
        provider: selectedModel.provider,
        modelType: selectedModel.model_type,
        capabilities: selectedModel.capabilities,
        maxTokens: selectedModel.max_tokens,
        configuration: selectedModel.configuration,
      },
      routing: {
        taskType,
        complexity,
        priority,
        reason: `Selected ${selectedModel.name} for ${taskType} task with ${complexity} complexity`,
      },
      estimates: {
        tokens: estimatedTokens,
        cost: estimatedCost,
        processingTimeMs: estimatedProcessingTime,
      },
      userContext: {
        languagePreference: profile?.language_preference || 'en',
        preferences: { ...profile?.preferences, ...userPreferences },
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-model-router function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});