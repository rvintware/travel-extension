import OpenAI from 'openai'
import {
  buildGlobalContextPrompt,
  buildCountLocationsPrompt,
  buildExtractMultipleLocationsPrompt,
  buildLocationVariationsPrompt
} from './prompts'

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not set - AI extraction will fail')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build'
})

interface ExtractionResult {
  location_name: string
  address?: string
  neighborhood?: string
  category: string
  subcategory?: string
  summary: string
  tips: string[]
  confidence: number
}

interface LocationVariation {
  searchQuery: string
  confidence: number
  reasoning: string
  specificityLevel: 'high' | 'medium' | 'low'
}

export interface GlobalContext {
  city: string | null           // "Qingdao"
  region: string | null          // "Shandong Province"
  country: string                // "China"
  countryCode: string            // "CN"
  approximateCoordinates: {
    lat: number                  // 36.067
    lng: number                  // 120.383
  } | null
  confidence: number             // 0.0-1.0
  reasoning: string              // Why AI thinks this is the context
}

/**
 * Extract location from screenshot using GPT-4o with vision
 */
export async function extractFromScreenshot(
  screenshot: string,
  selectedText: string,
  url: string,
  pageTitle: string
): Promise<ExtractionResult> {
  console.log('[AI Screenshot] Extracting from screenshot...')
  console.log('[AI Screenshot] Selected text:', selectedText.substring(0, 100))
  console.log('[AI Screenshot] URL:', url)
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // Vision-capable model
      messages: [{
        role: 'user',
        content: [
          { 
            type: 'text', 
            text: `⚠️ CRITICAL INSTRUCTION:
Extract location from the HIGHLIGHTED TEXT ONLY.
The screenshot is for CONTEXT - it helps you understand vague references.
DO NOT extract locations from other visible text in the screenshot.

User highlighted: "${selectedText}"

Source: ${url}
Page title: "${pageTitle}"

The screenshot shows the page where this text appears.
Use it to understand what vague terms mean:
- "this place" → screenshot shows which place they mean
- "the temple" → screenshot helps identify which temple
- "Disney Sea" → screenshot confirms context

But EXTRACT ONLY from the highlighted text above.
Do not extract from comments, replies, or other text visible in screenshot.

Look for SPECIFIC LOCATIONS in the highlighted text:
✅ Restaurants, cafes, bars
✅ Temples, shrines, museums
✅ Hotels, shops, landmarks
✅ Cities, towns (if mentioned in highlighted text)
✅ Parks, gardens, attractions

Extract as JSON:
{
  "location_name": "Name from highlighted text",
  "address": "If mentioned in highlighted text",
  "neighborhood": "If mentioned",
  "category": "restaurant/temple/city/etc",
  "subcategory": "More specific",
  "summary": "1-2 sentence description",
  "tips": ["Tips from highlighted text only"],
  "confidence": 0.85
}

Remember: Screenshot = context, Highlighted text = source

Output valid JSON only.`
          },
          {
            type: 'image_url',
            image_url: { url: screenshot }  // Base64 data URL
          }
        ]
      }],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.3
    })
    
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content in AI response')
    }
    
    const result = JSON.parse(content) as ExtractionResult
    console.log('[AI Screenshot] ✅ Extracted:', result.location_name, 'confidence:', result.confidence)
    
    return result
  } catch (error) {
    console.error('[AI Screenshot] ❌ Failed:', error)
    throw error
  }
}

/**
 * Count distinct locations in highlighted text
 */
export async function countLocations(
  screenshot: string,
  selectedText: string
): Promise<number> {
  console.log('[AI Count] Counting locations...')
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: buildCountLocationsPrompt(selectedText)
          },
          {
            type: 'image_url',
            image_url: { url: screenshot }
          }
        ]
      }],
      max_tokens: 10
    })
    
    const count = parseInt(response.choices[0].message.content || '0')
    console.log('[AI Count] Result:', count)
    return count
  } catch (error) {
    console.error('[AI Count] Failed:', error)
    return 1
  }
}

/**
 * Extract multiple locations as array
 */
export async function extractMultipleLocations(
  screenshot: string,
  selectedText: string,
  url: string,
  globalContext: GlobalContext | null = null
): Promise<ExtractionResult[]> {
  console.log('[AI Multi] Extracting multiple locations...')
  console.log('[AI Multi] Has global context:', !!globalContext)
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: buildExtractMultipleLocationsPrompt(selectedText, url, globalContext)
          },
          {
            type: 'image_url',
            image_url: { url: screenshot }
          }
        ]
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1500
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    const locations = result.locations || []
    console.log('[AI Multi] Extracted', locations.length, 'locations')
    return locations
  } catch (error) {
    console.error('[AI Multi] Failed:', error)
    return []
  }
}

