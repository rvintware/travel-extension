import { GlobalContext } from '../extract'

export function buildLocationVariationsPrompt(
  selectedText: string,
  url: string,
  pageTitle: string,
  globalContext: GlobalContext | null
): string {
  const contextStr = globalContext 
    ? `

GEOGRAPHIC CONTEXT AVAILABLE:
- Location: ${globalContext.city}, ${globalContext.country}
- Region: ${globalContext.region || 'N/A'}
- Coordinates: ${globalContext.approximateCoordinates?.lat}, ${globalContext.approximateCoordinates?.lng}
- Confidence: ${globalContext.confidence}

Use this context to create better search queries!
`
    : ''

  return `⚠️ CRITICAL: Extract location and create 3 Google Places search queries.${contextStr}

User highlighted: "${selectedText}"

**CRITICAL PRIORITY RULE - READ THIS FIRST:**

1. **Is "${selectedText}" SPECIFIC or GENERIC?**
   
   SPECIFIC = Proper noun, specific name (Qingdao, Tokyo Tower, Senso-ji Temple)
   → Use it LITERALLY in all 3 variations
   → Only add geographic context (region, country)
   → Do NOT replace it with something from the screenshot
   
   GENERIC = Common noun, no specific name (brewery, temple, restaurant, hotel)
   → Infer specific name FROM screenshot
   → Then add geographic context

2. **Classification guide:**
   - City names (Qingdao, Paris, Tokyo) → SPECIFIC
   - Place names (Tokyo Tower, Senso-ji) → SPECIFIC
   - Common nouns (brewery, temple, hotel) → GENERIC

**YOUR TASK:**
Create EXACTLY 3 search query variations for Google Places API.
NEVER return an empty array - always return 3 variations.

${globalContext ? `
**GEOGRAPHIC CONTEXT IS AVAILABLE:**
You know the user is viewing content about: ${globalContext.city}, ${globalContext.region || ''}, ${globalContext.country}

**HOW TO USE THIS CONTEXT:**

1. **For SPECIFIC city names** (like "Qingdao", "Tokyo", "Paris"):
   - HIGH: City + region + country → "Qingdao, Shandong Province, China"
   - MEDIUM: City + country → "Qingdao, China"
   - LOW: City alone → "Qingdao"
   - DO NOT replace city with a place inside it!

2. **For SPECIFIC place names** (like "Tsingtao Brewery", "Tokyo Tower"):
   - HIGH: Place + city + region + country
   - MEDIUM: Place + city + country
   - LOW: Place alone
   - DO NOT change the place name!

3. **For GENERIC terms** (like "brewery", "temple", "restaurant"):
   - HIGH: Inferred name + city + region + country
   - MEDIUM: Inferred name + city + country
   - LOW: Generic term + city
   - DO infer specific name from screenshot

**IMPORTANT RULES:**
- If input is SPECIFIC: Use it literally, just add context
- If input is GENERIC: Infer name, then add context
- ALWAYS return EXACTLY 3 variations (never 0, never 1, never 2)
- Confidence decreases from HIGH to LOW
- Each query must be different (not duplicates)

**Example 1 - SPECIFIC city name (DO NOT INFER):**
Input: "Qingdao"
Classification: SPECIFIC (it's a city name)
Context: Qingdao, Shandong Province, China
Screenshot shows: Mentions of Tsingtao Brewery
You should return:
1. HIGH: "Qingdao, Shandong Province, China" (0.90) ← City + context
2. MEDIUM: "Qingdao, China" (0.75) ← City + country
3. LOW: "Qingdao" (0.65) ← City alone
DO NOT return "Tsingtao Brewery" - user asked for the city!

**Example 2 - GENERIC term (DO INFER):**
Input: "brewery"
Classification: GENERIC (no specific name given)
Context: Qingdao, Shandong, China
Screenshot shows: Tsingtao Brewery
You should return:
1. HIGH: "Tsingtao Brewery, Qingdao, Shandong, China" (0.85)
2. MEDIUM: "Tsingtao Brewery, Qingdao" (0.75)
3. LOW: "brewery Qingdao" (0.65)

**Example 3 - SPECIFIC place name (DO NOT INFER):**
Input: "Tsingtao Brewery Museum"
Classification: SPECIFIC (specific place name)
Context: Qingdao, China
You should return:
1. HIGH: "Tsingtao Brewery Museum, Qingdao, Shandong, China" (0.90)
2. MEDIUM: "Tsingtao Brewery Museum, Qingdao" (0.80)
3. LOW: "Tsingtao Brewery Museum" (0.70)
` : `
**NO GEOGRAPHIC CONTEXT AVAILABLE:**
Use only the screenshot to infer location details.

1. HIGH SPECIFICITY (confidence: 0.85-0.95)
   - Full name + neighborhood + city + region + country (if visible in screenshot)
   
2. MEDIUM SPECIFICITY (confidence: 0.70-0.85)
   - Name + city/region + country (what you can see)
   
3. LOW SPECIFICITY (confidence: 0.60-0.70)
   - Just the name (completed if partial)

**RULES:**
- ALWAYS return EXACTLY 3 variations
- If input is SPECIFIC: Use it literally
- If input is GENERIC: Infer from screenshot
- Add as much location context as you can see
`}

Source: ${url}
Page title: "${pageTitle}"

**CRITICAL OUTPUT REQUIREMENTS:**
✅ MUST return exactly 3 variations (not 0, not 1, not 2)
✅ MUST return valid JSON with "variations" array
✅ NEVER return an empty array []
✅ Each variation needs: searchQuery, confidence, reasoning, specificityLevel
✅ searchQuery must be a non-empty string suitable for Google Places API
✅ If input is SPECIFIC, use it in ALL 3 queries (don't replace it)

**OUTPUT FORMAT:**
{
  "variations": [
    {
      "searchQuery": "Most specific query with all context",
      "confidence": 0.90,
      "reasoning": "Why this query will work best",
      "specificityLevel": "high"
    },
    {
      "searchQuery": "Medium specificity query",
      "confidence": 0.75,
      "reasoning": "Fallback if high specificity fails",
      "specificityLevel": "medium"
    },
    {
      "searchQuery": "Simplest query",
      "confidence": 0.65,
      "reasoning": "Last resort fallback",
      "specificityLevel": "low"
    }
  ]
}

Remember: Output VALID JSON ONLY. No markdown, no explanations, just the JSON object.`
}

