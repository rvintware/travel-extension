import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { formatTripExport } from '@/lib/export/format-trip'
import { handleError, notFound } from '@/lib/errors'

/**
 * Export trip as formatted text
 * GET /api/trips/:id/export
 * 
 * Returns:
 * {
 *   exportText: string,  // Formatted text content
 *   filename: string     // Suggested filename
 * }
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log('[Export API] Exporting trip:', id)
    
    // Query trip with all locations in single query
    const { data: tripData, error } = await supabase
      .from('trips')
      .select(`
        id,
        name,
        start_date,
        end_date,
        duration_days,
        trip_locations (
          day_number,
          display_order,
          suggested_time,
          estimated_duration_minutes,
          notes,
          location:locations (
            name,
            address,
            category,
            subcategory,
            user_rating,
            price_level,
            tips,
            sources,
            source_url,
            user_notes
          )
        )
      `)
      .eq('id', id)
      .order('day_number', { foreignTable: 'trip_locations', ascending: true, nullsFirst: false })
      .order('display_order', { foreignTable: 'trip_locations', ascending: true })
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('Trip not found')
      }
      throw error
    }
    
    console.log('[Export API] Trip found:', tripData.name)
    console.log('[Export API] Locations:', tripData.trip_locations?.length || 0)
    
    // Format export text
    const { text, filename } = formatTripExport(tripData as any)
    
    console.log('[Export API] Generated filename:', filename)
    console.log('[Export API] Export text length:', text.length, 'characters')
    
    return NextResponse.json({
      exportText: text,
      filename
    })
    
  } catch (error) {
    console.error('[Export API] Error:', error)
    return handleError(error)
  }
}

