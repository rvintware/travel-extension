import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/errors'

/**
 * Get all countries
 * GET /api/countries
 * 
 * Returns list of all countries sorted by name
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    
    return NextResponse.json({ 
      countries: data 
    })
  } catch (error) {
    return handleError(error)
  }
}

