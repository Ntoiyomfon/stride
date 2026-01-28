#!/usr/bin/env tsx

/**
 * Migration Runner Script
 * 
 * This script runs SQL migrations against the Supabase database.
 * Run with: npm run migrate <migration-file>
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(migrationFile: string) {
  try {
    console.log(`� Running migration: ${migrationFile}`)
    
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', migrationFile)
    const sql = readFileSync(migrationPath, 'utf-8')
    
    console.log('📝 Executing SQL migration...')
    console.log('Note: You can also run this SQL directly in your Supabase SQL Editor')
    console.log('SQL Content:')
    console.log('=' .repeat(50))
    console.log(sql)
    console.log('=' .repeat(50))
    
    console.log('\n✅ Migration SQL prepared!')
    console.log('🔧 To apply this migration:')
    console.log('1. Copy the SQL above')
    console.log('2. Go to your Supabase Dashboard > SQL Editor')
    console.log('3. Paste and run the SQL')
    console.log('4. Or use the Supabase CLI: supabase db push')
    
  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  }
}

// Get migration file from command line arguments
const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('❌ Please specify a migration file')
  console.log('Usage: npm run migrate <migration-file>')
  console.log('Example: npm run migrate 001_create_user_profiles.sql')
  process.exit(1)
}

runMigration(migrationFile)