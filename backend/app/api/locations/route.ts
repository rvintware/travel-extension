import { NextResponse } from 'next/server'
import { supabase, ensureUser } from '@/lib/supabase'
import { createLocationSchema } from '@/lib/validation'
import { handleError, badRequest } from '@/lib/errors'
import { inngest } from '@/lib/inngest'

/**
 * Create a new location
 * POST /api/locations
 * 
 * Body: { userId, countryId, name, originalText, sourceUrl, pageTitle?, category? }
 */
export async function POST(request: Request) {
  console.log('[API] ========== POST /api/locations ==========')
  
  try {
    const body = await request.json()
    console.log('[API] Request body keys:', Object.keys(body))
    console.log('[API] Has screenshot:', !!body.screenshot)
    console.log('[API] Screenshot size:', body.screenshot?.length || 0, 'chars')
    console.log('[API] User ID:', body.userId?.substring(0, 8) + '...')
    
    // Validate input
    const validated = createLocationSchema.parse(body)
    console.log('[API] ✅ Validation passed')
    
    // Ensure user exists
    await ensureUser(validated.userId)
    console.log('[API] ✅ User ensured')
    
    // 🔧 NEW: If no countryId provided, use Uncategorized as placeholder
    let finalCountryId = validated.countryId
    if (!finalCountryId) {
      console.log('[API] No country provided, using Uncategorized placeholder...')
      const { data: uncategorized, error: countryError } = await supabase
        .from('countries')
        .select('id')
        .eq('code', 'XX')
        .single()
      
      if (countryError || !uncategorized) {
        console.error('[API] ❌ Uncategorized country not found!')
        throw new Error('Uncategorized country not found in database. Please run migration: add_uncategorized_country.sql')
      }
      
      finalCountryId = uncategorized.id
      console.log('[API] ✅ Using Uncategorized country:', finalCountryId)
    }
    
    // Insert location with pending status (will be enriched by AI)
    console.log('[API] Inserting location to Supabase...')
    const { data, error } = await supabase
      .from('locations')
      .insert({
        user_id: validated.userId,
        country_id: finalCountryId,
        name: validated.name,
        original_text: validated.originalText,
        source_url: validated.sourceUrl,
        page_title: validated.pageTitle,
        category: validated.category,
        original_context: null, // Not storing complex context anymore
        source_type: 'single_save',
        processing_status: 'pending',
        location_verified: false,
        is_from_itinerary: false,
      })
      .select()
      .single()
    
    if (error) {
      console.error('[API] ❌ Supabase insert error:', error)
      throw error
    }
    
    console.log('[API] ✅ Location created:', data.id)
    
    // Phase 0.3: Trigger AI processing job with screenshot
    if (body.screenshot) {
      console.log('[API] Triggering Inngest job with screenshot...')
      console.log('[API] Event name: location/created')
      console.log('[API] Location ID:', data.id)
      console.log('[API] Screenshot size:', body.screenshot.length, 'chars')
      console.log('[API] Trip ID:', body.tripId || 'none')
      
      try {
        await inngest.send({
          name: 'location/created',
          data: {
            locationId: data.id,
            screenshot: body.screenshot,
            selectedText: validated.originalText,
            url: validated.sourceUrl,
            pageTitle: validated.pageTitle || 'Untitled',
            userId: validated.userId,      // For creating multiple locations
            countryId: validated.countryId, // For creating multiple locations
            tripId: body.tripId || null     // For linking multiple to trip
          }
        })
        console.log('[API] ✅ Inngest event sent successfully!')
      } catch (error) {
        console.error('[API] ❌ Inngest send failed:', error)
        // Don't fail the request - location is saved, just won't be enriched
      }
    } else {
      console.log('[API] ⚠️ No screenshot - skipping AI processing')
    }
    
    console.log('[API] ========== Responding 201 Created ==========')
    return NextResponse.json({ 
      location: data 
    }, { status: 201 })
  } catch (error) {
    console.error('[API] ❌ Request failed:', error)
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

