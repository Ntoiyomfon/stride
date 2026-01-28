-- Fix RLS policies for user_profiles to allow service role operations
-- This migration adds policies to allow the service role to create profiles

-- Drop existing insert policy and recreate with service role support
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Allow users to insert their own profile OR allow service role to insert any profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Also add a policy to allow service role to read all profiles (for debugging)
CREATE POLICY "Service role can read all profiles" ON public.user_profiles
  FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow service role to update any profile (for admin operations)
CREATE POLICY "Service role can update all profiles" ON public.user_profiles
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');