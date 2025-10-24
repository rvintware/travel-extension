# Prompt Refactor Implementation Summary

**Date:** October 14, 2025  
**Status:** ✅ COMPLETE

## Problem Statement

When user highlighted "Qingdao" (a city name), the AI was inferring "Tsingtao Brewery" from the screenshot instead of searching for the city itself:

- **Input:** "Qingdao"
- **AI Output:** "Tsingtao Brewery, Qingdao, Shandong Province, China"
- **Result:** Found brewery instead of city ❌

## Root Cause

The AI didn't distinguish between:
- **SPECIFIC inputs** (city names, place names) → Should use literally
- **GENERIC inputs** (common nouns) → Should infer from screenshot

## Solution Implemented

### 1. Created New Directory Structure

```
backend/lib/ai/
├── extract.ts                          # Main functions (interfaces and logic)
└── prompts/
    ├── index.ts                        # Export all prompt builders
    ├── global-context.ts               # extractGlobalContext prompt
    ├── count-locations.ts              # countLocations prompt
    ├── extract-multiple-locations.ts   # extractMultipleLocations prompt
    └── location-variations.ts          # extractLocationVariations prompt (PRIORITY FIX)
```

### 2. Added CRITICAL PRIORITY RULE

The `location-variations.ts` prompt now includes:

```typescript
**CRITICAL PRIORITY RULE - READ THIS FIRST:**

1. **Is "${selectedText}" SPECIFIC or GENERIC?**
   
   SPECIFIC = Proper noun, specific name (Qingdao, Tokyo Tower, Senso-ji Temple)
   → Use it LITERALLY in all 3 variations
   → Only add geographic context (region, country)
   → Do NOT replace it with something from the screenshot
   
   GENERIC = Common noun, no specific name (brewery, temple, restaurant, hotel)
   → Infer specific name FROM screenshot
   → Then add geographic context
```

### 3. Added Explicit Examples

The prompt now includes clear examples for both scenarios:

**SPECIFIC city name (DO NOT INFER):**
```
Input: "Qingdao"
Classification: SPECIFIC (it's a city name)
Output:
1. HIGH: "Qingdao, Shandong Province, China" (0.90)
2. MEDIUM: "Qingdao, China" (0.75)
3. LOW: "Qingdao" (0.65)
DO NOT return "Tsingtao Brewery" - user asked for the city!
```

**GENERIC term (DO INFER):**
```
Input: "brewery"
Classification: GENERIC (no specific name given)
Output:
1. HIGH: "Tsingtao Brewery, Qingdao, Shandong, China" (0.85)
2. MEDIUM: "Tsingtao Brewery, Qingdao" (0.75)
3. LOW: "brewery Qingdao" (0.65)
```

## Files Created/Modified

### New Files (5):
1. ✅ `backend/lib/ai/prompts/index.ts` (~4 lines)
2. ✅ `backend/lib/ai/prompts/location-variations.ts` (~180 lines) ← PRIORITY FIX
3. ✅ `backend/lib/ai/prompts/global-context.ts` (~100 lines)
4. ✅ `backend/lib/ai/prompts/count-locations.ts` (~35 lines)
5. ✅ `backend/lib/ai/prompts/extract-multiple-locations.ts` (~85 lines)

### Modified Files (1):
6. ✅ `backend/lib/ai/extract.ts` - Updated to import and use prompt builders

## Expected Outcomes

### Test Case 1: "Qingdao" (City Name)

**Before:**
```
Input: "Qingdao"
AI Output: "Tsingtao Brewery, Qingdao, ..." ❌
Google Finds: Brewery (wrong!)
```

**After:**
```
Input: "Qingdao"
AI Classification: SPECIFIC (city name)
AI Output: 
1. "Qingdao, Shandong Province, China" (0.90)
2. "Qingdao, China" (0.75)
3. "Qingdao" (0.65)
Google Finds: City (correct!) ✅
```

### Test Case 2: "brewery" (Generic Term)

**Before:**
```
Input: "brewery"
AI Output: "brewery Qingdao"
Google Finds: Some brewery (might work)
```

**After:**
```
Input: "brewery"
AI Classification: GENERIC
AI Output:
1. "Tsingtao Brewery, Qingdao, Shandong, China" (0.85)
2. "Tsingtao Brewery, Qingdao" (0.75)
3. "brewery Qingdao" (0.65)
Google Finds: Tsingtao Brewery (correct!) ✅
```

### Test Case 3: "Tokyo Tower" (Specific Place)

**Expected:**
```
Input: "Tokyo Tower"
AI Classification: SPECIFIC (place name)
AI Output:
1. "Tokyo Tower, Minato, Tokyo, Japan" (0.90)
2. "Tokyo Tower, Tokyo, Japan" (0.80)
3. "Tokyo Tower" (0.70)
Google Finds: Tokyo Tower (correct!) ✅
```

## Benefits

1. ✅ **Fixes "Qingdao" Problem:** AI respects user's literal input
2. ✅ **Better Maintainability:** Prompts in separate files, easy to test/refine
3. ✅ **Version Control:** Can track prompt changes independently
4. ✅ **Clear Separation:** Code vs. prompt engineering
5. ✅ **Easier Testing:** Can unit test prompt generation without AI calls
6. ✅ **Type Safety:** TypeScript compilation passes with no errors

## Build Status

```bash
✓ Compiled successfully in 1898ms
✓ All linter errors resolved
✓ Production build ready
```

## Testing Required

The implementation is complete, but requires user testing:

### Test 1: Qingdao Scenario
- [ ] Highlight "Qingdao" on a page about Qingdao
- [ ] Verify AI returns 3 variations with "Qingdao" as the primary term
- [ ] Verify Google Places finds the city (not Tsingtao Brewery)
- [ ] Verify location has photos, verified status

### Test 2: Generic Term
- [ ] Highlight "brewery" on a page about Qingdao/Tsingtao
- [ ] Verify AI infers "Tsingtao Brewery"
- [ ] Verify Google Places finds the brewery

### Test 3: Province/State
- [ ] Highlight "Henan Province" or "California"
- [ ] Verify it's saved as a location (not filtered out as a country)
- [ ] Verify it's associated with the correct country

## Next Steps

1. User should test the scenarios above
2. Monitor Inngest job logs for the `extract-variations` step
3. Check that variations array is always length 3
4. Verify that SPECIFIC inputs (city names, place names) are used literally
5. Verify that GENERIC inputs (common nouns) are inferred from context

## Rollback Plan (If Needed)

If issues arise, the previous prompts can be restored from git history:
```bash
git log --oneline backend/lib/ai/extract.ts
git diff <commit-hash> backend/lib/ai/extract.ts
```

All prompt logic is now in separate files, making it easy to:
- Revert individual prompts
- A/B test different versions
- Track which prompt changes improve/degrade results

## Success Metrics

After user testing:
- ✅ "Qingdao" → Finds city (not brewery)
- ✅ "brewery" → Infers Tsingtao Brewery
- ✅ "Tokyo Tower" → Finds tower (not generic "tower")
- ✅ No regressions on existing extraction flows
- ✅ 3 variations always returned (never empty array)

