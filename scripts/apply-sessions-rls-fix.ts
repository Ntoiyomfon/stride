#!/usr/bin/env tsx

/**
 * Apply Sessions RLS Fix
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applySessionsRLSFix() {
  try {
    console.log('🔧 Applying sessions RLS fix...')
    
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '007_fix_sessions_rls.sql')
    const sql = readFileSync(migrationPath, 'utf-8')
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📝 Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue
      
      console.log(`${i + 1}. ${statement.substring(0, 50)}...`)
      
      try {
        const { error } = await supabase.rpc('exec', { sql: statement })
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error)
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err)
      }
    }
    
    console.log('🎉 Sessions RLS fix completed!')
    
  } catch (error) {
    console.error('❌ Error applying sessions RLS fix:', error)
  }
}

applySessionsRLSFix()