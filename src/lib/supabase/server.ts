import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const SUPABASE_URL = 'https://kmayffmsfsdmmmhupmid.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttYXlmZm1zZnNkbW1taHVwbWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MjI0MDIsImV4cCI6MjA5NjI5ODQwMn0.0Ht8urqmNESQqH2H6wVbxJr0R4pe3rJ4HxhXMaMgx8U'

export function createServerClient() {
  return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
