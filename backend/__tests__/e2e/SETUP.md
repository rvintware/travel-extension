# E2E Test Environment Setup Guide

**Purpose:** Guide for setting up the E2E test environment  
**Last Updated:** Phase 6 Implementation

---

## Prerequisites

### Required Software

- **Node.js:** v18+ (check with `node --version`)
- **pnpm:** Latest version (check with `pnpm --version`)
- **Chrome Browser:** Latest version
- **Inngest CLI:** `npx inngest-cli` (installed via npx)

### Required Services

- **Supabase Database:** Accessible and configured
- **Google Places API:** API key with quota available
- **OpenAI API:** API key (optional for cost analysis, will be mocked in tests)

---

## Step 1: Install Dependencies

```bash
cd backend
pnpm install
```

**Verify:** No errors during installation

---

## Step 2: Configure Environment Variables

Create or update `.env.local` in the `backend/` directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Places API (required for E2E tests)
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# OpenAI API (optional - will be mocked in tests)
OPENAI_API_KEY=your_openai_api_key

# Inngest (optional - for production)
INNGEST_EVENT_KEY=your_inngest_event_key
```

**Verify:** All required variables are set:
```bash
echo $GOOGLE_PLACES_API_KEY  # Should output your key
```

---

## Step 3: Start Backend API

```bash
cd backend
pnpm run dev
```

**Verify:** API is running:
- Open http://localhost:3000/api/health
- Should return: `{"status":"ok","database":"connected"}`

**Keep this terminal running** - API must be running for tests

---

## Step 4: Start Inngest Dev Server

In a **new terminal**:

```bash
cd backend
npx inngest-cli dev
```

**Verify:** Inngest dev server is running:
- Open http://localhost:8288
- Should see Inngest dev server UI
- Should show registered functions (including `process-location`)

**Keep this terminal running** - Inngest dev server must be running for E2E tests

---

## Step 5: Verify Database Connection

```bash
cd backend
# Run a simple test query (if you have a test script)
# Or verify via Supabase dashboard
```

**Verify:**
- Database is accessible
- `locations` table exists
- `link_url` column exists (from Phase 1 migration)

---

## Step 6: Setup Chrome Extension (for Manual Tests)

### Build Extension

```bash
cd extension
pnpm install
pnpm run dev
```

**Verify:** Build completes successfully
- Check `extension/build/chrome-mv3-dev/` directory exists

### Load Extension in Chrome

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select `extension/build/chrome-mv3-dev` directory
5. Pin extension to toolbar

**Verify:**
- Extension icon appears in toolbar
- No errors in extension details page
- Extension popup opens when clicked

### Configure Extension

1. Click extension icon
2. Click Settings (⚙️)
3. Set Default Country (e.g., Japan)
4. Click "Save Settings"
5. Verify settings are saved

---

## Step 7: Verify Test Environment

### Run Unit Tests (Quick Verification)

```bash
cd backend
pnpm test:unit
```

**Expected:** All unit tests pass

### Run Integration Tests (Optional)

```bash
cd backend
GOOGLE_PLACES_API_KEY=your_key pnpm test:integration
```

**Expected:** Integration tests pass (may skip if API key not set)

### Check E2E Test Files

```bash
cd backend
ls __tests__/e2e/
```

**Expected:** See:
- `test-data.ts`
- `helpers.ts`
- `process-location.e2e.test.ts`
- `cost-analysis.test.ts`
- `MANUAL_TEST_CHECKLIST.md`
- `SETUP.md`
- `RESULTS.md`

---

## Step 8: Run E2E Tests

### Automated E2E Tests

```bash
cd backend
pnpm test:e2e
```

**Note:** These tests require:
- Inngest dev server running
- Supabase database accessible
- Google Places API key configured

### Performance Benchmarks

```bash
cd backend
pnpm test:performance
```

**Note:** These tests make real API calls and consume quota

### Cost Analysis

```bash
cd backend
pnpm test -- __tests__/e2e/cost-analysis.test.ts
```

**Note:** These tests use mocked APIs (no actual charges)

---

## Troubleshooting

### Issue: Inngest dev server not starting

**Symptoms:**
- `npx inngest-cli dev` fails
- Port 8288 already in use

**Solutions:**
1. Check if another instance is running: `lsof -i :8288`
2. Kill existing process: `kill -9 <PID>`
3. Try different port: `npx inngest-cli dev --port 8289`

### Issue: E2E tests failing with "Inngest send failed"

**Symptoms:**
- Tests fail immediately
- Error: "Inngest dev server may not be running"

**Solutions:**
1. Verify Inngest dev server is running: http://localhost:8288
2. Check backend API is running: http://localhost:3000/api/health
3. Verify environment variables are set correctly

### Issue: Database connection errors

**Symptoms:**
- Tests fail with Supabase errors
- "Could not find column" errors

**Solutions:**
1. Verify Supabase URL and keys in `.env.local`
2. Check database migration ran successfully
3. Verify `link_url` column exists: Run SQL query in Supabase dashboard

### Issue: Google Places API errors

**Symptoms:**
- Tests fail with "API key not set"
- Tests fail with "Quota exceeded"

**Solutions:**
1. Verify `GOOGLE_PLACES_API_KEY` is set
2. Check API key is valid and has quota
3. Verify API key has Places API enabled

### Issue: Extension not loading

**Symptoms:**
- Extension doesn't appear in Chrome
- Errors in extension details page

**Solutions:**
1. Verify extension built successfully
2. Check for errors in Chrome extension console
3. Reload extension: Click refresh icon in `chrome://extensions/`
4. Check manifest.json is valid

