# Integration Tests

**Location:** `backend/__tests__/integration/`  
**Purpose:** Verify modules work with real APIs, network calls, and external services  
**Status:** Optional - Run when you want to verify real-world behavior

---

## Overview

Integration tests complement unit tests by verifying that our modules work correctly with:
- **Real Google Maps URLs** (various formats)
- **Real network requests** (URL expansion)
- **Real Google Places API** (Place ID and coordinate lookups)

Unlike unit tests which use mocks, integration tests make actual API calls and network requests.

---

## Test Organization

```
__tests__/
├── unit/                    # Unit tests (mocked, fast, always run)
│   ├── links/
│   └── places/
│
└── integration/             # Integration tests (real APIs, optional)
    ├── helpers.ts          # Shared utilities
    ├── test-data.ts        # Real test data (URLs, Place IDs)
    ├── links/
    │   ├── parser.integration.test.ts
    │   └── url-expander.integration.test.ts
    └── places/
        └── search.integration.test.ts
```

---

## Prerequisites

### For All Integration Tests
- Network access (for URL expansion tests)

### For Google Places Tests
- `GOOGLE_PLACES_API_KEY` environment variable
- Valid Google Places API key with quota available

### Setting Up API Key

**Option 1: Environment Variable**
```bash
export GOOGLE_PLACES_API_KEY=your_api_key_here
pnpm test:integration
```

**Option 2: .env File**
```bash
# backend/.env.local (not committed to git)
GOOGLE_PLACES_API_KEY=your_api_key_here
```

**Option 3: Inline**
```bash
GOOGLE_PLACES_API_KEY=your_key pnpm test:integration
```

---

## Running Tests

### Run All Tests (Unit + Integration)
```bash
cd backend
pnpm test
```

### Run Only Unit Tests (Fast, No API Keys Needed)
```bash
pnpm test:unit
```

### Run Only Integration Tests (Requires API Keys/Network)
```bash
pnpm test:integration
```

### Run Specific Integration Test File
```bash
pnpm test __tests__/integration/links/parser.integration.test.ts
pnpm test __tests__/integration/places/search.integration.test.ts
```

### Run in Watch Mode
```bash
pnpm test:watch
```

---

## Test Files

### 1. Link Parser Integration (`links/parser.integration.test.ts`)

**What it tests:**
- Real Google Maps URL extraction from text
- Parsing of various URL formats (Place ID, coordinates, place names)
- Text cleaning with real content

**Prerequisites:** None (no API keys needed)

**Example:**
```typescript
// Tests with real URLs like:
'https://maps.google.com/maps?place_id=ChIJH_imbZuAZUYREePCK0vvmvU'
```

---

### 2. URL Expander Integration (`links/url-expander.integration.test.ts`)

**What it tests:**
- Expansion of real shortened URLs (goo.gl, maps.app.goo.gl)
- Network redirect following
- Error handling with invalid URLs

**Prerequisites:** Network access

**Note:** Some tests may skip if placeholder URLs are used. Replace with real shortened URLs for full testing.

---

### 3. Google Places Integration (`places/search.integration.test.ts`)

**What it tests:**
- Real Place ID lookups via Google Places API
- Coordinate-based nearby search
- API response structure validation

**Prerequisites:** `GOOGLE_PLACES_API_KEY` environment variable

**Tests will automatically skip if API key is not set.**

---

## Test Data

Real test data is stored in `test-data.ts`:

- **REAL_GOOGLE_MAPS_URLS** - Actual Google Maps URLs in various formats
- **REAL_PLACE_IDS** - Verified Place IDs for testing
- **REAL_COORDINATES** - Known coordinates for testing
- **REAL_TEXT_WITH_LINKS** - Sample text content with embedded URLs

**Note:** Some URLs may become invalid over time. Update `test-data.ts` as needed.

---

## Helper Functions

Shared utilities in `helpers.ts`:

- `skipIfNoApiKey(keyName)` - Skip test if API key missing
- `skipIfNoNetwork()` - Skip test if network unavailable
- `getTestPlaceId()` - Get known valid Place ID
- `getTestCoordinates()` - Get known coordinates
- `retryWithBackoff()` - Retry with exponential backoff

