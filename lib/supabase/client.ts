import { createSupabaseClient } from './utils'

// Create client lazily to avoid build-time errors when env vars are missing
let _supabase: ReturnType<typeof createSupabaseClient> | null = null

export const supabase = (() => {
  if (!_supabase) {
    _supabase = createSupabaseClient()
  }
  return _supabase
})()