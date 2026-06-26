/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Anon key is safe for client-side reads (SELECT with RLS).
// All writes go through /api serverless functions using SUPABASE_SERVICE_ROLE_KEY.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function today(): string {
  return new Date().toISOString().split('T')[0]
}
