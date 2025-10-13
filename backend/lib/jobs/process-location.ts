import { inngest } from '../inngest'
import { supabase } from '../supabase'
import { extractFromScreenshot, countLocations, extractMultipleLocations } from '../ai/extract'
import { searchGooglePlaces } from '../places/search'

/**
 * Inngest function to process location(s) with AI and Google Places
 * 
 * Pipeline:
 * 1. Count locations in highlighted text
 * 2. If 1: Update placeholder with enriched data
 * 3. If >1: Extract all, create separate entries, delete placeholder
 */
export const processLocation = inngest.createFunction(
  { 
    id: 'process-location',
    retries: 3
  },
  { event: 'location/created' },
  
  async ({ event, step }) => {
    const { 
      locationId,      // Placeholder location ID
      screenshot, 
      selectedText, 
      url, 
      pageTitle,
      userId,          // For creating multiple locations
      countryId,       // For creating multiple locations
      tripId           // Optional: for linking to trip
    } = event.data
    
    console.log(`[Job] Processing location ${locationId}`)
    console.log(`[Job] Has tripId:`, !!tripId)
    
    // Mark placeholder as processing
    await step.run('mark-processing', async () => {
      await supabase
        .from('locations')
        .update({ processing_status: 'processing' })
        .eq('id', locationId)
    })
    
    // STEP 1: Count how many locations
    const count = await step.run('count-locations', async () => {
      return await countLocations(screenshot, selectedText)
    })
    
    console.log(`[Job] Count: ${count} locations`)
    
    if (count === 0) {
      // No locations found
      await supabase
        .from('locations')
        .update({ 
          processing_status: 'error',
          error_message: 'No locations detected in highlighted text'
        })
        .eq('id', locationId)
      return { success: false, reason: 'No locations found' }
    }
    
    if (count === 1) {
      // ==================== SINGLE LOCATION FLOW ====================
      console.log('[Job] Single location - updating placeholder')
      
      const extracted = await step.run('extract-single', async () => {
        return await extractFromScreenshot(screenshot, selectedText, url, pageTitle)
      })
      
      const place = await step.run('google-places-single', async () => {
        if (extracted.confidence < 0.5) return null
        return await searchGooglePlaces(extracted.location_name)
      })
      
      const updated = await step.run('update-placeholder', async () => {
        const updateData: any = {
          name: place?.name || extracted.location_name,
          address: place?.address || extracted.address || extracted.neighborhood,
          lat: place?.lat || null,
          lng: place?.lng || null,
          category: extracted.category,
          subcategory: extracted.subcategory,
          summary: extracted.summary,
          tips: extracted.tips,
          photos: place?.photos || [],
          place_id: place?.place_id || null,
          location_verified: !!place,
          confidence_score: extracted.confidence,
          processing_status: 'complete',
          processed_at: new Date().toISOString()
        }
        
        if (place?.rating) {
          updateData.user_rating = Math.round(place.rating)
        }
        if (place?.priceLevel) {
          updateData.price_level = place.priceLevel
        }
        
        // @ts-ignore
        const { data, error } = await supabase
          .from('locations')
          .update(updateData)
          .eq('id', locationId)
          .select()
        
        if (error) throw error
        
        return data?.[0]
      })
      
      return { 
        success: true, 
        count: 1,
        locationId,
        name: updated?.name
      }
      
    } else {
      // ==================== MULTIPLE LOCATIONS FLOW ====================
      console.log('[Job] Multiple locations - creating separate entries')
      
      const locations = await step.run('extract-multiple', async () => {
        const extracted = await extractMultipleLocations(screenshot, selectedText, url)
        
        // Layer 2: Code deduplication (case-insensitive by normalized name)
        const unique = Array.from(
          new Map(
            extracted.map(loc => [
              loc.location_name.toLowerCase().trim(),
              loc
            ])
          ).values()
        )
        
        console.log(`[Job] Extracted ${extracted.length}, unique: ${unique.length}`)
        return unique
      })
      
      const created = await step.run('create-all-locations', async () => {
        const results = []
        
        for (const loc of locations) {
          console.log(`[Job] Processing: ${loc.location_name}`)
          
          // Google Places validation
          const place = await searchGooglePlaces(loc.location_name)
          console.log(`[Job] Google found:`, !!place)
          
          // Layer 3: Database check - prevent duplicates
          if (place?.place_id) {
            const { data: existingByPlaceId } = await supabase
              .from('locations')
              .select('id, name')
              .eq('user_id', userId)
              .eq('place_id', place.place_id)
              .maybeSingle()
            
            if (existingByPlaceId) {
              console.log(`[Job] Location exists (place_id: ${place.place_id}), skipping`)
              continue
            }
          }
          
          // Also check by normalized name (fallback if no place_id)
          const { data: existingByName } = await supabase
            .from('locations')
            .select('id, name')
            .eq('user_id', userId)
            .ilike('name', loc.location_name)
            .maybeSingle()
          
          if (existingByName) {
            console.log(`[Job] Location exists by name: ${existingByName.name}, skipping`)
            continue
          }
          
          // Create new location (verified if Google found it)
          const { data: newLoc } = await supabase
            .from('locations')
            .insert({
              user_id: userId,
              country_id: countryId,
              name: place?.name || loc.location_name,
              address: place?.address || loc.address,
              lat: place?.lat,
              lng: place?.lng,
              category: loc.category,
              subcategory: loc.subcategory,
              summary: loc.summary || `Location from travel plan`,
              tips: loc.tips || [],
              photos: place?.photos || [],
              place_id: place?.place_id,
              location_verified: !!place,
              confidence_score: loc.confidence || 0.7,
              user_rating: place?.rating ? Math.round(place.rating) : null,
              price_level: place?.priceLevel,
              original_text: selectedText,
              source_url: url,
              page_title: pageTitle,
              source_type: 'single_save',
              processing_status: 'complete',
              is_from_itinerary: false,
              processed_at: new Date().toISOString()
            })
            .select()
            .single()
          
          if (newLoc) {
            // Link to trip if provided
            if (tripId) {
              await supabase.from('trip_locations').insert({
                trip_id: tripId,
                location_id: newLoc.id,
                display_order: results.length  // Order by extraction
              })
            }
            
            results.push(newLoc)
          }
        }
        
        return results
      })
      
      // Delete the placeholder location
      await step.run('cleanup-placeholder', async () => {
        await supabase.from('locations').delete().eq('id', locationId)
        return { deleted: locationId, created: created.length }
      })
      
      return { 
        success: true,
        count: created.length, 
        locations: created.map(l => ({
          id: l.id,
          name: l.name,
          verified: l.location_verified
        }))
      }
    }
  }
)
