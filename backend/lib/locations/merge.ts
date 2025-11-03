import { supabase } from '../supabase'
import type { TipObject } from '../types'

/**
 * Merges tips from new capture into existing location
 * Deduplicates by text similarity (case-insensitive)
 * 
 * @param existingTips - Current tips in database
 * @param newTips - Tips from new capture
 * @returns Merged and deduplicated tips array
 */
export function mergeTips(
  existingTips: TipObject[],
  newTips: TipObject[]
): TipObject[] {
  // Create a set of normalized existing tips for fast lookup
  const normalized = new Set(
    existingTips.map(t => t.text.toLowerCase().trim())
  )
  
  // Filter out new tips that are duplicates
  const unique = newTips.filter(
    t => !normalized.has(t.text.toLowerCase().trim())
  )
  
  // Return combined array
  return [...existingTips, ...unique]
}

/**
 * Checks if a location with this place_id already exists for this user
 * 
 * @param userId - User UUID
 * @param placeId - Google Places ID
 * @returns Existing location or null
 */
export async function findExistingLocation(
  userId: string,
  placeId: string
) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('user_id', userId)
    .eq('place_id', placeId)
    .maybeSingle()
  
  if (error) throw error
  return data
}

/**
 * Merges new data into existing location
 * Updates tips and sources arrays
 * 
 * @param locationId - Existing location UUID
 * @param newData - New tips and source URL
 * @returns Updated location and count of tips added
 */
export async function mergeIntoExisting(
  locationId: string,
  newData: {
    tips: TipObject[]
    sourceUrl: string
    sources?: string[]
  }
) {
  // Fetch current location data
  const { data: current, error: fetchError } = await supabase
    .from('locations')
    .select('tips, sources')
    .eq('id', locationId)
    .single()
  
  if (fetchError) throw fetchError
  if (!current) throw new Error('Location not found')
  
  // Merge tips (deduplicate)
  const existingTips = Array.isArray(current.tips) ? current.tips as TipObject[] : []
  const mergedTips = mergeTips(existingTips, newData.tips)
  
  // Merge sources (deduplicate URLs)
  const existingSources = Array.isArray(current.sources) ? current.sources as string[] : []
  const newSources = [...new Set([...existingSources, newData.sourceUrl])]
  
  console.log('[Merge] Merging location:', locationId)
  console.log('[Merge] Tips before:', existingTips.length)
  console.log('[Merge] Tips after:', mergedTips.length)
  console.log('[Merge] Sources before:', existingSources.length)
  console.log('[Merge] Sources after:', newSources.length)
  
  // Update database
  const { data: updated, error: updateError } = await supabase
    .from('locations')
    .update({
      tips: mergedTips,
      sources: newSources,
      updated_at: new Date().toISOString()
    })
    .eq('id', locationId)
    .select()
    .single()
  
  if (updateError) throw updateError
  
  return {
    location: updated,
    tipsAdded: mergedTips.length - existingTips.length
  }
}

