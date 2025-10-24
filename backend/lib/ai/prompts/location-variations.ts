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

**🔍 CONTEXT EXTRACTION HIERARCHY:**

Before classifying as SPECIFIC or GENERIC, you MUST read context in this order:

**LAYER 1: IMMEDIATE SENTENCE (HIGHEST PRIORITY)**
Find the sentence in the screenshot that contains "${selectedText}".

Look for these patterns:
1. **Type + Name Pattern:**
   - "restaurant called X" → Type: restaurant, Name: X
   - "X hotel" → Type: hotel, Name: X
   - "temple of X" → Type: temple, Name: X
   - "X shrine" → Type: shrine, Name: X
   - "cafe named X" → Type: cafe, Name: X

2. **Descriptors:**
   - "small", "traditional", "famous", "local", "popular"
   - "historic", "modern", "authentic"
   
3. **Actions/Context:**
   - "we ate at X" → dining
   - "we stayed at X" → accommodation
   - "we visited X" → attraction

**LAYER 2: PARAGRAPH CONTEXT (MEDIUM PRIORITY)**
Read the full paragraph containing that sentence.

Look for:
1. **Neighborhood/District:**
   - "in [Neighborhood]" (e.g., "in Tenjin", "in Shibuya")
   - "[Neighborhood] area/district"
   - "the [Neighborhood] neighborhood"

2. **Spatial References:**
   - "near the station"
   - "walking distance from X"
   - "across from Y"
   - "in the shopping district"

3. **Location Context:**
   - "we stayed in X and..." → X is the general area
   - "exploring the Y area" → Y is the district

**LAYER 3: PAGE CONTEXT (LOWER PRIORITY)**
Look at the visible page/post.

Look for:
1. **Post Title/Heading:**
   - "Trip to [City]"
   - "[City] recommendations"
   - "Where to eat in [City]"

2. **Subreddit/Forum:**
   - r/JapanTravel → Country: Japan
   - r/paris → City: Paris

3. **Overall Topic:**
   - What city is the main subject?
   - What country is being discussed?

**LAYER 4: GLOBAL CONTEXT (BASELINE)**
${globalContext ? `
You already have this information:
- City: ${globalContext.city}
- Region: ${globalContext.region}
- Country: ${globalContext.country}
- Confidence: ${globalContext.confidence}
` : 'No global context available - rely on Layers 1-3.'}

---

**HOW TO COMBINE LAYERS:**

Build your 3 search queries by progressively combining layers:

**HIGH specificity query (all layers):**
Combine: Name (L1) + Type (L1) + District (L2) + City (L3/L4) + Country (L4)
Example: "Shinsuke restaurant, Tenjin, Fukuoka, Japan"

**MEDIUM specificity query (most layers):**
Combine: Name (L1) + Type (L1) + City (L3/L4) + Country (L4)
Example: "Shinsuke restaurant, Fukuoka, Japan"

**LOW specificity query (minimal layers):**
Combine: Name (L1) + Type (L1) + City (L3/L4)
Example: "Shinsuke restaurant Fukuoka"

---

**EXAMPLES OF LAYER EXTRACTION:**

**Example 1: "Shinsuke" highlighted**
LAYER 1 (sentence): "We walked into a small restaurant called Shinsuke"
→ Extract: Type=restaurant, Descriptor=small, Name=Shinsuke

LAYER 2 (paragraph): "We stayed in Tenjin and liked the eating and shopping..."
→ Extract: District=Tenjin, Context=dining area

LAYER 3 (page): Post title: "Fukuoka recommendations"
→ Extract: City=Fukuoka

LAYER 4 (global): Country=Japan, City=Fukuoka
→ Use: Country=Japan

COMBINED QUERIES:
1. HIGH: "Shinsuke restaurant, Tenjin, Fukuoka, Japan" (0.90)
2. MEDIUM: "Shinsuke restaurant, Fukuoka, Japan" (0.75)
3. LOW: "Shinsuke restaurant Fukuoka" (0.65)

**Example 2: "brewery" highlighted**
LAYER 1: "couldn't resist queuing up for the matcha brûlée crepe thing at Tenjin Tabanenoshi"
→ Extract: Type=dessert/cafe, Place=Tenjin Tabanenoshi, Action=queuing

LAYER 2: "We stayed in Tenjin and liked the eating and shopping"
→ Extract: District=Tenjin

LAYER 3: Page shows discussion about Fukuoka
→ Extract: City=Fukuoka

COMBINED QUERIES:
1. HIGH: "Tenjin Tabanenoshi, Tenjin, Fukuoka, Japan" (0.85)
2. MEDIUM: "Tenjin Tabanenoshi Fukuoka" (0.75)
3. LOW: "Tabanenoshi Tenjin" (0.65)

**Example 3: "Qingdao" highlighted**
LAYER 1: Just "Qingdao" (a city name)
→ Extract: Type=city, Name=Qingdao (SPECIFIC)

LAYER 2: Discussion mentions "Tsingtao brewery and old German city"
→ Extract: Context=city discussion, Landmarks mentioned

LAYER 3: Reddit post about China travel
→ Extract: Country=China

LAYER 4: Global context confirms Qingdao, China
→ Use: City=Qingdao, Region=Shandong, Country=China

COMBINED QUERIES (for SPECIFIC city name):
1. HIGH: "Qingdao, Shandong Province, China" (0.90)
2. MEDIUM: "Qingdao, China" (0.75)
3. LOW: "Qingdao" (0.65)

---

**CRITICAL RULES:**

1. **ALWAYS read Layer 1 first** - The immediate sentence is the most important
2. **Extract the TYPE** from Layer 1 - Is it a restaurant? Hotel? Temple?
3. **Layer 2 gives LOCATION** - Usually a neighborhood/district
4. **Layer 3 gives CITY** - The overall city being discussed
5. **Combine ALL layers** in your HIGH query for maximum specificity
6. **If Layer 1 is GENERIC** ("brewery", "temple"), look for the actual NAME in the sentence
7. **If Layer 1 is SPECIFIC** ("Shinsuke", "Qingdao"), use it literally

---

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

