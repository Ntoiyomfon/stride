#!/usr/bin/env tsx

/**
 * Apply RLS Fix for User Profiles
 * 
 * This script applies the RLS policy fix to allow service role operations
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyRLSFix() {
  try {
    console.log('🔧 Applying RLS fix for user_profiles...')
    
    // Drop existing insert policy
    console.log('1. Dropping existing insert policy...')
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;'
    })
    
    if (dropError) {
      console.log('Note: Drop policy error (might not exist):', dropError.message)
    }
    
    // Create new insert policy with service role support
    console.log('2. Creating new insert policy with service role support...')
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Users can insert own profile" ON public.user_profiles
        FOR INSERT WITH CHECK (
          auth.uid() = id OR 
          auth.jwt() ->> 'role' = 'service_role'
        );`
    })
    
    if (insertError) {
      console.error('Insert policy error:', insertError)
    } else {
      console.log('✅ Insert policy created successfully')
    }
    
    // Create service role read policy
    console.log('3. Creating service role read policy...')
    const { error: readError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Service role can read all profiles" ON public.user_profiles
        FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');`
    })
    
    if (readError) {
      console.error('Read policy error:', readError)
    } else {
      console.log('✅ Read policy created successfully')
    }
    
    // Create service role update policy
    console.log('4. Creating service role update policy...')
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Service role can update all profiles" ON public.user_profiles
        FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');`
    })
    
    if (updateError) {
      console.error('Update policy error:', updateError)
    } else {
      console.log('✅ Update policy created successfully')
    }
    
    console.log('🎉 RLS fix applied successfully!')
    
  } catch (error) {
    console.error('❌ Error applying RLS fix:', error)
    process.exit(1)
  }
}

applyRLSFix()