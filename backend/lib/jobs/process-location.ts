import { inngest } from '../inngest'
import { supabase } from '../supabase'
import { extractFromScreenshot, countLocations, extractMultipleLocations, extractLocationVariations } from '../ai/extract'
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
      // ==================== SINGLE LOCATION FLOW (MULTI-ATTEMPT) ====================
      console.log('[Job] Single location - using multi-attempt extraction')
      
      // Step 1: Get 3 variations
      const variations = await step.run('extract-variations', async () => {
        return await extractLocationVariations(
          screenshot, 
          selectedText, 
          url, 
          pageTitle
        )
      })
      
      // 🔧 NEW: Step 1.5 - Detect country from selected text
      const detectedCountryId = await step.run('detect-country-single', async () => {
        console.log('[Job] 🎯 Detecting country from text...')
        
        // Fetch all countries from database
        const { data: countries } = await supabase
          .from('countries')
          .select('id, name, code')
        
        if (!countries || countries.length === 0) {
          console.warn('[Job] No countries in database!')
          return countryId // Use placeholder country
        }
        
        // Build country name lookup (case-insensitive)
        const countryLookup = new Map(
          countries.map(c => [c.name.toLowerCase(), c])
        )
        
        console.log(`[Job] Loaded ${countries.length} countries for matching`)
        
        // Check if selectedText mentions any country
        const textLower = selectedText.toLowerCase()
        
        for (const [countryName, country] of countryLookup.entries()) {
          if (textLower.includes(countryName)) {
            console.log(`[Job] 🌍 Detected country from text: ${country.name} (${country.code})`)
            return country.id
          }
        }
        
        console.log('[Job] No country detected in text, using placeholder')
        return countryId // Use placeholder if no country found
      })
      
      // Step 2: Try each variation with Google Places until one works
      const placeResult = await step.run('google-places-multi-attempt', async () => {
        for (let i = 0; i < variations.length; i++) {
          const variation = variations[i]
          
          console.log(`[Job] Attempt ${i+1}/${variations.length}: "${variation.searchQuery}"`)
          console.log(`[Job] Confidence: ${variation.confidence}, Level: ${variation.specificityLevel}`)
          
          const place = await searchGooglePlaces(variation.searchQuery)
          
          if (place) {
            console.log(`[Job] ✅ SUCCESS with attempt ${i+1}!`)
            return {
              place,
              usedQuery: variation.searchQuery,
              attemptNumber: i + 1,
              confidence: variation.confidence,
              fallbackName: variation.searchQuery  // 🔧 Add fallback name for scope
            }
          }
          
          console.log(`[Job] ❌ Not found, trying next variation...`)
        }
        
        console.log(`[Job] ❌ All ${variations.length} attempts failed`)
        
        // 🔧 Return fallback info even when no place found
        return {
          place: null,
          usedQuery: null,
          attemptNumber: variations.length,
          confidence: variations[0]?.confidence || 0.5,
          fallbackName: variations[0]?.searchQuery || selectedText  // Use first variation as name
        }
      })
      
      // Step 3: Update placeholder with result AND detected country
      const updated = await step.run('update-placeholder', async () => {
        // 🔧 Always have fallbackName from placeResult (no more undefined error)
        const { place, usedQuery, attemptNumber, confidence, fallbackName } = placeResult
        
        if (!place) {
          // No Google result, use fallback name
          const { data, error } = await supabase
            .from('locations')
            .update({
              name: fallbackName,
              country_id: detectedCountryId,  // 🔧 Update country!
              summary: `Extracted from: "${selectedText}"`,
              location_verified: false,
              confidence_score: confidence,
              processing_status: 'complete',
              error_message: 'Not found on Google Places',
              processed_at: new Date().toISOString()
            })
            .eq('id', locationId)
            .select()
          
          if (error) throw error
          return data?.[0]
        }
        
        // Success! Update with Google data
        const updateData: any = {
          name: place.name,
          country_id: detectedCountryId,  // 🔧 Update country!
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          photos: place.photos || [],
          place_id: place.place_id,
          location_verified: true,
          confidence_score: confidence,
          summary: `Found via: "${usedQuery}" (attempt ${attemptNumber})`,
          processing_status: 'complete',
          processed_at: new Date().toISOString()
        }
        
        if (place.rating) {
          updateData.user_rating = Math.round(place.rating)
        }
        if (place.priceLevel) {
          updateData.price_level = place.priceLevel
        }
        
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
        name: updated?.name,
        verified: placeResult?.place !== null,
        detectedCountry: detectedCountryId !== countryId  // 🔧 Flag if country was changed
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
      
      // 🔧 NEW: Smart country detection and location filtering
      const { detectedCountryId, targetLocations } = await step.run('detect-country-and-filter', async () => {
        console.log('[Job] 🎯 Starting smart filtering...')
        
        // Fetch all countries from database
        const { data: countries } = await supabase
          .from('countries')
          .select('id, name, code')
        
        if (!countries || countries.length === 0) {
          console.warn('[Job] No countries in database!')
          return { detectedCountryId: countryId, targetLocations: locations }
        }
        
        // Build country name lookup (case-insensitive)
        const countryLookup = new Map(
          countries.map(c => [c.name.toLowerCase(), c])
        )
        
        console.log(`[Job] Loaded ${countries.length} countries for matching`)
        
        // Phase 1: Detect country and filter it out
        let detectedCountry = null
        const nonCountries = []
        
        for (const loc of locations) {
          const normalized = loc.location_name.toLowerCase().trim()
          
          if (countryLookup.has(normalized)) {
            // This is a country!
            detectedCountry = countryLookup.get(normalized)
            console.log(`[Job] 🌍 Detected country: ${detectedCountry.name} (${detectedCountry.code})`)
          } else {
            nonCountries.push(loc)
          }
        }
        
        // Phase 2: Filter parent breadcrumbs (provinces, states, regions)
        // Keep only the most specific locations
        const targetLocations = nonCountries.filter(loc => {
          const category = (loc.category || '').toLowerCase()
          
          // These categories are parent breadcrumbs → Filter out
          const breadcrumbCategories = [
            'province',
            'state', 
            'region',
            'prefecture',
            'territory',
            'district', // Large districts that are administrative
            'county'
          ]
          
          if (breadcrumbCategories.includes(category)) {
            console.log(`[Job] 🍞 Filtering breadcrumb: ${loc.location_name} (${category})`)
            return false
          }
          
          // Keep everything else (cities, neighborhoods, specific places)
          return true
        })
        
        // Use detected country if found, otherwise use the one from extension
        const finalCountryId = detectedCountry?.id || countryId
        
        console.log(`[Job] ✅ Filtering complete:`)
        console.log(`[Job]    Original: ${locations.length}`)
        console.log(`[Job]    Countries removed: ${locations.length - nonCountries.length}`)
        console.log(`[Job]    Breadcrumbs removed: ${nonCountries.length - targetLocations.length}`)
        console.log(`[Job]    Target locations: ${targetLocations.length}`)
        console.log(`[Job]    Final country: ${detectedCountry?.name || 'auto-selected'}`)
        
        return { 
          detectedCountryId: finalCountryId, 
          targetLocations: targetLocations 
        }
      })
      
      const created = await step.run('create-all-locations', async () => {
        const results = []
        
        // 🔧 Use targetLocations (already filtered) instead of locations
        for (const loc of targetLocations) {
          console.log(`[Job] Processing: ${loc.location_name}`)
          
          // 🔧 NEW: Multi-attempt search for each location
          let place = null
          const searchQueries = []
          
          // Build search queries from most to least specific
          if (loc.address) {
            searchQueries.push(`${loc.location_name} ${loc.address}`)
          }
          if (loc.category && loc.category !== 'country') {
            // Add category context (but skip generic "country")
            searchQueries.push(`${loc.location_name} ${loc.category}`)
          }
          // Always try just the name as fallback
          searchQueries.push(loc.location_name)
          
          // Try each query until one works
          for (let i = 0; i < searchQueries.length; i++) {
            const query = searchQueries[i]
            console.log(`[Job] Attempt ${i+1}/${searchQueries.length}: "${query}"`)
            
            place = await searchGooglePlaces(query)
            
            if (place) {
              console.log(`[Job] ✅ Found with query: "${query}"`)
              break
            }
            console.log(`[Job] ❌ Not found, trying next...`)
          }
          
          console.log(`[Job] Final result:`, place ? `Found ${place.name}` : 'Not found')
          
          // Skip if no Google result (don't create unverified city/province/country)
          if (!place) {
            console.log(`[Job] Skipping "${loc.location_name}" - no Google Places match`)
            continue
          }
          
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
          
          // Create new location (verified with Google data)
          const { data: newLoc } = await supabase
            .from('locations')
            .insert({
              user_id: userId,
              country_id: detectedCountryId,  // 🔧 Use detected country ID
              name: place.name,
              address: place.address || loc.address,
              lat: place.lat,
              lng: place.lng,
              category: loc.category,
              subcategory: loc.subcategory,
              summary: loc.summary || `Location from travel plan`,
              tips: loc.tips || [],
              photos: place.photos || [],
              place_id: place.place_id,
              location_verified: true,  // ✅ Always true now (we skip if no place)
              confidence_score: loc.confidence || 0.7,
              user_rating: place.rating ? Math.round(place.rating) : null,
              price_level: place.priceLevel,
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
