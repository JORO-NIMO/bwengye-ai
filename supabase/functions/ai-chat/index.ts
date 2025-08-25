import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

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

    const { message, conversationId, modelName = 'gpt-5-mini-2025-08-07' } = await req.json();

    console.log('Processing chat request:', { userId: user.id, modelName, conversationId });

    // Get AI model configuration
    const { data: aiModel } = await supabase
      .from('ai_models')
      .select('*')
      .eq('name', modelName)
      .eq('is_active', true)
      .single();

    if (!aiModel) {
      throw new Error(`Model ${modelName} not found or inactive`);
    }

    // Create or get conversation
    let conversation;
    if (conversationId) {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      conversation = data;
    } else {
      const { data } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50) + '...',
        })
        .select()
        .single();
      conversation = data;
    }

    // Get conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('content, role')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(50);

    // Prepare OpenAI messages
    const openaiMessages = [
      {
        role: 'system',
        content: `You are Bwengye AI, an advanced AI assistant designed for African contexts. You are intelligent, helpful, and culturally aware. You can communicate in English, Luganda, Swahili, and other African languages. You excel at reasoning, coding, research, and providing contextually relevant assistance.`
      },
      ...(messages || []),
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const startTime = Date.now();
    
    // Configure request based on model capabilities
    const isNewerModel = ['gpt-5-2025-08-07', 'gpt-5-mini-2025-08-07', 'gpt-5-nano-2025-08-07', 'o3-2025-04-16', 'o4-mini-2025-04-16'].includes(modelName);
    
    const requestBody: any = {
      model: modelName,
      messages: openaiMessages,
    };

    // Add model-specific parameters
    if (isNewerModel) {
      requestBody.max_completion_tokens = Math.min(4000, aiModel.max_tokens || 4000);
      // Newer models don't support temperature
    } else {
      requestBody.max_tokens = Math.min(4000, aiModel.max_tokens || 4000);
      requestBody.temperature = 0.7;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;
    const processingTime = Date.now() - startTime;
    const tokensUsed = data.usage?.total_tokens || 0;

    // Save user message
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      user_id: user.id,
      content: message,
      role: 'user',
    });

    // Save assistant message
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      user_id: user.id,
      content: assistantMessage,
      role: 'assistant',
      model_used: modelName,
      tokens_used: tokensUsed,
      processing_time_ms: processingTime,
    });

    // Log analytics
    await supabase.from('user_analytics').insert({
      user_id: user.id,
      event_type: 'ai_chat',
      event_data: {
        model_used: modelName,
        tokens_used: tokensUsed,
        processing_time_ms: processingTime,
        conversation_id: conversation.id,
      },
    });

    return new Response(JSON.stringify({
      message: assistantMessage,
      conversationId: conversation.id,
      tokensUsed,
      processingTime,
      model: modelName,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});