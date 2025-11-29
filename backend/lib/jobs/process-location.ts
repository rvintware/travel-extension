import OpenAI from 'openai'
import { inngest } from '../inngest'
import { supabase } from '../supabase'
import { extractFromScreenshot, countLocations, extractMultipleLocations, extractLocationVariations, extractGlobalContext, GlobalContext, extractTieredTips } from '../ai/extract'
import { searchGooglePlaces, fetchGoogleReviews, searchGooglePlacesByPlaceId, searchGooglePlacesByCoordinates } from '../places/search'
import { findExistingLocation, mergeIntoExisting } from '../locations/merge'
import { extractLinksFromText, parseGoogleMapsUrl, LinkExtractionResult } from '../links/parser'
import { expandShortenedUrl, isShortenedUrl } from '../links/url-expander'

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
      linkUrl,         // NEW: Link URL from context menu
      url, 
      pageTitle,
      userId,          // For creating multiple locations
      countryId,       // For creating multiple locations
      tripId,          // Optional: for linking to trip
      userApiKey       // NEW: Optional user-provided API key
    } = event.data
    
    console.log(`[Job] Processing location ${locationId}`)
    console.log(`[Job] Has linkUrl:`, !!linkUrl)  // NEW
    console.log(`[Job] Has screenshot:`, !!screenshot)
    console.log(`[Job] Has tripId:`, !!tripId)
    console.log(`[Job] Using user API key:`, !!userApiKey)  // Don't log the actual key!
    
    // Create OpenAI client for this job (uses user key or server key)
    const apiKey = userApiKey || process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('No API key available (neither user key nor server key configured)')
    }
    
    const openaiClient = new OpenAI({ apiKey })
    
    // ==================== STEP 0: LINK PRE-PARSING (NEW) ====================
    const linkAnalysis = await step.run('parse-links', async () => {
      console.log('[Job] Step 0: Link Pre-Parsing')
      
      // Combine selectedText and linkUrl for comprehensive extraction
      // If linkUrl provided in event, include it in text to parse
      let textToParse = selectedText || ''
      if (linkUrl) {
        // Combine: selectedText may already contain linkUrl, but ensure it's included
        textToParse = textToParse ? `${textToParse} ${linkUrl}` : linkUrl
      }
      
      if (!textToParse.trim()) {
        console.log('[Job] No text to parse, returning empty result')
        return {
          googleMapsLinks: [],
          otherLinks: [],
          cleanedText: ''
        }
      }
      
      // Extract URLs from text (categorizes but doesn't parse yet)
      const extracted = extractLinksFromText(textToParse)
      
      // Expand shortened URLs before parsing (optimize: expand → parse once)
      const expandedLinks: ParsedMapLink[] = []
      
      for (const link of extracted.googleMapsLinks) {
        let urlToParse = link.originalUrl
        let expandedUrl: string | undefined = undefined
        
        // Check if shortened and expand if needed
        if (isShortenedUrl(link.originalUrl)) {
          console.log(`[Job]   Expanding shortened URL: ${link.originalUrl.substring(0, 50)}...`)
          urlToParse = await expandShortenedUrl(link.originalUrl)
          
          if (urlToParse !== link.originalUrl) {
            expandedUrl = urlToParse
            console.log(`[Job]   Expanded to: ${expandedUrl.substring(0, 100)}...`)
          } else {
            console.log(`[Job]   Expansion returned same URL (no redirect)`)
          }
        }
        
        // Parse the (expanded) URL once with all identifiers
        const parsed = parseGoogleMapsUrl(urlToParse)
        
        // Set expandedUrl if expansion occurred
        if (expandedUrl) {
          parsed.expandedUrl = expandedUrl
        }
        
        expandedLinks.push(parsed)
      }
      
      console.log(`[Job] Found ${expandedLinks.length} Google Maps links`)
      console.log(`[Job] Found ${extracted.otherLinks.length} other links`)
      console.log(`[Job] Cleaned text length: ${extracted.cleanedText.length} chars`)
      
      // Log each Google Maps link found
      expandedLinks.forEach((link, i) => {
        const expansionInfo = link.expandedUrl ? ` (expanded)` : ''
        console.log(`[Job]   Link ${i+1}: ${link.originalUrl}${expansionInfo} (confidence: ${link.confidence})`)
      })
      
      return {
        googleMapsLinks: expandedLinks,
        otherLinks: extracted.otherLinks,
        cleanedText: extracted.cleanedText
      }
    })
    
    // ==================== STEP 0.5: PROCESS GOOGLE MAPS LINKS (NEW) ====================
    const linkResults = await step.run('process-map-links', async () => {
      console.log('[Job] Step 0.5: Process Google Maps Links')
      const results: Array<{
        source: 'link'
        place: Awaited<ReturnType<typeof searchGooglePlacesByPlaceId>>
        confidence: number
        method: 'place_id' | 'coordinates' | 'query'
        originalUrl: string
        expandedUrl?: string  // Only present if URL was expanded
      }> = []
      
      if (linkAnalysis.googleMapsLinks.length === 0) {
        console.log('[Job] No Google Maps links to process')
        return results
      }
      
      for (let i = 0; i < linkAnalysis.googleMapsLinks.length; i++) {
        const link = linkAnalysis.googleMapsLinks[i]
        console.log(`[Job] Processing link ${i+1}/${linkAnalysis.googleMapsLinks.length}`)
        console.log(`[Job]   URL: ${link.originalUrl}`)
        if (link.expandedUrl) {
          console.log(`[Job]   Expanded URL: ${link.expandedUrl.substring(0, 100)}...`)
        }
        console.log(`[Job]   Confidence: ${link.confidence}`)
        
        // Links are already expanded and parsed in Step 0
        // Use the parsed data directly
        const parsed = link
        const expandedUrl = link.expandedUrl  // Already set in Step 0 if expansion occurred
        
        // Try to get place data based on what we extracted (priority order)
        let place: Awaited<ReturnType<typeof searchGooglePlacesByPlaceId>> = null
        let confidence = 0.5
        let method: 'place_id' | 'coordinates' | 'query' = 'query'
        
        // HIGH CONFIDENCE: Direct Place ID lookup
        if (parsed.placeId) {
          console.log(`[Job]   Attempting Place ID lookup: ${parsed.placeId}`)
          place = await searchGooglePlacesByPlaceId(parsed.placeId)
          if (place) {
            confidence = 1.0
            method = 'place_id'
            console.log(`[Job]   ✅ Found via Place ID: ${place.name}`)
          } else {
            console.log(`[Job]   ❌ Place ID lookup failed`)
          }
        }
        
        // MEDIUM CONFIDENCE: CID lookup (using ftid or data CID)
        // Note: Google Places API doesn't directly support CID lookup
        // We'll use CID as a query string for text search (less reliable than Place ID)
        if (!place && parsed.cid) {
          console.log(`[Job]   Found CID: ${parsed.cid}`)
          console.log(`[Job]   ⚠️ CID lookup not directly supported by Google Places API, falling back to query/coordinates`)
          // CID format: 0x35419186f3dcf331:0xcfdb147061f6629
          // We can't directly lookup CID, but we can use it in a query
          // For now, fall through to coordinate/query search
          // Future: Could implement CID → Place ID conversion if API supports it
        }
        
        // MEDIUM CONFIDENCE: Coordinate search
        if (!place && parsed.coordinates) {
          console.log(`[Job]   Attempting coordinate search: ${parsed.coordinates.lat}, ${parsed.coordinates.lng}`)
          place = await searchGooglePlacesByCoordinates(
            parsed.coordinates.lat,
            parsed.coordinates.lng
          )
          if (place) {
            confidence = 0.9
            method = 'coordinates'
            console.log(`[Job]   ✅ Found via coordinates: ${place.name}`)
          } else {
            console.log(`[Job]   ❌ Coordinate search failed`)
          }
        }
        
        // LOW CONFIDENCE: Text query from URL
        if (!place && parsed.query) {
          console.log(`[Job]   Attempting text search: ${parsed.query}`)
          place = await searchGooglePlaces(parsed.query)
          if (place) {
            confidence = 0.7
            method = 'query'
            console.log(`[Job]   ✅ Found via query: ${place.name}`)
          } else {
            console.log(`[Job]   ❌ Text search failed`)
          }
        }
        
        if (place) {
          // Build result object conditionally
          const result: {
            source: 'link'
            place: typeof place
            confidence: number
            method: typeof method
            originalUrl: string
            expandedUrl?: string
          } = {
            source: 'link',
            place: place,
            confidence: confidence,
            method: method,
            originalUrl: link.originalUrl
          }
          
          // Only include expandedUrl if it exists and differs from originalUrl
          if (expandedUrl && expandedUrl !== link.originalUrl) {
            result.expandedUrl = expandedUrl
            console.log(`[Job]   ✅ Link processed successfully (expanded: ${expandedUrl.substring(0, 80)}...)`)
          } else {
            console.log(`[Job]   ✅ Link processed successfully (no expansion needed)`)
          }
          
          results.push(result)
        } else {
          // Log expansion info even for failed lookups (for debugging)
          if (expandedUrl && expandedUrl !== link.originalUrl) {
            console.log(`[Job]   ❌ Failed to find place (expanded: ${expandedUrl.substring(0, 80)}...)`)
          } else {
            console.log(`[Job]   ❌ Failed to find place for link (all methods failed)`)
          }
        }
      }
      
      // Count how many URLs were expanded
      const expandedCount = results.filter(r => r.expandedUrl).length
      if (expandedCount > 0) {
        console.log(`[Job] Link processing complete: ${results.length}/${linkAnalysis.googleMapsLinks.length} places found (${expandedCount} URLs expanded)`)
      } else {
        console.log(`[Job] Link processing complete: ${results.length}/${linkAnalysis.googleMapsLinks.length} places found`)
      }
      return results
    })
    
    // ==================== STEP 1: EXTRACT GLOBAL CONTEXT (UPDATED - WITH CLEANED TEXT) ====================
    const globalContext = await step.run('extract-global-context', async () => {
      if (!screenshot) {
        console.log('[Job] No screenshot, skipping context extraction')
        return null
      }
      
      console.log('[Job] Step 1: Extract Global Context')
      console.log('[Job] Using cleaned text (URLs removed)')
      
      return await extractGlobalContext(screenshot, linkAnalysis.cleanedText, url, pageTitle, openaiClient)
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
    
    // ==================== STEP 2: COUNT LOCATIONS (UPDATED - WITH CLEANED TEXT) ====================
    const count = await step.run('count-locations', async () => {
      console.log('[Job] Step 2: Count Locations')
      console.log('[Job] Using cleaned text (URLs removed)')
      return await countLocations(screenshot, linkAnalysis.cleanedText, openaiClient)
    })
    
    console.log(`[Job] Count: ${count} locations`)
    
    // Handle no locations found (check both text and links)
    if (count === 0 && linkResults.length === 0) {
      await supabase
        .from('locations')
        .update({ 
          processing_status: 'error',
          error_message: 'No locations detected in text or links'
        })
        .eq('id', locationId)
      return { success: false, reason: 'No locations found' }
    }
    
    // ==================== STEP 3: TEXT EXTRACTION ====================
    let textResults: Array<{
      source: 'text'
      place: Awaited<ReturnType<typeof searchGooglePlaces>> | null
      confidence: number
      attempt: number
      query: string
      fallbackName: string
    }> = []
    
    let detectedCountryId: string | null = countryId || null
    
    if (count === 1) {
      // ==================== SINGLE LOCATION FLOW (MULTI-ATTEMPT) ====================
      console.log('[Job] Step 3a: Single Location Flow')
      console.log('[Job] Single location - using multi-attempt extraction')
      
      // Step 1: Get 3 variations with global context
      const variations = await step.run('extract-variations', async () => {
        console.log('[Job] Calling extractLocationVariations...')
        console.log('[Job]   cleanedText:', linkAnalysis.cleanedText)
        console.log('[Job]   hasGlobalContext:', !!globalContext)
        
        const result = await extractLocationVariations(
          screenshot, 
          linkAnalysis.cleanedText,  // CHANGED: Use cleanedText
          url, 
          pageTitle,
          globalContext,  // 🔧 Pass global context
          openaiClient    // Pass OpenAI client
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
      detectedCountryId = await step.run('detect-country-single', async () => {
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
          fallbackName: variations[0]?.searchQuery || linkAnalysis.cleanedText || selectedText  // Use first variation as name
        }
      })
      
      // Store result in textResults array (defer database operations until after reconciliation)
      if (placeResult) {
        textResults.push({
          source: 'text',
          place: placeResult.place,
          confidence: placeResult.confidence,
          attempt: placeResult.attemptNumber,
          query: placeResult.usedQuery || '',
          fallbackName: placeResult.fallbackName
        })
      }
      
    } else {
      // ==================== MULTIPLE LOCATIONS FLOW ====================
      console.log('[Job] Step 3b: Multiple Locations Flow')
      console.log('[Job] Multiple locations - extracting all')
      
      const locations = await step.run('extract-multiple', async () => {
        console.log('[Job] Extracting multiple locations...')
        console.log('[Job] Using cleaned text (URLs removed)')
        
        // 🔧 Pass globalContext to extraction
        const extracted = await extractMultipleLocations(
          screenshot, 
          linkAnalysis.cleanedText,  // CHANGED: Use cleanedText
          url,
          globalContext,  // Pass global context
          openaiClient    // Pass OpenAI client
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
      const countryAndLocations = await step.run('detect-country-and-filter', async () => {
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
      
      detectedCountryId = countryAndLocations.detectedCountryId
      const targetLocations = countryAndLocations.targetLocations
      
      // Store results in textResults array instead of creating locations directly
      await step.run('search-all-locations', async () => {
        // 🔧 Use targetLocations (already filtered) instead of locations
        for (const loc of targetLocations) {
          console.log(`[Job] Processing: ${loc.location_name}`)
          
          // 🔧 UPDATED: Multi-attempt search with global context enrichment
          let place = null
          let attemptNumber = 0
          let usedQuery = ''
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
              attemptNumber = i + 1
              usedQuery = query
              break
            }
            console.log(`[Job] ❌ Not found, trying next...`)
          }
          
          console.log(`[Job] Final result:`, place ? `Found ${place.name}` : 'Not found')
          
          // Store result in textResults array (skip if no place found - will handle coordinate fallback in Step 5)
          if (place) {
            textResults.push({
              source: 'text',
              place: place,
              confidence: loc.confidence || 0.7,
              attempt: attemptNumber,
              query: usedQuery,
              fallbackName: loc.location_name
            })
          }
        }
      })
    }
    
    // ==================== STEP 4: RECONCILIATION (NEW) ====================
    const finalLocations = await step.run('reconcile-links-and-text', async () => {
      console.log('[Job] Step 4: Reconciliation')
      console.log(`[Job] Link results: ${linkResults.length}`)
      console.log(`[Job] Text results: ${textResults.length}`)
      
      // Combine all results into single array
      const allLocations: Array<{
        source: 'link' | 'text'
        place: Awaited<ReturnType<typeof searchGooglePlaces>> | null
        confidence: number
        method?: string
        attempt?: number
        query?: string
        fallbackName: string
        originalUrl?: string
      }> = []
      
      // Add link results
      linkResults.forEach(r => {
        allLocations.push({
          source: 'link',
          place: r.place,
          confidence: r.confidence,
          method: r.method,
          fallbackName: r.place.name,
          originalUrl: r.originalUrl
        })
      })
      
      // Add text results
      textResults.forEach(r => {
        allLocations.push({
          source: 'text',
          place: r.place,
          confidence: r.confidence,
          attempt: r.attempt,
          query: r.query,
          fallbackName: r.fallbackName
        })
      })
      
      console.log(`[Job] Total locations before deduplication: ${allLocations.length}`)
      
      // Group by place_id
      const grouped = new Map<string, Array<typeof allLocations[0]>>()
      const noPlaceId: Array<typeof allLocations[0]> = []
      
      for (const location of allLocations) {
        if (location.place?.place_id) {
          const placeId = location.place.place_id
          if (!grouped.has(placeId)) {
            grouped.set(placeId, [])
          }
          grouped.get(placeId)!.push(location)
        } else {
          // No place_id - keep as separate (will use fallbackName for uniqueness)
          noPlaceId.push(location)
        }
      }
      
      console.log(`[Job] Grouped into ${grouped.size} unique places (by place_id)`)
      console.log(`[Job] ${noPlaceId.length} locations without place_id`)
      
      // Pick best from each group
      const deduplicated: Array<typeof allLocations[0]> = []
      
      // Process grouped locations (with place_id)
      for (const [placeId, locations] of grouped) {
        console.log(`[Job] Place ID ${placeId}: ${locations.length} duplicate(s)`)
        
        // Sort by priority: link source first, then by confidence
        const sorted = locations.sort((a, b) => {
          // Priority 1: Link source beats text source
          if (a.source === 'link' && b.source !== 'link') return -1
          if (a.source !== 'link' && b.source === 'link') return 1
          
          // Priority 2: Higher confidence wins
          return (b.confidence || 0) - (a.confidence || 0)
        })
        
        const best = sorted[0]
        console.log(`[Job]   Selected: source=${best.source}, confidence=${best.confidence}, method=${best.method || 'N/A'}`)
        
        deduplicated.push(best)
      }
      
      // Add locations without place_id (no deduplication possible)
      deduplicated.push(...noPlaceId)
      
      console.log(`[Job] Final locations after deduplication: ${deduplicated.length}`)
      return deduplicated
    })
    
    // ==================== STEP 5: ENRICHMENT & PERSISTENCE (UPDATED) ====================
    // Process finalLocations (may be 1 or multiple)
    const enrichedLocations = await step.run('enrich-and-persist', async () => {
      console.log(`[Job] Step 5: Enriching ${finalLocations.length} location(s)`)
      
      const results: Array<{
        id: string
        name: string
        place_id: string | null
        merged: boolean
      }> = []
      
      for (let i = 0; i < finalLocations.length; i++) {
        const location = finalLocations[i]
        console.log(`[Job] Processing location ${i+1}/${finalLocations.length}: ${location.fallbackName}`)
        
        // Skip if no place found (for now - could create with coordinates later)
        if (!location.place) {
          console.log(`[Job]   Skipping: No place data`)
          continue
        }
        
        const place = location.place
        
        // Fetch reviews if place_id exists (no nested step - execute directly)
        let reviews: any[] = []
        if (place.place_id) {
          console.log(`[Job]   Fetching reviews for ${place.name}...`)
          reviews = await fetchGoogleReviews(place.place_id)
        }
        
        // Extract tiered tips (no nested step - execute directly)
        let tieredTips: any[] = []
        if (screenshot) {
          console.log(`[Job]   Extracting tips...`)
          tieredTips = await extractTieredTips(
            screenshot, 
            linkAnalysis.cleanedText,  // Use cleanedText
            reviews, 
            openaiClient
          )
        }
        
        // Check for duplicate by place_id (no nested step - execute directly)
        let duplicateCheck: { isDuplicate: boolean; existingLocation: any } = {
          isDuplicate: false,
          existingLocation: null
        }
        if (place.place_id) {
          const existing = await findExistingLocation(userId, place.place_id)
          duplicateCheck = {
            isDuplicate: !!existing,
            existingLocation: existing
          }
        }
        
        // Handle duplicate or create new
        if (duplicateCheck.isDuplicate && duplicateCheck.existingLocation) {
          console.log(`[Job]   🔄 Duplicate found, merging...`)
          
          await mergeIntoExisting(
            duplicateCheck.existingLocation.id,
            {
              tips: tieredTips,
              sourceUrl: url,
              sources: [url]
            }
          )
          
          // Link to trip if specified
          if (tripId) {
            await supabase.from('trip_locations').insert({
              trip_id: tripId,
              location_id: duplicateCheck.existingLocation.id,
              display_order: i
            }).catch(() => {}) // Ignore duplicate link errors
          }
          
          results.push({
            id: duplicateCheck.existingLocation.id,
            name: duplicateCheck.existingLocation.name,
            place_id: place.place_id,
            merged: true
          })
          
        } else {
          // Create new location or update placeholder
          const isFirstLocation = i === 0
          
          if (isFirstLocation) {
            // Update placeholder
            console.log(`[Job]   Updating placeholder location...`)
            const { data: updated } = await supabase
              .from('locations')
              .update({
                name: place.name,
                country_id: detectedCountryId,  // From earlier step
                address: place.address,
                lat: place.lat,
                lng: place.lng,
                photos: place.photos || [],
                place_id: place.place_id,
                location_verified: true,
                confidence_score: location.confidence,
                summary: `Found via: ${location.source} (${location.method || 'text'})`,
                tips: tieredTips,
                processing_status: 'complete',
                processed_at: new Date().toISOString(),
                user_rating: place.rating ? Math.round(place.rating) : null,
                price_level: place.priceLevel
              })
              .eq('id', locationId)
              .select()
              .single()
            
            if (updated) {
              results.push({
                id: updated.id,
                name: updated.name,
                place_id: place.place_id,
                merged: false
              })
            }
          } else {
            // Create new location
            console.log(`[Job]   Creating new location...`)
            const { data: newLoc } = await supabase
              .from('locations')
              .insert({
                user_id: userId,
                country_id: detectedCountryId,
                name: place.name,
                address: place.address,
                lat: place.lat,
                lng: place.lng,
                photos: place.photos || [],
                place_id: place.place_id,
                location_verified: true,
                confidence_score: location.confidence,
                summary: `Found via: ${location.source} (${location.method || 'text'})`,
                tips: tieredTips,
                original_text: selectedText,
                source_url: url,
                page_title: pageTitle,
                source_type: 'single_save',
                processing_status: 'complete',
                processed_at: new Date().toISOString(),
                user_rating: place.rating ? Math.round(place.rating) : null,
                price_level: place.priceLevel
              })
              .select()
              .single()
            
            if (newLoc) {
              results.push({
                id: newLoc.id,
                name: newLoc.name,
                place_id: place.place_id,
                merged: false
              })
            }
          }
          
          // Link to trip if specified
          if (tripId && results[results.length - 1]) {
            await supabase.from('trip_locations').insert({
              trip_id: tripId,
              location_id: results[results.length - 1].id,
              display_order: i
            }).catch(() => {}) // Ignore duplicate link errors
          }
        }
      }
      
      return results
    })
    
    // ==================== STEP 6: CLEANUP (if multiple locations) ====================
    // Move cleanup outside enrich-and-persist to avoid nested steps
    if (finalLocations.length > 1) {
      await step.run('cleanup-placeholder', async () => {
        console.log(`[Job] Step 6: Cleaning up placeholder (${finalLocations.length} locations created)`)
        await supabase.from('locations').delete().eq('id', locationId)
        console.log(`[Job] ✅ Placeholder deleted`)
      })
    }
    
    return {
      success: true,
      count: enrichedLocations.length,
      locations: enrichedLocations.map(l => ({
        id: l.id,
        name: l.name,
        verified: !!l.place_id,
        merged: l.merged
      }))
    }
  }
)
