import { inngest } from '../inngest'
import { supabase } from '../supabase'
import { extractFromScreenshot } from '../ai/extract'
import { searchGooglePlaces } from '../places/search'

/**
 * Inngest function to process a location with AI and Google Places
 * 
 * Pipeline:
 * 1. AI extraction from rich context
 * 2. Google Places lookup for enrichment
 * 3. Update database with structured data
 */
export const processLocation = inngest.createFunction(
  { 
    id: 'process-location',
    retries: 3 // Retry up to 3 times on failure
  },
  { event: 'location/created' },
  async ({ event, step }) => {
    const { locationId, screenshot, selectedText, url, pageTitle } = event.data
    
    console.log(`[Job] Processing location ${locationId} with screenshot`)
    
    // Update status to processing
    await step.run('mark-processing', async () => {
      await supabase
        .from('locations')
        .update({ processing_status: 'processing' })
        .eq('id', locationId)
    })
    
    // STEP 1: AI Extraction from Screenshot (Vision)
    const extracted = await step.run('extract-with-vision', async () => {
      try {
        if (!screenshot) {
          throw new Error('No screenshot provided')
        }
        return await extractFromScreenshot(screenshot, selectedText, url, pageTitle)
      } catch (error) {
        console.error('[Job] Vision extraction failed:', error)
        throw error
      }
    })
    
    console.log(`[Job] Extracted: ${extracted.location_name} (confidence: ${extracted.confidence})`)
    
    // STEP 2: Google Places Lookup (if confidence is high enough)
    const place = await step.run('google-places-lookup', async () => {
      if (extracted.confidence < 0.5) {
        console.log('[Job] Skipping Places lookup - confidence too low')
        return null
      }
      
      try {
        const searchQuery = extracted.address || extracted.neighborhood
        return await searchGooglePlaces(extracted.location_name, searchQuery)
      } catch (error) {
        console.error('[Job] Google Places lookup failed:', error)
        return null // Continue without Places data
      }
    })
    
    if (place) {
      console.log(`[Job] Found on Google Places: ${place.name}`)
    } else {
      console.log('[Job] Not found on Google Places, using AI data')
    }
    
    // STEP 3: Update location with enriched data
    await step.run('update-database', async () => {
      try {
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
        
        // Add Google-specific data if available
        if (place?.rating) {
          updateData.user_rating = Math.round(place.rating) // Store as 1-5
        }
        if (place?.priceLevel) {
          updateData.price_level = place.priceLevel
        }
        
        const { error } = await supabase
          .from('locations')
          .update(updateData)
          .eq('id', locationId)
        
        if (error) throw error
        
        console.log(`[Job] Successfully updated location ${locationId}`)
      } catch (error) {
        console.error('[Job] Database update failed:', error)
        
        // Mark as error
        await supabase
          .from('locations')
          .update({ 
            processing_status: 'error',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', locationId)
        
        throw error
      }
    })
    
    return { 
      success: true, 
      locationId,
      verified: !!place,
      confidence: extracted.confidence
    }
  }
)

