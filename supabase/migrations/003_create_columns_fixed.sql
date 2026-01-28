-- Create columns table
-- This table stores columns within boards for organizing job applications

CREATE TABLE IF NOT EXISTS public.columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON public.columns(board_id);
CREATE INDEX IF NOT EXISTS idx_columns_order_index ON public.columns(order_index);
CREATE INDEX IF NOT EXISTS idx_columns_board_order ON public.columns(board_id, order_index);
CREATE INDEX IF NOT EXISTS idx_columns_created_at ON public.columns(created_at);

-- Create unique constraint on (board_id, order_index) to prevent duplicate ordering
CREATE UNIQUE INDEX IF NOT EXISTS idx_columns_board_order_unique ON public.columns(board_id, order_index);

-- Create updated_at trigger for columns
CREATE TRIGGER trigger_columns_updated_at
  BEFORE UPDATE ON public.columns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;

-- Users can only view columns from their own boards
CREATE POLICY "Users can view own board columns" ON public.columns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.boards 
      WHERE boards.id = columns.board_id 
      AND boards.user_id = auth.uid()
    )
  );

-- Users can insert columns into their own boards
CREATE POLICY "Users can insert columns into own boards" ON public.columns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards 
      WHERE boards.id = columns.board_id 
      AND boards.user_id = auth.uid()
    )
  );

-- Users can update columns in their own boards
CREATE POLICY "Users can update own board columns" ON public.columns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.boards 
      WHERE boards.id = columns.board_id 
      AND boards.user_id = auth.uid()
    )
  );

-- Users can delete columns from their own boards
CREATE POLICY "Users can delete own board columns" ON public.columns
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.boards 
      WHERE boards.id = columns.board_id 
      AND boards.user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT ALL ON public.columns TO authenticated;
GRANT SELECT ON public.columns TO anon;