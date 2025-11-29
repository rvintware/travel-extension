# Manual Test Checklist - Link-First Processing Architecture

**Purpose:** Detailed manual testing guide for QA team  
**Last Updated:** Phase 6 Implementation  
**Prerequisites:** Chrome extension loaded in dev mode, backend API running, Inngest dev server running

---

## Pre-Test Setup

### 1. Environment Preparation
- [ ] Chrome extension built and loaded in dev mode
- [ ] Backend API running on `http://localhost:3000`
- [ ] Inngest dev server running (`npx inngest-cli dev`)
- [ ] Supabase database accessible
- [ ] Test user account created and logged in
- [ ] Browser console open for debugging

### 2. Test Data Preparation
- [ ] Reddit post with Google Maps link bookmarked
- [ ] Travel blog page with multiple Google Maps links
- [ ] Shortened Google Maps link (goo.gl or maps.app.goo.gl)
- [ ] Text content without links for regression testing

---

## Scenario 1: Link Only Save

**Objective:** Verify right-clicking directly on a Google Maps link saves the location correctly

### Steps:
1. Navigate to a Reddit post or travel blog containing a Google Maps link
2. **Right-click directly on the Google Maps link** (do NOT select text)
3. Verify context menu appears with "📍 Save Location" option
4. Click "Save Location"
5. Verify toast notification appears: "✓ Saved"
6. Wait 10-30 seconds for processing to complete
7. Open Chrome extension popup
8. Navigate to "My Locations" tab
9. Find the newly saved location

### Verification Checklist:
- [ ] Context menu appears when right-clicking on link
- [ ] "Save Location" option is visible and clickable
- [ ] Toast notification appears after clicking
- [ ] Location appears in extension UI within 30 seconds
- [ ] Location card shows correct name (matches Google Maps place name)
- [ ] Location card shows correct address
- [ ] Location card shows Google photos (if available)
- [ ] Location card shows rating (if available)
- [ ] Location card shows tips extracted from reviews
- [ ] Database verification: `link_url` field is populated with original URL
- [ ] Database verification: `place_id` field matches Google Maps Place ID
- [ ] Database verification: `processing_status` is 'complete'
- [ ] No errors in browser console
- [ ] No errors in Inngest dev server logs

### Expected Results:
- Location saved successfully with all enriched data
- `link_url` field contains the original Google Maps URL
- `place_id` matches the Place ID from the link
- Processing completes successfully

---

## Scenario 2: Text Only Save (Regression)

**Objective:** Verify existing text-only save functionality still works (no regression)

### Steps:
1. Navigate to a Reddit post or travel blog
2. **Select text** containing a location name (e.g., "Senso-ji Temple is amazing")
3. **Do NOT select any links**
4. Right-click on selected text
5. Click "Save Location"
6. Verify toast notification appears
7. Wait for processing to complete
8. Check extension UI for saved location

### Verification Checklist:
- [ ] Context menu appears when right-clicking on selected text
- [ ] Location saved successfully
- [ ] AI extraction works correctly (location name extracted from text)
- [ ] Location card shows correct name
- [ ] Location card shows correct address (from Google Places search)
- [ ] Database verification: `link_url` field is `null`
- [ ] Database verification: `place_id` is populated (from Google Places search)
- [ ] No errors in console
- [ ] Processing completes in expected time (< 30 seconds)

### Expected Results:
- Existing behavior unchanged
- Location created via AI text extraction
- No regressions introduced by link processing feature

---

## Scenario 3: Mixed Content (Link + Text)

**Objective:** Verify deduplication works when both link and text reference the same place

### Steps:
1. Navigate to a page with a paragraph containing both text and a Google Maps link
2. **Select the entire paragraph** (including the link)
3. Right-click → "Save Location"
4. Wait for processing to complete
5. Check extension UI

### Verification Checklist:
- [ ] Single location created (not duplicate)
- [ ] Location card shows data from link (higher confidence)
- [ ] Database verification: `link_url` field is populated
- [ ] Database verification: `place_id` matches link Place ID (not text search result)
- [ ] Deduplication works correctly (only one location in database)
- [ ] Link-sourced data prioritized over text-sourced data

### Expected Results:
- One location created (deduplicated)
- Link data used (Place ID from link, not from text search)
- Higher confidence data preserved

---

## Scenario 4: Multiple Links

**Objective:** Verify multiple locations created when text contains multiple different Google Maps links

### Steps:
1. Navigate to a page with multiple Google Maps links (3+ different places)
2. **Select text containing all links**
3. Right-click → "Save Location"
4. Wait for processing to complete
5. Check extension UI

### Verification Checklist:
- [ ] Multiple locations created (one per unique link)
- [ ] Each location has correct Place ID
- [ ] Each location has enriched data (name, address, photos, etc.)
- [ ] No duplicates created
- [ ] All locations appear in extension UI
- [ ] Database verification: Each location has unique `place_id`
- [ ] Database verification: Each location has `link_url` populated

