/**
 * Environment Setup for Tests
 * 
 * This file loads environment variables before tests run.
 */

import { config } from 'dotenv'
import { join } from 'path'

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') })

// Ensure required environment variables are set for tests
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL not set. Some tests may fail.')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not set. Some tests may fail.')
}