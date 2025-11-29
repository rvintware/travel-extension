# Debugging Guide - Phase 0.3 AI Pipeline

**Use this to trace the complete save workflow and find where issues occur.**

---

## Complete Log Flow (Expected)

When you right-click and save, you should see logs in this exact order across all consoles:

### 1. Extension Background Console
```
[BG] ========== SAVE STARTED ==========
[BG] Menu ID: save-to-trip (or save-to-library)
[BG] Selected text length: 45
[BG] Link URL: https://maps.app.goo.gl/... (if present)
[BG] Link URL captured: https://maps.app.goo.gl/... (if present)
[BG] Tab URL: https://reddit.com/...
[BG] Getting user settings...
[BG] User ID: 55f2b33e...
[BG] Default country ID: 43fa693a...
[BG] Fetching countries...
[BG] Country: Japan
[BG] Requesting rich context from content script...
```

### 2. Content Script Console (On the webpage)
```
[Content] Received message: CAPTURE_RICH_CONTEXT
[Content] Starting rich context capture...
[Content] Selection length: 45
[Context Capture] Platform: reddit, Estimated tokens: 627/800
[Content] Context captured: 627 tokens
[Content] Platform: reddit
```

### 3. Back to Extension Background Console
```
[BG] Content script response: {success: true, context: {...}}
[BG] ✅ Rich context captured: 627 tokens
[BG] Platform: reddit
[BG] Calling backend API...
[BG] Has rich context: true
[API Client] Saving location...
[API Client] URL: http://localhost:3000/api/locations
[API Client] Data keys: ["userId", "countryId", "name", ...]
[API Client] Has originalContext: true
[API Client] Response status: 201
[API Client] ✅ Success - Location ID: e710a9a7...
[API Client] Processing status: pending
[BG] ✅ Location created: e710a9a7...
[BG] Processing status: pending
[BG] ========== SAVE ENDED ==========
```

### 4. Backend Console
```
[API] ========== POST /api/locations ==========
[API] Request body keys: ["userId", "countryId", "name", ...]
[API] Has originalContext: true
[API] User ID: 55f2b33e...
[API] ✅ Validation passed
[API] ✅ User ensured
[API] Inserting location to Supabase...
[API] ✅ Location created: e710a9a7...
[API] Triggering Inngest job...
[API] Event name: location/created
[API] Location ID: e710a9a7...
[API] Has INNGEST_EVENT_KEY: false (or true)
[API] ✅ Inngest event sent successfully!
[API] ========== Responding 201 Created ==========
```

### 5. Inngest Dashboard (http://localhost:8288)
- **Events tab:** New `location/created` event appears
- **Runs tab:** Job starts running
- **Click the run:** See 3 steps execute

### 6. Link Processing Logs (NEW - Phase 4+)

When saving via link, you'll see additional logs:

**Step 0: Link Pre-Parsing**
```
[Job] Step 0: Link Pre-Parsing
[Job]   Expanding shortened URL: https://maps.app.goo.gl/...
[Job]   Expanded to: https://www.google.com/maps/place/...
[Job] Found 1 Google Maps links
[Job] Found 0 other links
[Job] Cleaned text length: 25 chars
```

**Step 0.5: Process Google Maps Links**
```
[Job] Step 0.5: Process Google Maps Links
[Job] Processing link 1/1
[Job]   URL: https://maps.app.goo.gl/...
[Job]   Expanded URL: https://www.google.com/maps/place/...
[Job]   Confidence: high
[Job]   Attempting Place ID lookup: ChIJ...
[Job]   ✅ Found via Place ID: Location Name
```

---

## Where Issues Occur

### Issue: No Content Script Logs

**Problem:** Don't see `[Content] Received message`

**Causes:**
1. Content script not injected on that page
2. Page refreshed after extension install (refresh needed)
3. Content script crashed

**Fix:**
- Refresh the webpage after loading extension
- Check webpage console for errors
- Verify content script in `chrome://extensions/` → Inspect views

---

### Issue: "Receiving end does not exist"

**Problem:** Background can't reach content script

**Fixed by:** IIFE pattern in content script ✅

**If still occurs:**
- Content script not loaded yet
- Try saving again after page fully loads

---

### Issue: No Backend Logs

**Problem:** Don't see `[API] ========== POST /api/locations`

**Causes:**
1. Backend not running
2. CORS blocking request
3. Wrong API URL
4. Network error

**Check:**
- Is `pnpm run dev` running in backend?
- Visit http://localhost:3000/api/health manually
- Check browser Network tab for failed requests

---

### Issue: No Inngest Events

**Problem:** Event sent but not in Inngest dashboard

**Causes:**
1. Inngest dev server not running
2. Event sent to cloud instead of local
3. Inngest send failed

**Check:**
- Is `npx inngest-cli dev` running?
- Dashboard at http://localhost:8288 works?
- Backend logs show "Inngest event sent successfully"?

