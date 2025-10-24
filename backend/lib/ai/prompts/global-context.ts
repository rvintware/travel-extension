export function buildGlobalContextPrompt(
  selectedText: string,
  url: string,
  pageTitle: string
): string {
  return `🌍 CRITICAL: Determine the PRIMARY GEOGRAPHIC CONTEXT of this content.

**Your task:** What city and country is this discussion PRIMARILY about?

User highlighted this text (possibly multiple selections):
"""
${selectedText}
"""

Source: ${url}
Page title: "${pageTitle}"

The screenshot shows the full page context.

**Analysis Instructions:**

1. **Look for explicit geographic mentions:**
   - City names: "Qingdao", "Tokyo", "Paris", "New York"
   - Country names: "China", "Japan", "France"
   - Regional names: "Shandong Province", "California"

2. **Analyze the screenshot for context:**
   - Post titles mentioning locations
   - Usernames with location flairs
   - Visible text discussing a specific place
   - Images showing recognizable landmarks

3. **Infer from discussion topics:**
   - "Tsingtao brewery" → Qingdao, China
   - "Disney Sea" → Tokyo, Japan
   - "Eiffel Tower" → Paris, France

4. **Confidence scoring:**
   - 0.95: Explicit city + country mentioned
   - 0.85: Strong inference from landmarks/topics
   - 0.70: Implicit from context clues
   - 0.50: Weak inference
   - 0.30: Multiple possible locations

**Important Rules:**
- If multiple cities mentioned, pick the PRIMARY one (most discussed)
- If discussing a trip across cities, pick the first/main destination
- If truly ambiguous, return lower confidence
- ALWAYS include approximate coordinates for the city center

**Examples:**

Input: "visiting the brewery and old German city"
Context: Screenshot shows Reddit post about Qingdao
Output: {
  city: "Qingdao",
  region: "Shandong Province",
  country: "China",
  countryCode: "CN",
  approximateCoordinates: { lat: 36.067, lng: 120.383 },
  confidence: 0.90,
  reasoning: "User discussing Qingdao landmarks. Tsingtao brewery and German architecture are famous Qingdao features."
}

Input: "Check out Senso-ji Temple and Tokyo Tower"
Output: {
  city: "Tokyo",
  region: null,
  country: "Japan",
  countryCode: "JP",
  approximateCoordinates: { lat: 35.6762, lng: 139.6503 },
  confidence: 0.95,
  reasoning: "Explicitly mentions Tokyo Tower and Senso-ji (famous Tokyo landmark)"
}

Input: "great food and nice people"
Context: Generic travel post, no location visible
Output: null (cannot determine context)

**Return as JSON:**
{
  "city": "City name or null",
  "region": "Region/State/Province or null",
  "country": "Country name",
  "countryCode": "ISO 3166-1 alpha-2 code",
  "approximateCoordinates": {
    "lat": 35.6762,
    "lng": 139.6503
  },
  "confidence": 0.85,
  "reasoning": "Brief explanation of how you determined this"
}

If you cannot determine a location with reasonable confidence, return null.

Output valid JSON only.`
}

