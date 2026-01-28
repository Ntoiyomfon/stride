-- Create boards table
-- This table stores job application boards owned by users

CREATE TABLE IF NOT EXISTS public.boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON public.boards(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_created_at ON public.boards(created_at);
CREATE INDEX IF NOT EXISTS idx_boards_name ON public.boards(name);

-- Create updated_at trigger for boards
CREATE TRIGGER trigger_boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Users can only view their own boards
CREATE POLICY "Users can view own boards" ON public.boards
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own boards
CREATE POLICY "Users can insert own boards" ON public.boards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own boards
CREATE POLICY "Users can update own boards" ON public.boards
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own boards
CREATE POLICY "Users can delete own boards" ON public.boards
  FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.boards TO authenticated;
GRANT SELECT ON public.boards TO anon;