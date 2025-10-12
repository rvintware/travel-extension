import { NextResponse } from 'next/server'
import { supabase, ensureUser } from '@/lib/supabase'
import { createLocationSchema } from '@/lib/validation'
import { handleError, badRequest } from '@/lib/errors'

/**
 * Create a new location
 * POST /api/locations
 * 
 * Body: { userId, countryId, name, originalText, sourceUrl, pageTitle?, category? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = createLocationSchema.parse(body)
    
    // Ensure user exists
    await ensureUser(validated.userId)
    
    // Insert location
    const { data, error } = await supabase
      .from('locations')
      .insert({
        user_id: validated.userId,
        country_id: validated.countryId,
        name: validated.name,
        original_text: validated.originalText,
        source_url: validated.sourceUrl,
        page_title: validated.pageTitle,
        category: validated.category,
        source_type: 'single_save',
        processing_status: 'pending',
        location_verified: false,
        is_from_itinerary: false,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      location: data 
    }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * Get locations
 * GET /api/locations?userId=xxx&countryId=xxx
 * 
 * Query params:
 * - userId (required): User's UUID
 * - countryId (optional): Filter by country
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const countryId = searchParams.get('countryId')
    
    if (!userId) {
      badRequest('userId query parameter is required')
    }
    
    let query = supabase
      .from('locations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (countryId) {
      query = query.eq('country_id', countryId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ 
      locations: data,
      count: data.length
    })
  } catch (error) {
    return handleError(error)
  }
}

