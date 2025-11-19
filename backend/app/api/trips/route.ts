import { NextResponse } from 'next/server'
import { supabase, ensureUser } from '@/lib/supabase'
import { createTripSchema } from '@/lib/validation'
import { handleError, badRequest } from '@/lib/errors'

/**
 * Create a new trip
 * POST /api/trips
 * 
 * Body: { userId, countryId, name, description?, startDate?, endDate?, durationDays?, isActive? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log('[API] Creating trip with countries:', body.countryIds?.length || 0)
    
    // Validate
    const { userId, name, countryIds, durationDays, isActive, description, startDate, endDate } = body
    
    // countryIds must be an array, but can be empty
    if (!Array.isArray(countryIds)) {
      return NextResponse.json(
        { error: 'countryIds must be an array' },
        { status: 400 }
      )
    }
    
    console.log('[API] Creating trip with', countryIds.length, 'countries')
    
    // Ensure user exists
    await ensureUser(userId)
    
    // Create trip (country_id can be null if no countries selected)
    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        user_id: userId,
        country_id: countryIds.length > 0 ? countryIds[0] : null,  // Nullable
        name,
        description,
        start_date: startDate || null,  // Save start date if provided
        end_date: endDate || null,      // Save end date if provided
        duration_days: durationDays,
        is_itinerary: false,
        is_active: isActive || false,
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Add all countries to junction table (only if countries selected)
    if (trip && countryIds.length > 0) {
      const { error: countriesError } = await supabase
        .from('trip_countries')
        .insert(
          countryIds.map((countryId: string) => ({
            trip_id: trip.id,
            country_id: countryId
          }))
        )
      
      if (countriesError) {
        console.error('[API] Failed to add countries:', countriesError)
        // Don't fail the whole request, trip is still created
      }
    }
    
    console.log('[API] ✅ Trip created with', countryIds.length, 'countries')
    
    return NextResponse.json({ 
      trip: {
        ...trip,
        countryCount: countryIds.length
      }
    }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * Get trips for a user
 * GET /api/trips?userId=xxx
 * 
 * Query params:
 * - userId (required): User's UUID
 * 
 * Returns trips with country info and location count
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      badRequest('userId query parameter is required')
    }
    
    // Get trips with country info from junction table
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select(`
        *,
        country:countries(id, name, code, emoji),
        trip_countries(country:countries(id, name, code, emoji))
      `)
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
    
    if (tripsError) throw tripsError
    
    // Get location counts and format response
    const tripsWithCounts = await Promise.all(
      (trips || []).map(async (trip) => {
        const { count, error } = await supabase
          .from('trip_locations')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', trip.id)
        
        if (error) console.error('Error counting locations:', error)
        
        // Extract countries from junction table
        const countries = trip.trip_countries?.map((tc: any) => tc.country) || []
        
        return {
          ...trip,
          locationCount: count || 0,
          countries: countries,  // Array of country objects
          countryCount: countries.length
        }
      })
    )
    
    return NextResponse.json({ 
      trips: tripsWithCounts,
      count: tripsWithCounts.length
    })
  } catch (error) {
    return handleError(error)
  }
}

