-- Create user profiles table for extended user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  language_preference TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table for chat history
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  context JSONB DEFAULT '{}',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for individual chat messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  model_used TEXT,
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI models table for model management
CREATE TABLE public.ai_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'huggingface', 'local')),
  model_type TEXT NOT NULL CHECK (model_type IN ('chat', 'completion', 'embedding', 'image', 'audio')),
  capabilities TEXT[] DEFAULT '{}',
  max_tokens INTEGER,
  cost_per_token DECIMAL(10, 8),
  is_active BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user analytics table for usage tracking
CREATE TABLE public.user_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.conversations FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations" 
ON public.messages FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

-- Create RLS policies for AI models (read-only for users)
CREATE POLICY "Users can view active AI models" 
ON public.ai_models FOR SELECT 
USING (is_active = true);

-- Create RLS policies for user analytics
CREATE POLICY "Users can view their own analytics" 
ON public.user_analytics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analytics" 
ON public.user_analytics FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default AI models
INSERT INTO public.ai_models (name, provider, model_type, capabilities, max_tokens, configuration) VALUES
('gpt-5-2025-08-07', 'openai', 'chat', ARRAY['text', 'reasoning', 'code'], 200000, '{"temperature_supported": false}'),
('gpt-4.1-2025-04-14', 'openai', 'chat', ARRAY['text', 'reasoning', 'code'], 128000, '{"temperature_supported": true}'),
('gpt-5-mini-2025-08-07', 'openai', 'chat', ARRAY['text', 'code', 'fast'], 128000, '{"temperature_supported": false}'),
('gpt-image-1', 'openai', 'image', ARRAY['image_generation'], null, '{"sizes": ["1024x1024", "1536x1024", "1024x1536"]}'),
('FLUX.1-schnell', 'huggingface', 'image', ARRAY['image_generation', 'fast'], null, '{"endpoint": "black-forest-labs/FLUX.1-schnell"}'),
('whisper-tiny.en', 'huggingface', 'audio', ARRAY['speech_recognition', 'offline'], null, '{"endpoint": "onnx-community/whisper-tiny.en"}');