### Issue: Tests timing out

**Symptoms:**
- Tests hang indefinitely
- Timeout errors after 60 seconds

**Solutions:**
1. Check Inngest dev server logs for errors
2. Verify job is executing in Inngest UI
3. Check database for stuck jobs (`processing_status = 'processing'`)
4. Increase timeout in `jest.config.js` if needed

---

## Environment Verification Checklist

Before running E2E tests, verify:

- [ ] Backend API running on http://localhost:3000
- [ ] Inngest dev server running on http://localhost:8288
- [ ] Supabase database accessible
- [ ] `GOOGLE_PLACES_API_KEY` environment variable set
- [ ] Chrome extension loaded and configured
- [ ] Test user account created
- [ ] Database migration applied (`link_url` column exists)
- [ ] Unit tests pass (`pnpm test:unit`)
- [ ] No port conflicts (3000, 8288)

---

## Quick Start Commands

### Start All Services

```bash
# Terminal 1: Backend API
cd backend && pnpm run dev

# Terminal 2: Inngest Dev Server
cd backend && npx inngest-cli dev

# Terminal 3: Run Tests
cd backend && pnpm test:e2e
```

### Run All Tests

```bash
cd backend
pnpm test:all
```

### Run Specific Test Suite

```bash
# E2E tests only
pnpm test:e2e

# Performance benchmarks only
pnpm test:performance

# Cost analysis only
pnpm test -- __tests__/e2e/cost-analysis.test.ts
```

---

## Next Steps

After setup is complete:

1. Review `MANUAL_TEST_CHECKLIST.md` for manual testing steps
2. Run automated E2E tests: `pnpm test:e2e`
3. Execute manual test scenarios
4. Record results in `RESULTS.md`
5. Address any issues found

---

## Additional Resources

- **Architecture Document:** `artifacts/features/processing-logic/save-by-link/Link-First Processing Architecture.md`
- **Integration Tests README:** `__tests__/integration/README.md`
- **Jest Setup Guide:** `JEST_SETUP.md`
- **Inngest Documentation:** https://www.inngest.com/docs

---

## Support

If you encounter issues not covered here:

1. Check Inngest dev server logs
2. Check backend API logs
3. Check browser console (for extension issues)
4. Review test output for specific error messages
5. Verify all prerequisites are met