### Expected Results:
- N locations created for N unique Google Maps links
- All locations have correct Place IDs
- All locations have enriched data

---

## Scenario 5: Shortened URLs

**Objective:** Verify URL expansion works for shortened Google Maps links

### Steps:
1. Find or create a shortened Google Maps link (goo.gl or maps.app.goo.gl)
2. Right-click directly on the shortened link
3. Click "Save Location"
4. Wait for processing to complete
5. Check Inngest dev server logs for expansion
6. Verify location in database

### Verification Checklist:
- [ ] URL expanded correctly (check Inngest logs)
- [ ] Place ID extracted from expanded URL
- [ ] Location created with correct data
- [ ] Database verification: `link_url` contains original shortened URL
- [ ] Database verification: `place_id` matches Place ID from expanded URL
- [ ] Inngest logs show "Expanded to: [full URL]"

### Expected Results:
- Shortened URL expanded to full Google Maps URL
- Place ID extracted successfully from expanded URL
- Location created with correct data

---

## Scenario 6: Malformed URLs

**Objective:** Verify graceful fallback when linkUrl is broken or invalid

### Steps:
1. Create test page with broken Google Maps URL (e.g., `maps.google.com/invalid`)
2. Select text containing the broken link
3. Right-click → "Save Location"
4. Wait for processing to complete
5. Check extension UI and logs

### Verification Checklist:
- [ ] No job failures (processing continues)
- [ ] Location created via text processing (AI extraction)
- [ ] Error logged but processing continues
- [ ] Database verification: `link_url` may be null or contain invalid URL
- [ ] Database verification: `place_id` populated from text search (not link)
- [ ] No crashes or unhandled errors

### Expected Results:
- Graceful fallback to text processing
- Location still created (via AI extraction)
- No job failures

---

## Scenario 7: No Screenshot

**Objective:** Verify processing continues when screenshot capture fails

### Steps:
1. Navigate to `chrome://extensions` page (screenshot will fail)
2. Select text containing a Google Maps link
3. Right-click → "Save Location"
4. Wait for processing to complete
5. Check extension UI and logs

### Verification Checklist:
- [ ] Screenshot capture fails gracefully (no errors)
- [ ] Processing continues without screenshot
- [ ] Location created (reduced accuracy acceptable)
- [ ] Database verification: Location exists
- [ ] Database verification: `place_id` populated (from link or text search)
- [ ] Global context extraction skipped (check Inngest logs)
- [ ] No errors in job execution

### Expected Results:
- Processing continues without screenshot
- Location created (may have reduced accuracy)
- No job failures

---

## Performance Verification

### Link Parsing Latency
- [ ] Measure time from event trigger to link results
- [ ] Verify <500ms target met
- [ ] Check Inngest step durations in dev server UI

### Total Job Duration
- [ ] Measure complete job execution time
- [ ] Verify <15s target met (no regression)
- [ ] Compare with baseline (text-only saves)

---

## Cost Verification

### OpenAI Token Usage
- [ ] Monitor token usage per save operation
- [ ] Compare link-only vs text-only vs mixed
- [ ] Verify slight reduction due to cleaned text

### Google Places API Calls
- [ ] Count API calls per save operation
- [ ] Verify 1-4 calls per link (fallback chain)
- [ ] Monitor API quota usage

---

## Common Issues & Troubleshooting

### Issue: Context menu doesn't appear on links
**Solution:** Verify extension has 'link' context in manifest.json

### Issue: Location not appearing in UI
**Solution:** Check Inngest dev server logs for job errors

### Issue: Job hangs or times out
**Solution:** Check OpenAI API key, Google Places API key, network connectivity

### Issue: Duplicate locations created
**Solution:** Verify reconciliation step (Step 4) is executing correctly

---

## Test Results Template

**Date:** _______________  
**Tester:** _______________  
**Environment:** _______________

| Scenario | Status | Notes | Screenshots |
|----------|--------|-------|-------------|
| 1. Link Only | ☐ Pass ☐ Fail | | |
| 2. Text Only | ☐ Pass ☐ Fail | | |
| 3. Mixed Content | ☐ Pass ☐ Fail | | |
| 4. Multiple Links | ☐ Pass ☐ Fail | | |
| 5. Shortened URLs | ☐ Pass ☐ Fail | | |
| 6. Malformed URLs | ☐ Pass ☐ Fail | | |
| 7. No Screenshot | ☐ Pass ☐ Fail | | |

**Overall Result:** ☐ Pass ☐ Fail  
**Issues Found:**  
**Recommendations:**

---

## Notes

- All tests should be performed in a clean test environment
- Test data should be reset between test runs
- Screenshots should be taken for failed tests
- Performance metrics should be recorded
- Cost metrics should be tracked

