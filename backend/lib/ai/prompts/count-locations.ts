export function buildCountLocationsPrompt(selectedText: string): string {
  return `⚠️ IMPORTANT: 
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
}

