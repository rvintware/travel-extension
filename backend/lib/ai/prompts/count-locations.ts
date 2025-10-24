export function buildCountLocationsPrompt(selectedText: string): string {
  return `⚠️ IMPORTANT: 
- The screenshot is for VISUAL CONTEXT ONLY
- COUNT DISTINCT locations mentioned in the HIGHLIGHTED TEXT ONLY
- DO NOT count locations from other parts of the screenshot
- If same location mentioned multiple times, count it ONCE

🔍 CONTEXT READING INSTRUCTION:
Before counting, READ THE SENTENCE in the screenshot that contains the highlighted text.
This helps you understand what the highlighted text refers to.

User highlighted this text: "${selectedText}"

Look for patterns in the sentence:
- "restaurant called ${selectedText}" → Count: 1 (it's a restaurant)
- "we stayed at ${selectedText}" → Count: 1 (it's accommodation)
- "visited ${selectedText}" → Count: 1 (it's an attraction)
- "${selectedText} is a hotel/temple/cafe" → Count: 1 (location with type)
- "${selectedText}, ${selectedText}, Tokyo" → Count: 2 (de-duplicate first word, count Tokyo)

If the sentence shows "${selectedText}" is a place name in a travel context, count it as 1 location.

Count how many DISTINCT/UNIQUE locations are mentioned in THIS HIGHLIGHTED TEXT.

IMPORTANT - Deduplication rules:
- "Tokyo" mentioned 3 times → Count: 1
- "Tokyo Tower" mentioned twice → Count: 1
- "Tokyo" and "Tokyo Tower" → Count: 2 (different places)
- "Senso-ji" and "Senso-ji Temple" → Count: 1 (same place)

The screenshot helps you READ THE SENTENCE to understand context,
but you should ONLY count UNIQUE locations that appear in the highlighted text.

A location can be:
✅ Cities (Tokyo, Kyoto)
✅ Specific places (Disney Sea, Senso-ji Temple)
✅ Landmarks, restaurants, hotels, temples, etc.
✅ Proper nouns in travel context (Shinsuke, Ryugon, etc.)

Examples:
- Highlighted: "Disney Sea seems well-regarded" → Count: 1
- Highlighted: "Shinsuke" + sentence: "restaurant called Shinsuke" → Count: 1
- Highlighted: "Tokyo, Tokyo, Tokyo" → Count: 1 (same place 3x)
- Highlighted: "Tokyo, Kyoto, Osaka" → Count: 3 (distinct cities)
- Highlighted: "Tokyo and Tokyo Tower" → Count: 2 (different places)

Screenshot may show many other locations → IGNORE THEM
Count UNIQUE locations from highlighted text ONLY (read sentence to understand what they are)

Return ONLY a number.`
}

