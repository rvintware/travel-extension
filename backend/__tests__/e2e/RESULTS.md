# E2E Test Results

**Purpose:** Document all E2E test execution results  
**Last Updated:** [Date]

---

## Test Execution Summary

| Date | Environment | Test Runner | Total Tests | Passed | Failed | Notes |
|------|-------------|-------------|-------------|--------|--------|-------|
| [Date] | Development | Jest | 7 | - | - | Initial run |

---

## Scenario Results

### Scenario 1: Link Only Save

**Status:** ☐ Pass ☐ Fail ☐ Not Run  
**Date:** _______________  
**Tester:** _______________

**Results:**
- Context menu appears: ☐ Yes ☐ No
- Location saved: ☐ Yes ☐ No
- Place ID correct: ☐ Yes ☐ No
- Link URL stored: ☐ Yes ☐ No

**Notes:**
- 
- 

**Screenshots:** [attach if failed]

---

### Scenario 2: Text Only Save (Regression)

**Status:** ☐ Pass ☐ Fail ☐ Not Run  
**Date:** _______________  
**Tester:** _______________

**Results:**
- Location saved: ☐ Yes ☐ No
- AI extraction works: ☐ Yes ☐ No
- No regressions: ☐ Yes ☐ No

**Notes:**
- 
- 

---

### Scenario 3: Mixed Content (Link + Text)

**Status:** ☐ Pass ☐ Fail ☐ Not Run  
**Date:** _______________  
**Tester:** _______________

**Results:**
- Single location created: ☐ Yes ☐ No
- Link data prioritized: ☐ Yes ☐ No
- Deduplication works: ☐ Yes ☐ No

**Notes:**
- 
- 

---

### Scenario 4: Multiple Links

**Status:** ☐ Pass ☐ Fail ☐ Not Run  
**Date:** _______________  
**Tester:** _______________

**Results:**
- Multiple locations created: ☐ Yes ☐ No
- Correct Place IDs: ☐ Yes ☐ No
- All enriched: ☐ Yes ☐ No

**Notes:**
- 
- 

---

### Scenario 5: Shortened URLs

**Status:** ☐ Pass ☐ Fail ☐ Not Run  
**Date:** _______________  
**Tester:** _______________

**Results:**
- URL expanded: ☐ Yes ☐ No
- Place ID extracted: ☐ Yes ☐ No
- Location created: ☐ Yes ☐ No

**Notes:**
- 
- 

---

### Scenario 6: Malformed URLs

**Status:** ☐ Pass ☐ Fail ☐ Not Run  
**Date:** _______________  
**Tester:** _______________

**Results:**
- Graceful fallback: ☐ Yes ☐ No
- Location created: ☐ Yes ☐ No
- No job failures: ☐ Yes ☐ No

**Notes:**
- 
- 

---

### Scenario 7: No Screenshot

**Status:** ☐ Pass ☐ Fail ☐ Not Run  
**Date:** _______________  
**Tester:** _______________

**Results:**
- Processing continues: ☐ Yes ☐ No
- Location created: ☐ Yes ☐ No
- No errors: ☐ Yes ☐ No

**Notes:**
- 
- 

---

## Performance Benchmarks

### Link Parsing Latency

| Test | Target | Actual | Status | Notes |
|------|--------|--------|--------|-------|
| Single link | <500ms | ___ ms | ☐ | |
| Multiple links | <500ms | ___ ms | ☐ | |
| Average (10 runs) | <500ms | ___ ms | ☐ | |

**Statistics:**
- Mean: ___ ms
- Median: ___ ms
- P95: ___ ms
- P99: ___ ms
- Min: ___ ms
- Max: ___ ms

### URL Expansion Latency

| Test | Target | Actual | Status | Notes |
|------|--------|--------|--------|-------|
| Single URL | <2000ms | ___ ms | ☐ | |
| Average (3 runs) | <2000ms | ___ ms | ☐ | |

### Total Job Duration

| Scenario | Target | Actual | Status | Notes |
|----------|--------|--------|--------|-------|
| Link only | <15s | ___ s | ☐ | |
| Text only | <15s | ___ s | ☐ | |
| Mixed | <15s | ___ s | ☐ | |

### Step-by-Step Durations

