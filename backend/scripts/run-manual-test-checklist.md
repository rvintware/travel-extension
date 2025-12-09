# Manual Test Execution Guide

**Purpose:** Step-by-step guide for executing manual tests  
**Prerequisites:** See SETUP.md for environment setup

---

## Pre-Test Checklist

### Environment Setup
- [ ] Backend API running (`pnpm run dev` in `backend/`)
- [ ] Inngest dev server running (`npx inngest-cli dev`)
- [ ] Chrome extension loaded in dev mode
- [ ] Test user logged in
- [ ] Browser console open
- [ ] Inngest dev server UI open (http://localhost:8288)

### Test Data Preparation
- [ ] Reddit post with Google Maps link bookmarked
- [ ] Travel blog page with multiple links
- [ ] Shortened Google Maps link ready
- [ ] Text content without links ready

---

## Test Execution Steps

### 1. Start Test Session

1. Open browser console (F12)
2. Navigate to Inngest dev server UI: http://localhost:8288
3. Clear browser console
4. Note start time: _______________

### 2. Execute Test Scenarios

Follow the detailed steps in `__tests__/e2e/MANUAL_TEST_CHECKLIST.md` for each scenario:

- [ ] Scenario 1: Link Only Save
- [ ] Scenario 2: Text Only Save (Regression)
- [ ] Scenario 3: Mixed Content
- [ ] Scenario 4: Multiple Links
- [ ] Scenario 5: Shortened URLs
- [ ] Scenario 6: Malformed URLs
- [ ] Scenario 7: No Screenshot

### 3. Record Results

For each scenario, record:

**Scenario X: [Name]**
- Status: ☐ Pass ☐ Fail
- Duration: _____ seconds
- Notes: 
  - 
  - 
- Screenshots: [attach if failed]
- Inngest Logs: [copy relevant logs]

### 4. Performance Metrics

Record performance metrics:

- Link parsing latency: _____ ms
- URL expansion latency: _____ ms
- Total job duration: _____ seconds
- Step durations:
  - Step 0 (parse-links): _____ ms
  - Step 0.5 (process-map-links): _____ ms
  - Step 1 (global-context): _____ ms
  - Step 2 (count-locations): _____ ms
  - Step 3 (extract): _____ ms
  - Step 4 (reconcile): _____ ms
  - Step 5 (enrich): _____ ms
  - Step 6 (cleanup): _____ ms

### 5. Cost Metrics

Record cost metrics (if available):

- OpenAI tokens used: _____
- Google Places API calls: _____
- Estimated cost: $_____

---

## Results Recording Template

Copy this template for each test run:

```markdown
## Test Run: [Date] [Time]

**Tester:** _______________
**Environment:** Development / Staging / Production
**Browser:** Chrome [version]

### Scenario Results

| # | Scenario | Status | Duration | Notes |
|---|----------|--------|----------|-------|
| 1 | Link Only | ☐ | ___s | |
| 2 | Text Only | ☐ | ___s | |
| 3 | Mixed Content | ☐ | ___s | |
| 4 | Multiple Links | ☐ | ___s | |
| 5 | Shortened URLs | ☐ | ___s | |
| 6 | Malformed URLs | ☐ | ___s | |
| 7 | No Screenshot | ☐ | ___s | |

### Performance Metrics

- Link parsing: ___ ms (target: <500ms)
- URL expansion: ___ ms (target: <2000ms)
- Total job duration: ___ s (target: <15s)

### Cost Metrics

- OpenAI tokens: ___
- Google API calls: ___
- Estimated cost: $___

### Issues Found

1. 
2. 
3. 

### Recommendations

1. 
2. 
3. 
```

---

## Post-Test Actions

1. [ ] Copy results to `__tests__/e2e/RESULTS.md`
2. [ ] Attach screenshots for failed tests
3. [ ] Document any bugs found
4. [ ] Update test checklist with findings
5. [ ] Clean up test data from database

---

## Troubleshooting

### Issue: Tests failing unexpectedly
**Check:**
- Inngest dev server is running
- Backend API is accessible
- Database connection is working
- API keys are configured

### Issue: Performance metrics not meeting targets
**Check:**
- Network latency
- API response times
- Database query performance
- Inngest step durations

### Issue: Cost metrics unavailable
**Note:** Cost tracking requires API call interception or log parsing.
Use cost analysis tests for automated cost estimation.

---

## Notes

- Take screenshots for all failed tests
- Copy relevant Inngest logs for debugging
- Record exact error messages
- Note any unexpected behavior
- Document workarounds found

