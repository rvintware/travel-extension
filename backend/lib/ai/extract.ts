import OpenAI from 'openai'

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
            text: `⚠️ IMPORTANT: 
- The screenshot is for VISUAL CONTEXT ONLY
- COUNT DISTINCT locations mentioned in the HIGHLIGHTED TEXT ONLY
- DO NOT count locations from other parts of the screenshot
- If same location mentioned multiple times, count it ONCE

User highlighted this text: "${selectedText}"

Count how many DISTINCT/UNIQUE locations are mentioned in THIS HIGHLIGHTED TEXT.

IMPORTANT - Deduplication rules:
- "Tokyo" mentioned 3 times → Count: 1
- "Tokyo Tower" mentioned twice → Count: 1
- "Tokyo" and "Tokyo Tower" → Count: 2 (different places)
- "Senso-ji" and "Senso-ji Temple" → Count: 1 (same place)

The screenshot helps you see the page layout and understand context,
but you should ONLY count UNIQUE locations that appear in the highlighted text above.

A location can be:
✅ Cities (Tokyo, Kyoto)
✅ Specific places (Disney Sea, Senso-ji Temple)
✅ Landmarks, restaurants, hotels, temples, etc.

Examples:
- Highlighted text: "Disney Sea seems well-regarded" → 1 (Disney Sea)
- Highlighted text: "Tokyo, Tokyo, Tokyo" → 1 (same place mentioned 3x)
- Highlighted text: "Tokyo, Kyoto, Osaka" → 3 (distinct cities)
- Highlighted text: "Tokyo and Tokyo Tower" → 2 (different places)

Screenshot may show many other locations → IGNORE THEM
Count UNIQUE locations from: Highlighted text ONLY

Return ONLY a number.`
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
  url: string
): Promise<ExtractionResult[]> {
  console.log('[AI Multi] Extracting multiple locations...')
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `⚠️ CRITICAL: Extract DISTINCT/UNIQUE locations from HIGHLIGHTED TEXT ONLY.

The screenshot is VISUAL CONTEXT. Do not extract locations visible in the screenshot that aren't mentioned in the highlighted text.

User highlighted: "${selectedText}"

Extract ALL DISTINCT locations mentioned in THIS TEXT.
- If "Paris" mentioned 3 times → Extract it ONCE
- If "Tokyo" and "Tokyo Tower" mentioned → Extract BOTH (different places)
- If "Senso-ji" and "Senso-ji Temple" → Extract ONCE (same place)

The screenshot helps you see the page, but extract UNIQUE locations ONLY from highlighted text.

Deduplication Rules:
✅ Same location mentioned multiple times → Return ONCE
✅ Similar names for same place → Return ONCE
✅ Different places (Tokyo vs Tokyo Tower) → Return BOTH

Example:
- Highlighted: "Tokyo, Tokyo, Kyoto, Tokyo, Osaka"
- Screenshot shows: 20 other cities/places in thread → IGNORE THEM!
- Extract: Tokyo (1x), Kyoto (1x), Osaka (1x) ← 3 DISTINCT locations

What to extract (from highlighted text):
✅ Cities, towns (Tokyo, Kyoto, Kamakura)
✅ Neighborhoods (Shibuya, Asakusa)
✅ Specific places (Disney Sea, Senso-ji Temple, Ichiran Ramen)
✅ Landmarks (Tokyo Tower)
✅ Hotels, restaurants, museums, parks

What NOT to extract:
❌ Day numbers ("Day 1")
❌ Durations ("3 days")
❌ Locations visible in screenshot but not in highlighted text
❌ Duplicate mentions of same location

Return as JSON:
{
  "locations": [
    {
      "location_name": "Exact name from highlighted text (deduplicated)",
      "category": "city/restaurant/temple/etc",
      "address": "If in highlighted text",
      "tips": ["From highlighted text only"],
      "confidence": 0.7
    }
  ]
}

Extract DISTINCT locations ONLY from: "${selectedText}" ← THIS TEXT ONLY
Screenshot purpose: Visual context to understand ambiguous terms
Return: UNIQUE locations only (no duplicates)

Output valid JSON only.`
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
    
    const result = JSON.parse(response.choices[0].message.content)
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
  pageTitle: string
): Promise<LocationVariation[]> {
  console.log('[AI Variations] Extracting 3 search queries...')
  console.log('[AI Variations] Selected text:', selectedText.substring(0, 100))
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `⚠️ CRITICAL: Extract location and create 3 Google Places search queries.

User highlighted: "${selectedText}"

The screenshot shows the FULL CONTEXT. Use it to:
- Complete partial words (e.g., "ryu" → screenshot shows "Ryugon")
- Add missing details (neighborhood, city, region, country)
- Understand vague references ("this place" → what place in screenshot?)

Create 3 search query variations from MOST specific to LEAST specific:

1. HIGH SPECIFICITY (confidence: 0.85-0.95)
   - Full name + neighborhood + city + region + country
   - Example: "Ryugon Traditional Inn, Minamiuonuma, Niigata, Japan"
   - Use ALL context from screenshot

2. MEDIUM SPECIFICITY (confidence: 0.70-0.85)
   - Name + city/region + country
   - Example: "Ryugon Inn Niigata Japan"
   - Core details only

3. LOW SPECIFICITY (confidence: 0.60-0.70)
   - Just the name (use screenshot to complete if partial)
   - Example: "Ryugon"
   - Simplest query

IMPORTANT RULES:
- If highlighted text is PARTIAL (e.g., "ryu"), use screenshot to find FULL name
- Always include country in high/medium specificity
- Return 3 distinct queries (not duplicates)
- Confidence decreases as specificity decreases

Source: ${url}
Page title: "${pageTitle}"

Return as JSON:
{
  "variations": [
    {
      "searchQuery": "Full query for Google Places",
      "confidence": 0.90,
      "reasoning": "Why this query will work",
      "specificityLevel": "high"
    },
    {
      "searchQuery": "Medium query",
      "confidence": 0.75,
      "reasoning": "Fallback if high fails",
      "specificityLevel": "medium"
    },
    {
      "searchQuery": "Simple query",
      "confidence": 0.65,
      "reasoning": "Last resort",
      "specificityLevel": "low"
    }
  ]
}

Output valid JSON only.`
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
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    const variations = result.variations || []
    
    console.log('[AI Variations] Generated:', variations.length, 'queries')
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