| Step | Duration | Notes |
|------|----------|-------|
| Step 0: parse-links | ___ ms | |
| Step 0.5: process-map-links | ___ ms | |
| Step 1: extract-global-context | ___ ms | |
| Step 2: count-locations | ___ ms | |
| Step 3: extract-variations/extract-multiple | ___ ms | |
| Step 4: reconcile-links-and-text | ___ ms | |
| Step 5: enrich-and-persist | ___ ms | |
| Step 6: cleanup-placeholder | ___ ms | |

---

## Cost Analysis

### OpenAI Token Usage

| Scenario | Input Tokens | Output Tokens | Total Tokens | Cost |
|----------|--------------|---------------|--------------|------|
| Link only | ___ | ___ | ___ | $___ |
| Text only | ___ | ___ | ___ | $___ |
| Mixed | ___ | ___ | ___ | $___ |

**Comparison:**
- Text cleaning reduces tokens by: ___ tokens (___%)
- Cost savings per request: $___

### Google Places API Calls

| Scenario | Place ID Lookups | Coordinate Searches | Text Searches | Total Calls | Cost |
|----------|------------------|-------------------|---------------|-------------|------|
| Link only | ___ | ___ | ___ | ___ | $___ |
| Text only | ___ | ___ | ___ | ___ | $___ |
| Mixed | ___ | ___ | ___ | ___ | $___ |

**Fallback Chain Analysis:**
- Best case (Place ID): ___ calls, $___
- Medium case (Coordinates): ___ calls, $___
- Worst case (Query): ___ calls, $___

### Cost Per Scenario

| Scenario | OpenAI Cost | Google Cost | Total Cost | vs Baseline |
|----------|-------------|-------------|------------|-------------|
| Link only | $___ | $___ | $___ | -$___ |
| Text only (baseline) | $___ | $___ | $___ | $0 |
| Mixed | $___ | $___ | $___ | -$___ |

**Summary:**
- Link-only saves: $___ vs text-only
- Mixed content saves: $___ vs text-only
- Overall cost impact: ☐ Increase ☐ Decrease ☐ Neutral

---

## Issues Found

### Bugs

1. **Issue:** [Description]
   - **Severity:** Critical / High / Medium / Low
   - **Steps to Reproduce:**
   - **Expected:** 
   - **Actual:**
   - **Status:** ☐ Open ☐ Fixed ☐ Won't Fix

2. **Issue:** [Description]
   - **Severity:** Critical / High / Medium / Low
   - **Steps to Reproduce:**
   - **Expected:**
   - **Actual:**
   - **Status:** ☐ Open ☐ Fixed ☐ Won't Fix

### Performance Issues

1. **Issue:** [Description]
   - **Impact:**
   - **Recommendation:**
   - **Status:** ☐ Open ☐ Fixed ☐ Won't Fix

### Cost Concerns

1. **Issue:** [Description]
   - **Impact:**
   - **Recommendation:**
   - **Status:** ☐ Open ☐ Fixed ☐ Won't Fix

---

## Recommendations

### Optimizations Needed

1. 
2. 
3. 

### Documentation Updates

1. 
2. 
3. 

### Future Improvements

1. 
2. 
3. 

---

## Test Environment Details

**Date:** _______________  
**Environment:** Development / Staging / Production  
**Backend Version:** _______________  
**Extension Version:** _______________  
**Node Version:** _______________  
**Chrome Version:** _______________  

**API Keys:**
- OpenAI: ☐ Configured ☐ Not Configured
- Google Places: ☐ Configured ☐ Not Configured

**Infrastructure:**
- Inngest Dev Server: ☐ Running ☐ Not Running
- Supabase: ☐ Connected ☐ Not Connected
- Backend API: ☐ Running ☐ Not Running

---

## Appendix

### Test Data Used

- Test URLs: See `test-data.ts`
- Test Text Samples: See `test-data.ts`
- Test User IDs: See `test-data.ts`

### Logs and Screenshots

- Inngest Logs: [attach or link]
- Browser Console Logs: [attach or link]
- Screenshots: [attach or link]

### Related Documentation

- Manual Test Checklist: `MANUAL_TEST_CHECKLIST.md`
- Setup Guide: `SETUP.md`
- Architecture Document: `artifacts/features/processing-logic/save-by-link/Link-First Processing Architecture.md`

