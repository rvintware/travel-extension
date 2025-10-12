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
            text: `Extract travel location information from this screenshot.

The user highlighted this text: "${selectedText}"

Source:
- URL: ${url}
- Page Title: "${pageTitle}"

Look at the screenshot to understand the full context around the highlighted text.
Extract the location information as JSON:

{
  "location_name": "Official name or descriptive identifier",
  "address": "Full address or neighborhood",
  "neighborhood": "Area/district",
  "category": "One of: restaurant, cafe, bar, temple, shrine, museum, park, hotel, shop, sight, activity",
  "subcategory": "More specific type",
  "summary": "1-2 sentence compelling description",
  "tips": ["Array of 3-5 actionable tips from the visible text"],
  "confidence": 0.85
}

Use the visual context from the screenshot to understand what location the user is referring to.
Extract tips as direct quotes when possible.

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
 * Extract location information from rich context using AI
 */
export async function extractLocationWithAI(context: any): Promise<ExtractionResult> {
  const platform = context?.metadata?.platform || 'generic'
  const systemPrompt = buildSystemPrompt(platform)
  const userMessage = buildUserMessage(context)
  
  console.log(`[AI Extract] Platform: ${platform}, Message length: ${userMessage.length} chars`)
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower = more deterministic
      max_tokens: 500,
    })
    
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content in AI response')
    }
    
    const result = JSON.parse(content) as ExtractionResult
    
    console.log(`[AI Extract] Success: ${result.location_name}, confidence: ${result.confidence}`)
    
    return result
  } catch (error) {
    console.error('[AI Extract] Failed:', error)
    throw error
  }
}

/**
 * Build system prompt based on platform
 */
function buildSystemPrompt(platform: string): string {
  if (platform === 'reddit') {
    return `You are a travel location extractor specialized in Reddit threads.

Reddit users often use vague references like "this place", "that shop", or "the one near X" without naming the location explicitly. Use the comment thread context to infer the actual location.

Extract the following information as JSON:
{
  "location_name": "Official name or descriptive identifier (e.g., 'Ramen shop near Shibuya station' if exact name unknown)",
  "address": "Full address if mentioned, or neighborhood/area",
  "neighborhood": "District or area (e.g., 'Shibuya', 'Asakusa')",
  "category": "One of: restaurant, cafe, bar, temple, shrine, museum, park, hotel, shop, sight, activity",
  "subcategory": "More specific (e.g., 'ramen', 'italian', 'buddhist_temple')",
  "summary": "1-2 sentence description capturing key info",
  "tips": ["Array of 3-5 actionable tips as direct quotes when possible"],
  "confidence": 0.85
}

Confidence scoring:
- 0.9-1.0: Exact name and address mentioned
- 0.7-0.9: Name clear, address approximate  
- 0.5-0.7: Name inferred from context, location approximate
- 0.0-0.5: Very vague, hard to identify specific location

If exact name isn't mentioned, create a descriptive name based on all available context.
Extract tips as direct quotes from the text when possible to preserve the original voice.

Output valid JSON only, no additional text.`
  }
  
  if (platform === 'blog' || platform === 'medium' || platform === 'article') {
    return `You are a travel location extractor for blog posts and articles.

Blog posts and articles usually have more structured information with proper names and details.

Extract the following information as JSON:
{
  "location_name": "Official location name",
  "address": "Full address if provided",
  "neighborhood": "District or area",
  "category": "One of: restaurant, cafe, bar, temple, shrine, museum, park, hotel, shop, sight, activity",
  "subcategory": "More specific category",
  "summary": "1-2 sentence compelling description",
  "tips": ["Array of 3-5 actionable tips from the text"],
  "confidence": 0.95
}

Use the article structure (headings, intro) to understand context.
Extract tips as quotes when they provide actionable advice.
Confidence should be high (0.8+) for well-written articles.

Output valid JSON only.`
  }
  
  // Generic/fallback prompt
  return `You are a travel location extractor.

Extract location information from the provided text and context.

Extract as JSON:
{
  "location_name": "Location name or description",
  "address": "Address or area if mentioned",
  "neighborhood": "District or neighborhood",
  "category": "One of: restaurant, cafe, bar, temple, shrine, museum, park, hotel, shop, sight, activity",
  "subcategory": "Specific type",
  "summary": "1-2 sentence description",
  "tips": ["3-5 actionable tips"],
  "confidence": 0.75
}

Be helpful even with incomplete information. Create descriptive names if exact name isn't provided.

Output valid JSON only.`
}

/**
 * Build user message from rich context
 */
function buildUserMessage(context: any): string {
  let message = 'Extract location information:\n\n'
  
  // Simple context format (Phase 0.3 MVP)
  message += `USER HIGHLIGHTED: "${context?.selectedText || ''}"\n\n`
  
  message += `Source:\n`
  message += `- URL: ${context?.url || ''}\n`
  message += `- Page Title: "${context?.pageTitle || ''}"\n`
  message += `- Platform: ${context?.platform || 'generic'}\n\n`
  
  // Add hint based on URL
  if (context?.platform === 'reddit') {
    message += `This is from a Reddit discussion. Use the thread title and subreddit context to infer the location.\n`
  } else if (context?.url?.includes('blog')) {
    message += `This is from a blog post. The location might be mentioned in the article title.\n`
  }
  
  message += `\nIf the exact location name isn't in the highlighted text, infer it from the page title and URL context.\n`
  message += `Create a descriptive name if needed (e.g., "Ramen shop in Shibuya" if exact name unknown).\n`
  
  return message
}

