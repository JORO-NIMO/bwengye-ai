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

    const { action, timeRange = '7d', eventType } = await req.json();

    console.log('Analytics request:', { userId: user.id, action, timeRange });

    if (action === 'get_dashboard') {
      // Calculate date range
      const now = new Date();
      const daysAgo = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 7;
      const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

      // Get user's total analytics
      const { data: totalEvents } = await supabase
        .from('user_analytics')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Get events by type
      const { data: eventsByType } = await supabase
        .from('user_analytics')
        .select('event_type, event_data')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Get conversations count
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Get messages count and tokens used
      const { data: messages } = await supabase
        .from('messages')
        .select('tokens_used, processing_time_ms, model_used')
        .eq('user_id', user.id)
        .eq('role', 'assistant')
        .gte('created_at', startDate.toISOString());

      // Calculate statistics
      const totalTokens = messages?.reduce((sum, msg) => sum + (msg.tokens_used || 0), 0) || 0;
      const avgProcessingTime = messages?.length > 0 ? 
        messages.reduce((sum, msg) => sum + (msg.processing_time_ms || 0), 0) / messages.length : 0;

      // Model usage statistics
      const modelUsage = messages?.reduce((acc, msg) => {
        if (msg.model_used) {
          acc[msg.model_used] = (acc[msg.model_used] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Event type breakdown
      const eventTypeBreakdown = eventsByType?.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Daily activity (simplified)
      const dailyActivity = [];
      for (let i = daysAgo - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const dayEvents = eventsByType?.filter(event => {
          const eventDate = new Date(event.created_at);
          return eventDate >= dayStart && eventDate < dayEnd;
        }) || [];

        dailyActivity.push({
          date: dayStart.toISOString().split('T')[0],
          events: dayEvents.length,
        });
      }

      return new Response(JSON.stringify({
        timeRange,
        summary: {
          totalEvents: totalEvents?.length || 0,
          totalConversations: conversations?.length || 0,
          totalMessages: messages?.length || 0,
          totalTokensUsed: totalTokens,
          avgProcessingTimeMs: Math.round(avgProcessingTime),
        },
        modelUsage,
        eventTypeBreakdown,
        dailyActivity,
        insights: {
          mostUsedModel: Object.keys(modelUsage).reduce((a, b) => 
            modelUsage[a] > modelUsage[b] ? a : b, 'none'),
          mostCommonEventType: Object.keys(eventTypeBreakdown).reduce((a, b) => 
            eventTypeBreakdown[a] > eventTypeBreakdown[b] ? a : b, 'none'),
          averageTokensPerMessage: messages?.length > 0 ? Math.round(totalTokens / messages.length) : 0,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'log_event') {
      // Log a new analytics event
      const { eventType: logEventType, eventData, sessionId } = await req.json();
      
      await supabase.from('user_analytics').insert({
        user_id: user.id,
        event_type: logEventType,
        event_data: eventData || {},
        session_id: sessionId,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error('Invalid action specified');
    }

  } catch (error) {
    console.error('Error in user-analytics function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});