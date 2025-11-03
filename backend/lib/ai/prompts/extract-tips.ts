/**
 * Builds prompt for extracting 3 prioritized tips from multiple sources
 */
export function buildExtractTipsPrompt(
  selectedText: string,
  reviews: Array<{ rating: number; text: string }>
): string {
  const reviewSnippets = reviews
    .map((r, i) => `${i + 1}. (${r.rating}★) ${r.text.substring(0, 150)}...`)
    .join('\n')
  
  return `You are extracting actionable travel tips from multiple sources for a location card.

SOURCES (in priority order):
1. User's highlighted text: "${selectedText}"
2. Context around the highlight (visible in screenshot - look for surrounding paragraph)
3. Other useful content on the page (visible in screenshot - comments, upvoted tips)
4. Google Reviews:
${reviewSnippets || '(No reviews available)'}

TASK:
Extract exactly 3 actionable tips. Prioritize user's content over Google reviews.

RULES:
- Tag each tip with its source: "highlight" | "context" | "page" | "google_reviews"
- Focus on: timing (when to visit), recommendations (what to try), insider tips, warnings
- Exclude: obvious facts (location name), generic descriptions ("nice place")
- Deduplicate similar tips (e.g., "go early" and "arrive before 10am" are duplicates)
- If you find only 1 tip from user's content (highlight/context/page), fill the remaining 2 slots with Google reviews
- Be specific and actionable

EXAMPLES OF GOOD TIPS:
✅ "Go at 5pm to avoid crowds" (timing)
✅ "Try the house vermouth" (recommendation)
✅ "Cash only, no reservations" (insider tip)
✅ "Closes early on Sundays" (warning)

EXAMPLES OF BAD TIPS:
❌ "Nice atmosphere" (too generic)
❌ "Bar Raval is a restaurant" (obvious fact)
❌ "Located in Toronto" (not actionable)

Return as JSON:
{
  "tips": [
    { 
      "text": "Go at 5pm to avoid crowds", 
      "source": "highlight", 
      "confidence": 0.95 
    },
    { 
      "text": "Try the house vermouth", 
      "source": "context", 
      "confidence": 0.85 
    },
    { 
      "text": "Amazing cocktails", 
      "source": "google_reviews", 
      "confidence": 1.0,
      "review_rating": 5
    }
  ]
}

If you cannot find any actionable tips, return an empty tips array: {"tips": []}`
}