/**
 * Extract location as 3 search query variations (high → low specificity)
 * Uses screenshot to complete partial/vague text
 */
export async function extractLocationVariations(
  screenshot: string,
  selectedText: string,
  url: string,
  pageTitle: string,
  globalContext: GlobalContext | null = null
): Promise<LocationVariation[]> {
  console.log('[AI Variations] Extracting 3 search queries...')
  console.log('[AI Variations] Selected text:', selectedText.substring(0, 100))
  console.log('[AI Variations] Has global context:', !!globalContext)
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: buildLocationVariationsPrompt(selectedText, url, pageTitle, globalContext)
          },
          {
            type: 'image_url',
            image_url: { url: screenshot }
          }
        ]
      }],
      response_format: { type: 'json_object' },
      max_tokens: 800,
      temperature: 0.3
    })
    
    const content = response.choices[0].message.content || '{}'
    console.log('[AI Variations] Raw response:', content.substring(0, 200))
    
    const result = JSON.parse(content)
    const variations = result.variations || []
    
    console.log('[AI Variations] Generated:', variations.length, 'queries')
    
    // Validate we got 3 variations
    if (variations.length === 0) {
      console.error('[AI Variations] ❌ AI returned empty array! Using fallback.')
      console.error('[AI Variations] Full response:', content)
      
      // Build fallback variations with context if available
      if (globalContext) {
        return [
          {
            searchQuery: `${selectedText.trim()}, ${globalContext.region || ''}, ${globalContext.country}`.replace(/,\s*,/g, ',').trim(),
            confidence: 0.85,
            reasoning: 'Fallback: Added context to input',
            specificityLevel: 'high' as const
          },
          {
            searchQuery: `${selectedText.trim()}, ${globalContext.country}`,
            confidence: 0.70,
            reasoning: 'Fallback: Added country to input',
            specificityLevel: 'medium' as const
          },
          {
            searchQuery: selectedText.trim(),
            confidence: 0.60,
            reasoning: 'Fallback: Using raw input',
            specificityLevel: 'low' as const
          }
        ]
      } else {
        return [{
          searchQuery: selectedText.trim(),
          confidence: 0.5,
          reasoning: 'AI extraction failed, using raw text',
          specificityLevel: 'low' as const
        }]
      }
    }
    
    if (variations.length < 3) {
      console.warn('[AI Variations] ⚠️ AI returned only', variations.length, 'variations (expected 3)')
    }
    
    variations.forEach((v: LocationVariation, i: number) => {
      console.log(`  ${i+1}. "${v.searchQuery}" (${v.confidence})`)
    })
    
    return variations
  } catch (error) {
    console.error('[AI Variations] Failed:', error)
    // Fallback: return basic query from selected text
    return [{
      searchQuery: selectedText.trim(),
      confidence: 0.5,
      reasoning: 'AI extraction failed, using raw text',
      specificityLevel: 'low'
    }]
  }
}

/**
 * Extract global geographic context from screenshot and ALL selected text.
 * Determines the primary city/country being discussed.
 * 
 * This runs ONCE per save action, analyzing the full page context.
 */
export async function extractGlobalContext(
  screenshot: string,
  selectedText: string,
  url: string,
  pageTitle: string
): Promise<GlobalContext | null> {
  console.log('[AI Context] Extracting global geographic context...')
  console.log('[AI Context] Text length:', selectedText.length)
  console.log('[AI Context] URL:', url)
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: buildGlobalContextPrompt(selectedText, url, pageTitle)
          },
          {
            type: 'image_url',
            image_url: { url: screenshot }
          }
        ]
      }],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.2  // Lower temperature for more consistent extraction
    })
    
    const result = JSON.parse(response.choices[0].message.content || 'null')
    
    if (!result || !result.country) {
      console.log('[AI Context] ⚠️ No clear geographic context detected')
      return null
    }
    
    console.log('[AI Context] ✅ Detected context:')
    console.log(`[AI Context]    City: ${result.city || 'unknown'}`)
    console.log(`[AI Context]    Country: ${result.country} (${result.countryCode})`)
    console.log(`[AI Context]    Coords: ${result.approximateCoordinates?.lat}, ${result.approximateCoordinates?.lng}`)
    console.log(`[AI Context]    Confidence: ${result.confidence}`)
    console.log(`[AI Context]    Reasoning: ${result.reasoning}`)
    
    return result as GlobalContext
  } catch (error) {
    console.error('[AI Context] Failed:', error)
    return null
  }
}

