
-- Enable authentication
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create paper_lists table (like Pinterest boards)
CREATE TABLE public.paper_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create papers table to store saved papers
CREATE TABLE public.papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES public.paper_lists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  authors JSONB NOT NULL DEFAULT '[]',
  abstract TEXT,
  publication_year INTEGER,
  journal TEXT,
  external_id TEXT, -- for OpenAlex ID or similar
  summary JSONB, -- for AI-generated summaries
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_sessions table
CREATE TABLE public.chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  list_id UUID REFERENCES public.paper_lists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for paper_lists
CREATE POLICY "Users can view own lists" ON public.paper_lists
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own lists" ON public.paper_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lists" ON public.paper_lists
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lists" ON public.paper_lists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for papers
CREATE POLICY "Users can view papers in own lists" ON public.papers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.paper_lists 
      WHERE id = papers.list_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Users can add papers to own lists" ON public.papers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.paper_lists 
      WHERE id = papers.list_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete papers from own lists" ON public.papers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.paper_lists 
      WHERE id = papers.list_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat sessions" ON public.chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in own sessions" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE id = chat_messages.session_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create messages in own sessions" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE id = chat_messages.session_id AND user_id = auth.uid()
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_paper_lists_user_id ON public.paper_lists(user_id);
CREATE INDEX idx_papers_list_id ON public.papers(list_id);
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_list_id ON public.chat_sessions(list_id);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
