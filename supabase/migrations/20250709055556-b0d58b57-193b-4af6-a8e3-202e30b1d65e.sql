
-- Create search_history table
CREATE TABLE public.search_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  search_query text NOT NULL,
  filters_applied jsonb DEFAULT '{}'::jsonb,
  results_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) for search_history
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Create policies for search_history
CREATE POLICY "Users can view their own search history" 
  ON public.search_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search history" 
  ON public.search_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" 
  ON public.search_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create chat_history table
CREATE TABLE public.chat_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  list_id uuid REFERENCES public.paper_lists(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'New Chat',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) for chat_history
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_history
CREATE POLICY "Users can view their own chat history" 
  ON public.chat_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat history" 
  ON public.chat_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat history" 
  ON public.chat_history 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history" 
  ON public.chat_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_search_history_user_id_created_at ON public.search_history(user_id, created_at DESC);
CREATE INDEX idx_chat_history_user_id_created_at ON public.chat_history(user_id, created_at DESC);
CREATE INDEX idx_chat_history_list_id ON public.chat_history(list_id);