---

## Test Behavior

### Automatic Skipping

Integration tests automatically skip if:
- API keys are not set (Google Places tests)
- Network is unavailable (URL expansion tests)
- Test data is missing (placeholder URLs)

**Skipped tests show warnings but don't fail the test suite.**

### Timeouts

Integration tests have a 30-second timeout to accommodate:
- Network latency
- API response times
- Redirect following

---

## CI/CD Integration

### Recommended Strategy

**Always Run:**
```bash
pnpm test:unit  # Fast, reliable, no external dependencies
```

**Optional (if API keys available):**
```bash
pnpm test:integration  # Verify real API behavior
```

### GitHub Actions Example

```yaml
- name: Run Unit Tests
  run: cd backend && pnpm test:unit

- name: Run Integration Tests (if API key available)
  if: env.GOOGLE_PLACES_API_KEY != ''
  run: cd backend && pnpm test:integration
  env:
    GOOGLE_PLACES_API_KEY: ${{ secrets.GOOGLE_PLACES_API_KEY }}
```

---

## Adding New Integration Tests

### Step 1: Create Test File

Create `__tests__/integration/[module]/[name].integration.test.ts`

### Step 2: Import Helpers

```typescript
import { skipIfNoApiKey, skipIfNoNetwork } from '../helpers'
import { REAL_GOOGLE_MAPS_URLS } from '../test-data'
```

### Step 3: Add Prerequisites Check

```typescript
beforeAll(() => {
  if (skipIfNoApiKey('GOOGLE_PLACES_API_KEY')) {
    console.warn('Skipping: API key not set')
  }
})
```

### Step 4: Write Tests

```typescript
it('should work with real data', async () => {
  if (skipIfNoApiKey('GOOGLE_PLACES_API_KEY')) return
  
  // Your test code here
}, 30000) // 30 second timeout
```

---

## Troubleshooting

### Issue: Tests skip even with API key set

**Solution:** Verify environment variable is set:
```bash
echo $GOOGLE_PLACES_API_KEY
```

### Issue: Network timeout errors

**Solution:** 
- Check internet connection
- Verify URLs in `test-data.ts` are still valid
- Increase timeout if needed

### Issue: API quota exceeded

**Solution:**
- Check Google Cloud Console for quota limits
- Use test Place IDs that don't consume quota (if available)
- Run integration tests less frequently

### Issue: Place ID not found

**Solution:**
- Verify Place ID is correct in `test-data.ts`
- Some Place IDs may become invalid over time
- Update with new valid Place IDs

---

## Best Practices

1. **Use Real Data:** Integration tests should use real URLs/Place IDs from `test-data.ts`
2. **Skip Gracefully:** Always check prerequisites and skip if not available
3. **Document Prerequisites:** Clearly state what's needed in test file header
4. **Handle Timeouts:** Use appropriate timeouts for network/API calls
5. **Update Test Data:** Keep `test-data.ts` updated with valid URLs/Place IDs

---

## Cost Considerations

**Google Places API:**
- Place Details: ~$0.017 per request
- Nearby Search: ~$0.032 per request
- Integration tests consume real API quota

**Recommendation:** Run integration tests:
- During development (to verify changes)
- Before releases (to catch real-world issues)
- Not on every commit (to save quota)

---

## Summary

Integration tests verify real-world behavior but are optional. Unit tests provide fast feedback during development, while integration tests confirm everything works with real APIs and services.

**Quick Reference:**
- `pnpm test:unit` - Run unit tests (always)
- `pnpm test:integration` - Run integration tests (optional)
- `pnpm test` - Run all tests

---

## Performance Benchmarks

Performance benchmarks are located in `__tests__/performance/` and measure:
- Latency for Place ID lookups (target: <500ms)
- Latency for coordinate lookups (target: <1000ms)
- API call overhead
- Memory usage

**To run performance benchmarks:**
```bash
GOOGLE_PLACES_API_KEY=your_key pnpm test:performance
```

**Note:** Performance benchmarks consume API quota and should be run sparingly.

---

**Last Updated:** November 23, 2025

