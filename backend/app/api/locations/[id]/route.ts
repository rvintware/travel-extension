import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { updateLocationSchema } from '@/lib/validation'
import { handleError, notFound } from '@/lib/errors'
import type { Database } from '@/lib/types'

type LocationUpdate = Database['public']['Tables']['locations']['Update']

/**
 * Get a single location
 * GET /api/locations/:id
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        notFound('Location not found')
      }
      throw error
    }
    
    return NextResponse.json({ location: data })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * Update a location
 * PATCH /api/locations/:id
 * 
 * Body: { name?, category?, summary?, userNotes?, userRating?, isFavorite? }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validate input
    const validated = updateLocationSchema.parse(body)
    
    // Build update object with snake_case keys
    const updateData: Record<string, any> = {}
    
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.category !== undefined) updateData.category = validated.category
    if (validated.summary !== undefined) updateData.summary = validated.summary
    if (validated.userNotes !== undefined) updateData.user_notes = validated.userNotes
    if (validated.userRating !== undefined) updateData.user_rating = validated.userRating
    if (validated.isFavorite !== undefined) updateData.is_favorite = validated.isFavorite
    
    // Update location
    // @ts-ignore - Supabase types issue with dynamic updates
    const { data, error } = await supabase
      .from('locations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        notFound('Location not found')
      }
      throw error
    }
    
    return NextResponse.json({ location: data })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * Delete a location permanently
 * DELETE /api/locations/:id
 * 
 * This removes the location from the pool and cascades to all trips
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleError(error)
  }
}

