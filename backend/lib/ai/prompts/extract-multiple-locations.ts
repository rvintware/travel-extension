import { GlobalContext } from '../extract'

export function buildExtractMultipleLocationsPrompt(
  selectedText: string,
  url: string,
  globalContext: GlobalContext | null
): string {
  const contextStr = globalContext 
    ? `\n\n🌍 GEOGRAPHIC CONTEXT:
This content is about: ${globalContext.city || ''}, ${globalContext.region || ''}, ${globalContext.country}
Coordinates: ${globalContext.approximateCoordinates?.lat}, ${globalContext.approximateCoordinates?.lng}

Use this context to enrich location names:
- "brewery" → "Tsingtao brewery, ${globalContext.city}"
- "old town" → "old town, ${globalContext.city}, ${globalContext.country}"
- "pedestrian street" → "pedestrian street, ${globalContext.city}"
`
    : ''

  return `⚠️ CRITICAL: Extract DISTINCT/UNIQUE locations from HIGHLIGHTED TEXT ONLY.${contextStr}

The screenshot is VISUAL CONTEXT. Do not extract locations visible in the screenshot that aren't mentioned in the highlighted text.

User highlighted: "${selectedText}"

🔍 CONTEXT READING INSTRUCTION:
READ THE SENTENCE in the screenshot containing each highlighted location.
This helps you understand what type of place it is and its proper name.

Look for clues:
- "restaurant called ${selectedText}" → Extract as: restaurant
- "we ate at ${selectedText}" → It's a dining place
- "${selectedText} is a temple/hotel/cafe" → Use that type
- "stayed at ${selectedText}" → It's accommodation

This sentence context helps you determine the correct category and search query.

Extract ALL DISTINCT locations mentioned in THIS TEXT.
- If "Paris" mentioned 3 times → Extract it ONCE
- If "Tokyo" and "Tokyo Tower" mentioned → Extract BOTH (different places)
- If "Senso-ji" and "Senso-ji Temple" → Extract ONCE (same place)

${globalContext ? `
**IMPORTANT: Enrich each location with context!**
- READ THE SENTENCE to find what type of place it is (restaurant/hotel/temple/etc)
- If generic term ("brewery"), use sentence + global context: "Tsingtao brewery, ${globalContext.city}"
- If proper noun ("Shinsuke"), use sentence to find type: "Shinsuke restaurant, ${globalContext.city}"
- Always include: [name] [type], ${globalContext.city}, ${globalContext.country}
` : ''}

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
      "location_name": "Enriched name with context",
      "category": "city/restaurant/temple/etc",
      "address": "${globalContext ? `Should include ${globalContext.city}, ${globalContext.country}` : 'If in highlighted text'}",
      "tips": ["From highlighted text only"],
      "confidence": 0.7
    }
  ]
}

Extract DISTINCT locations ONLY from: "${selectedText}" ← THIS TEXT ONLY
Screenshot purpose: Visual context to understand ambiguous terms
Return: UNIQUE locations only (no duplicates)

Output valid JSON only.`
}

