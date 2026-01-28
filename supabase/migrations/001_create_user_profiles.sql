-- Create user_profiles table
-- This table extends Supabase's built-in auth.users with application-specific profile data

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  profile_picture_data TEXT, -- Base64 encoded image data
  profile_picture_updated_at TIMESTAMPTZ,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  accent_color TEXT DEFAULT 'blue' CHECK (accent_color IN ('red', 'blue', 'green', 'yellow', 'gray', 'pink')),
  notifications JSONB DEFAULT '{
    "emailNotifications": true,
    "weeklySummary": false,
    "defaultBoardView": "kanban"
  }'::jsonb,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_backup_codes TEXT[],
  auth_providers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read and update their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to automatically create user profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;