import { inngest } from '../inngest'
import { supabase } from '../supabase'
import { extractFromScreenshot, countLocations, extractMultipleLocations, extractLocationVariations, extractGlobalContext, GlobalContext } from '../ai/extract'
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
    
    // ==================== STEP 0: EXTRACT GLOBAL CONTEXT ====================
    const globalContext = await step.run('extract-global-context', async () => {
      if (!screenshot) {
        console.log('[Job] No screenshot, skipping context extraction')
        return null
      }
      
      return await extractGlobalContext(screenshot, selectedText, url, pageTitle)
    })
    
    if (globalContext) {
      console.log('[Job] 🌍 Global context detected:')
      console.log(`[Job]    Location: ${globalContext.city}, ${globalContext.country}`)
      console.log(`[Job]    Coordinates: ${globalContext.approximateCoordinates?.lat}, ${globalContext.approximateCoordinates?.lng}`)
      console.log(`[Job]    Confidence: ${globalContext.confidence}`)
    } else {
      console.log('[Job] ⚠️ No global context detected')
    }
    
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
      
      // Step 1: Get 3 variations with global context
      const variations = await step.run('extract-variations', async () => {
        console.log('[Job] Calling extractLocationVariations...')
        console.log('[Job]   selectedText:', selectedText)
        console.log('[Job]   hasGlobalContext:', !!globalContext)
        
        const result = await extractLocationVariations(
          screenshot, 
          selectedText, 
          url, 
          pageTitle,
          globalContext  // 🔧 NEW: Pass global context
        )
        
        console.log('[Job] ✅ Variations returned:', result.length)
        result.forEach((v, i) => {
          console.log(`[Job]   ${i+1}. "${v.searchQuery}" (confidence: ${v.confidence})`)
        })
        
        if (result.length === 0) {
          console.error('[Job] ❌ CRITICAL: extractLocationVariations returned empty array!')
        }
        
        return result
      })
      
      // 🔧 UPDATED: Step 1.5 - Detect country using global context FIRST
      const detectedCountryId = await step.run('detect-country-single', async () => {
        console.log('[Job] 🎯 Detecting country...')
        
        // Fetch all countries from database
        const { data: countries } = await supabase
          .from('countries')
          .select('id, name, code')
        
        if (!countries || countries.length === 0) {
          console.warn('[Job] No countries in database!')
          return countryId
        }
        
        // Priority 1: Use global context country code
        if (globalContext?.countryCode) {
          const country = countries.find(c => c.code === globalContext.countryCode)
          if (country) {
            console.log(`[Job] 🌍 Country from context: ${country.name} (${country.code})`)
            return country.id
          }
        }
        
        // Priority 2: Search for country name in text
        const countryLookup = new Map(countries.map(c => [c.name.toLowerCase(), c]))
        const textLower = selectedText.toLowerCase()
        
        for (const [countryName, country] of countryLookup.entries()) {
          if (textLower.includes(countryName)) {
            console.log(`[Job] 🌍 Country from text: ${country.name} (${country.code})`)
            return country.id
          }
        }
        
        // Priority 3: Use Uncategorized country
        if (!countryId) {
          console.log('[Job] ⚠️ No country detected - using Uncategorized')
          const uncategorized = countries.find(c => c.code === 'XX')
          if (uncategorized) {
            console.log('[Job] 🌍 Fallback to: Uncategorized (XX)')
            return uncategorized.id
          } else {
            throw new Error('Uncategorized country not found in database')
          }
        }
        
        return countryId
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
          // 🔧 NEW: Try coordinate fallback if available
          if (globalContext?.approximateCoordinates) {
            console.log('[Job] ⚠️ Google failed, using coordinate fallback')
            
            // 🔧 Log if country changed
            if (countryId && detectedCountryId !== countryId) {
              const { data: oldCountry } = await supabase
                .from('countries')
                .select('name, code')
                .eq('id', countryId)
                .single()
              
              const { data: newCountry } = await supabase
                .from('countries')
                .select('name, code')
                .eq('id', detectedCountryId)
                .single()
              
              console.log(`[Job] 🔄 Country updated: ${oldCountry?.name} (${oldCountry?.code}) → ${newCountry?.name} (${newCountry?.code})`)
            }
            
            const { data, error } = await supabase
              .from('locations')
              .update({
                name: fallbackName,
                country_id: detectedCountryId,
                lat: globalContext.approximateCoordinates.lat,
                lng: globalContext.approximateCoordinates.lng,
                address: `${globalContext.city}, ${globalContext.region || ''}, ${globalContext.country}`.trim(),
                summary: `Location in ${globalContext.city}, ${globalContext.country} (coordinates estimated by AI)`,
                location_verified: false,
                confidence_score: Math.max(confidence, globalContext.confidence * 0.7),
                processing_status: 'complete',
                processed_at: new Date().toISOString(),
                original_context: {
                  globalContext: globalContext,
                  coordinateSource: 'ai-estimated',
                  extractionMethod: 'context-first'
                }
              })
              .eq('id', locationId)
              .select()
            
            if (error) throw error
            return data?.[0]
          }
          
          // No coordinates, just save with name
          console.log('[Job] ❌ No Google result and no coordinates')
          
          // 🔧 Log if country changed
          if (countryId && detectedCountryId !== countryId) {
            const { data: oldCountry } = await supabase
              .from('countries')
              .select('name, code')
              .eq('id', countryId)
              .single()
            
            const { data: newCountry } = await supabase
              .from('countries')
              .select('name, code')
              .eq('id', detectedCountryId)
              .single()
            
            console.log(`[Job] 🔄 Country updated: ${oldCountry?.name} (${oldCountry?.code}) → ${newCountry?.name} (${newCountry?.code})`)
          }
          
          const { data, error } = await supabase
            .from('locations')
            .update({
              name: fallbackName,
              country_id: detectedCountryId,
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
        // 🔧 Log if country changed from initial value
        if (countryId && detectedCountryId !== countryId) {
          const { data: oldCountry } = await supabase
            .from('countries')
            .select('name, code')
            .eq('id', countryId)
            .single()
          
          const { data: newCountry } = await supabase
            .from('countries')
            .select('name, code')
            .eq('id', detectedCountryId)
            .single()
          
          console.log(`[Job] 🔄 Country updated: ${oldCountry?.name} (${oldCountry?.code}) → ${newCountry?.name} (${newCountry?.code})`)
        }
        
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
        // 🔧 Pass globalContext to extraction
        const extracted = await extractMultipleLocations(
          screenshot, 
          selectedText, 
          url,
          globalContext  // NEW!
        )
        
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
      
      // 🔧 UPDATED: Smart country detection using global context FIRST
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
        
        // Priority 1: Use global context country
        let detectedCountry = null
        if (globalContext?.countryCode) {
          detectedCountry = countries.find(c => c.code === globalContext.countryCode)
          if (detectedCountry) {
            console.log(`[Job] 🌍 Using country from global context: ${detectedCountry.name}`)
          }
        }
        
        // Priority 2: Detect country from extracted locations
        const nonCountries = []
        
        for (const loc of locations) {
          const normalized = loc.location_name.toLowerCase().trim()
          
          if (countryLookup.has(normalized)) {
            // This is a country!
            if (!detectedCountry) {
              detectedCountry = countryLookup.get(normalized)
              console.log(`[Job] 🌍 Detected country from locations: ${detectedCountry.name} (${detectedCountry.code})`)
            }
          } else {
            nonCountries.push(loc)
          }
        }
        
        // Phase 2: Keep all non-countries (provinces, states, regions are valid locations!)
        const targetLocations = nonCountries  // No filtering - keep everything except countries
        
        // Priority 3: Use detected country, fallback to Uncategorized
        let finalCountryId = detectedCountry?.id || countryId
        
        if (!finalCountryId) {
          console.log('[Job] ⚠️ No country detected - using Uncategorized')
          const uncategorized = countries.find(c => c.code === 'XX')
          if (uncategorized) {
            finalCountryId = uncategorized.id
            console.log('[Job] 🌍 Fallback to: Uncategorized (XX)')
          } else {
            throw new Error('Uncategorized country not found in database')
          }
        }
        
        console.log(`[Job] ✅ Filtering complete:`)
        console.log(`[Job]    Original: ${locations.length}`)
        console.log(`[Job]    Countries removed: ${locations.length - nonCountries.length}`)
        console.log(`[Job]    Target locations: ${targetLocations.length}`)
        console.log(`[Job]    Final country: ${detectedCountry?.name || 'Uncategorized'}`)
        
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
          
          // 🔧 UPDATED: Multi-attempt search with global context enrichment
          let place = null
          const searchQueries = []
          
          // Build search queries from most to least specific
          if (loc.address) {
            searchQueries.push(`${loc.location_name} ${loc.address}`)
          }
          // 🔧 NEW: Add global context-enriched queries
          if (globalContext?.city) {
            searchQueries.push(`${loc.location_name}, ${globalContext.city}, ${globalContext.country}`)
          }
          if (loc.category && loc.category !== 'country') {
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
          
          // 🔧 NEW: Coordinate fallback if Google fails
          if (!place && globalContext?.approximateCoordinates) {
            console.log(`[Job] ⚠️ Google failed, using estimated coordinates`)
            
            // Create location with estimated coordinates
            const { data: newLoc } = await supabase
              .from('locations')
              .insert({
                user_id: userId,
                country_id: detectedCountryId,
                name: loc.location_name,
                address: `${globalContext.city}, ${globalContext.region || ''}, ${globalContext.country}`.trim(),
                lat: globalContext.approximateCoordinates.lat,
                lng: globalContext.approximateCoordinates.lng,
                category: loc.category,
                subcategory: loc.subcategory,
                location_verified: false,
                confidence_score: Math.max(loc.confidence || 0.6, globalContext.confidence * 0.7),
                summary: `Location in ${globalContext.city}, ${globalContext.country} (coordinates estimated by AI)`,
                original_text: selectedText,
                source_url: url,
                page_title: pageTitle,
                source_type: 'single_save',
                processing_status: 'complete',
                processed_at: new Date().toISOString(),
                original_context: {
                  globalContext: globalContext,
                  coordinateSource: 'ai-estimated',
                  extractionMethod: 'context-first'
                }
              })
              .select()
              .single()
            
            if (newLoc) {
              // Link to trip if provided
              if (tripId) {
                await supabase.from('trip_locations').insert({
                  trip_id: tripId,
                  location_id: newLoc.id,
                  display_order: results.length
                })
              }
              
              results.push(newLoc)
            }
            continue
          }
          
          // Skip if no Google result and no coordinates
          if (!place) {
            console.log(`[Job] ❌ Skipping "${loc.location_name}" - no Google match, no coordinates`)
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
              processed_at: new Date().toISOString(),
              // 🔧 NEW: Store global context metadata
              original_context: globalContext ? {
                globalContext: globalContext,
                coordinateSource: 'google',
                extractionMethod: 'context-first'
              } : null
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
