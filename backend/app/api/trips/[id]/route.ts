import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { updateTripSchema } from '@/lib/validation'
import { handleError, notFound } from '@/lib/errors'
import type { Database } from '@/lib/types'

type TripUpdate = Database['public']['Tables']['trips']['Update']

/**
 * Get a single trip
 * GET /api/trips/:id
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        country:countries(id, name, code, emoji)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        notFound('Trip not found')
      }
      throw error
    }
    
    // Get location count
    const { count } = await supabase
      .from('trip_locations')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', id)
    
    return NextResponse.json({ 
      trip: {
        ...data,
        locationCount: count || 0
      }
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * Update a trip
 * PATCH /api/trips/:id
 * 
 * Body: { name?, description?, startDate?, endDate?, durationDays?, isActive?, isArchived? }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validate input
    const validated = updateTripSchema.parse(body)
    
    // Build update object with snake_case keys
    const updateData: Record<string, any> = {}
    
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.startDate !== undefined) updateData.start_date = validated.startDate
    if (validated.endDate !== undefined) updateData.end_date = validated.endDate
    if (validated.durationDays !== undefined) updateData.duration_days = validated.durationDays
    if (validated.isActive !== undefined) updateData.is_active = validated.isActive
    if (validated.isArchived !== undefined) updateData.is_archived = validated.isArchived
    
    // If setting a trip as active, deactivate all others for this user
    if (validated.isActive === true) {
      // First get the trip to know the user_id
      const { data: trip } = await supabase
        .from('trips')
        .select('user_id')
        .eq('id', id)
        .single()
      
      if (trip) {
        await supabase
          .from('trips')
          .update({ is_active: false })
          .eq('user_id', trip.user_id)
          .neq('id', id)
      }
    }
    
    // Update trip
    // @ts-ignore - Supabase types issue with dynamic updates
    const { data, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        notFound('Trip not found')
      }
      throw error
    }
    
    return NextResponse.json({ trip: data })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * Delete a trip
 * DELETE /api/trips/:id
 * 
 * This removes the trip and all trip_locations links (cascades)
 * Locations remain in the pool
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleError(error)
  }
}

