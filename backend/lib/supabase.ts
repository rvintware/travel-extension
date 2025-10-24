import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable')
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_KEY environment variable')
}

// Server-side client using service key (bypasses RLS)
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Ensures a user exists in the database
 * Creates the user if they don't exist
 */
export async function ensureUser(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()
  
  if (error && error.code === 'PGRST116') {
    // User doesn't exist, create it
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ id: userId })
      .select('id')
      .single()
    
    if (insertError) throw insertError
    return newUser.id
  }
  
  if (error) throw error
  
  // Update last_active timestamp
  await supabase
    .from('users')
    .update({ last_active: new Date().toISOString() })
    .eq('id', userId)
  
  return data.id
}