**If "Inngest send failed":**
- Check error message in backend console
- Might be network issue
- Inngest client config issue

---

### Issue: Link Not Processed

**Problem:** Link URL present but no link results in Step 0.5

**Check:**
1. Look for `[Job] Step 0: Link Pre-Parsing` logs
2. Check if `[Job] Found X Google Maps links` shows > 0
3. Verify URL is recognized as Google Maps URL

**Common Causes:**
- URL not recognized as Google Maps (check `isGoogleMapsUrl()` logic)
- URL expansion failed (network issue, timeout)
- URL parsing failed (malformed URL)

**Fix:**
- Check backend console for URL expansion errors
- Verify URL format matches Google Maps patterns
- Check network connectivity for shortened URLs

---

### Issue: Place ID Not Extracted

**Problem:** Link processed but Place ID lookup failed

**Check:**
1. Look for `[Job]   Attempting Place ID lookup: ChIJ...`
2. Check if `[Job]   ❌ Place ID lookup failed` appears
3. Verify fallback methods (coordinates, query) attempted

**Common Causes:**
- Place ID invalid or expired
- Google Places API key missing or invalid
- API quota exceeded

**Fix:**
- Verify `GOOGLE_PLACES_API_KEY` environment variable set
- Check Google Cloud Console for API quota
- Verify Place ID format (should start with `ChIJ`)

---

### Issue: URL Expansion Failed

**Problem:** Shortened URL not expanding

**Check:**
1. Look for `[Job]   Expanding shortened URL: ...`
2. Check if `[Job]   Expanded to: ...` appears
3. Look for axios/network errors in backend console

**Common Causes:**
- Network timeout (default 5 seconds)
- URL redirect loop (maxRedirects exceeded)
- Invalid shortened URL

**Fix:**
- Check network connectivity
- Verify URL is accessible (try in browser)
- Check axios timeout settings in `url-expander.ts`

---

### Issue: Deduplication Not Working

**Problem:** Same location saved twice (once from link, once from text)

**Check:**
1. Look for `[Job] Step 4: Reconciliation` logs
2. Check `[Job] Grouped into X unique places`
3. Verify `[Job]   Selected: source=link` appears

**Common Causes:**
- Different Place IDs for same location (rare)
- Reconciliation step failed
- Place ID not extracted from one source

**Fix:**
- Check reconciliation logs for grouping
- Verify both link and text results have place_id
- Check if confidence/source prioritization working

---

## Debugging Commands

### Test Content Script

**In webpage console:**
```javascript
// Check if content script is loaded
console.log('Chrome runtime:', !!window.chrome?.runtime)

// Test message passing
chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
  console.log('Response:', response)
})
```

### Test Backend

```bash
# Health check
curl http://localhost:3000/api/health

# Should return:
{"status":"ok","database":"connected"}
```

### Check Inngest

```bash
# Visit dashboard
open http://localhost:8288

# Should see:
# - Functions tab: process-location listed
# - Events tab: Any events that were sent
```

---

## SQL to Run in Supabase

**Mark old locations complete:**
```sql
UPDATE locations 
SET processing_status = 'complete'
WHERE processing_status IN ('pending', 'processing')
  AND original_context IS NULL;
```

**Add original_context column (if not exists):**
```sql
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS original_context JSONB;
```

**Check current status:**
```sql
SELECT 
  processing_status,
  COUNT(*) as count,
  COUNT(CASE WHEN original_context IS NOT NULL THEN 1 END) as with_context
FROM locations 
GROUP BY processing_status;
```

---

## What Each Console Shows

### Extension Background Console
**Where:** `chrome://extensions/` → Travel Companion → "Inspect views: service worker"

**Shows:**
- Save workflow start to end
- Rich context capture
- API calls
- Toast attempts

### Content Script Console
**Where:** Any webpage → F12 → Console tab

**Shows:**
- Message received from background
- Context capture process
- Platform detection
- Token estimation

### Backend Console
**Where:** Terminal where `pnpm run dev` runs

**Shows:**
- API requests received
- Database operations
- Inngest event sending
- Errors and successes

### Inngest Dashboard
**Where:** http://localhost:8288

**Shows:**
- Events received
- Jobs running/complete/failed
- Step-by-step execution
- Retries

---

## Success Indicators

✅ **All logs appear in sequence**  
✅ **No red error messages**  
✅ **Inngest dashboard shows event**  
✅ **Job completes (or fails with clear error)**  
✅ **Location card shows "Processing..." then updates**  

---

## If It Still Doesn't Work

**Share:**
1. Extension background console logs (full output)
2. Backend console logs (full output)
3. Inngest dashboard screenshot
4. Any error messages

**And I can pinpoint the exact issue!**

All logging is now in place for complete traceability. 🔍

