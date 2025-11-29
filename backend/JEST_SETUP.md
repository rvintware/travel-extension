# Jest Testing Setup Guide

**Project:** Travel Companion Backend  
**Framework:** Next.js 15.5.4 with TypeScript  
**Package Manager:** pnpm  
**Date:** November 23, 2025

---

## Overview

This guide provides step-by-step instructions for setting up Jest testing framework in the Travel Companion backend project. Jest will be configured to work with TypeScript, Next.js path aliases (`@/*`), and existing test patterns.

---

## Prerequisites

- Node.js installed (v20+)
- pnpm installed
- Backend project dependencies installed (`pnpm install`)

---

## Step 1: Install Jest Dependencies

Install Jest and TypeScript support packages:

```bash
cd backend
pnpm add -D jest @jest/globals ts-jest @types/jest
```

**Packages Explained:**
- `jest` - Core testing framework
- `@jest/globals` - TypeScript-friendly Jest globals (already used in tests)
- `ts-jest` - TypeScript preprocessor for Jest
- `@types/jest` - TypeScript type definitions for Jest

---

## Step 2: Create Jest Configuration File

Create `backend/jest.config.js` in the root of the backend directory:

```javascript
/** @type {import('jest').Config} */
const config = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Node environment (not browser/DOM)
  testEnvironment: 'node',
  
  // Root directory for tests
  roots: ['<rootDir>'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx'
  ],
  
  // Module name mapper for path aliases (@/*)
  // This matches the tsconfig.json paths configuration
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Transform TypeScript files
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Match your tsconfig.json settings
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'commonjs', // Jest requires CommonJS
        target: 'ES2017',
        strict: true,
        skipLibCheck: true,
      }
    }],
  },
  
  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/build/',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Coverage configuration (optional)
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  
  // Setup files (runs before tests)
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Optional: for global test setup
};

module.exports = config;
```

**Key Configuration Points:**
- `preset: 'ts-jest'` - Enables TypeScript support
- `moduleNameMapper` - Maps `@/*` imports to `<rootDir>/*` (matches your tsconfig.json)
- `testEnvironment: 'node'` - Backend tests don't need DOM
- `testMatch` - Finds test files in `__tests__` directories

---

## Step 3: Update package.json Scripts

Add test scripts to `backend/package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:links": "jest __tests__/links",
    "test:places": "jest __tests__/places"
  }
}
```

**Scripts Explained:**
- `test` - Run all tests once
- `test:watch` - Run tests in watch mode (re-runs on file changes)
- `test:coverage` - Generate coverage report
- `test:links` - Run only link parser tests
- `test:places` - Run only places search tests

---

## Step 4: Create TypeScript Config for Jest (Optional but Recommended)

Create `backend/tsconfig.jest.json` to ensure Jest uses correct TypeScript settings:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  "include": [
    "**/*.test.ts",
    "**/*.test.tsx",
    "__tests__/**/*"
  ]
}
```

Then update `jest.config.js` to use this config:

```javascript
transform: {
  '^.+\\.tsx?$': ['ts-jest', {
    tsconfig: 'tsconfig.jest.json', // Use dedicated Jest config
  }],
},
```

---

## Step 5: Handle Module Mocks

For tests that mock external modules (like axios), create mock files if needed.

### Example: Mock axios for URL Expander Tests

The existing `url-expander.test.ts` already mocks axios correctly:

```typescript
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>
```

This works automatically with Jest - no additional setup needed.

---

## Step 6: Run Tests

### Run All Tests
```bash
cd backend
pnpm test
```

### Run Specific Test File
```bash
pnpm test __tests__/links/parser.test.ts
```

### Run Tests in Watch Mode
```bash
pnpm test:watch
```

### Run Tests with Coverage
```bash
pnpm test:coverage
```

### Run Tests for Specific Module
```bash
pnpm test:links    # Run link parser tests
pnpm test:places   # Run places search tests
```

---

## Step 7: Verify Setup

Run the existing tests to verify everything works:

```bash
# Test 1: Parser tests
pnpm test __tests__/links/parser.test.ts

# Test 2: URL Expander tests
pnpm test __tests__/links/url-expander.test.ts

# Test 3: Places search tests
pnpm test __tests__/places/search-extended.test.ts

# Test 4: Existing validation tests
pnpm test __tests__/date-validation.test.ts
```

**Expected Output:**
```
PASS  __tests__/links/parser.test.ts
PASS  __tests__/links/url-expander.test.ts
PASS  __tests__/places/search-extended.test.ts
PASS  __tests__/date-validation.test.ts

Test Suites: 4 passed, 4 total
Tests:       XX passed, XX total
```

---

## Project-Specific Configuration Details

### Path Aliases (`@/*`)

Your project uses `@/*` path aliases defined in `tsconfig.json`:
```json
"paths": {
  "@/*": ["./*"]
}
```

Jest's `moduleNameMapper` maps these correctly:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

This allows imports like:
```typescript
import { extractLinksFromText } from '@/lib/links'
```

### Test File Structure

Tests are organized in `__tests__` directories:
```
backend/
├── __tests__/
│   ├── date-validation.test.ts
│   ├── links/
│   │   ├── parser.test.ts
│   │   └── url-expander.test.ts
│   └── places/
│       └── search-extended.test.ts
```

Jest automatically finds these with the `testMatch` pattern.

### Existing Test Patterns

Your tests use `@jest/globals` imports:
```typescript
import { describe, it, expect } from '@jest/globals'
```

This is already compatible with the Jest setup - no changes needed.

---

## Troubleshooting

### Issue: "Cannot use import statement outside a module"

**Solution:** Ensure `jest.config.js` has `preset: 'ts-jest'` and proper `transform` configuration.

### Issue: "Module not found: Can't resolve '@/lib/links'"

**Solution:** Verify `moduleNameMapper` in `jest.config.js` matches your `tsconfig.json` paths:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### Issue: "SyntaxError: Unexpected token"

**Solution:** Ensure `ts-jest` is installed and `preset: 'ts-jest'` is set in config.

### Issue: Tests pass but TypeScript errors in IDE

**Solution:** Create `tsconfig.jest.json` as described in Step 4, or ensure your IDE recognizes Jest types.

### Issue: Mocked modules not working

**Solution:** Ensure mocks are placed before imports:
```typescript
jest.mock('axios')  // Must be before import
import axios from 'axios'
```

### Issue: Environment variables not available in tests

**Solution:** Create `jest.setup.js`:
```javascript
// jest.setup.js
process.env.GOOGLE_PLACES_API_KEY = 'test-key'
process.env.OPENAI_API_KEY = 'test-key'
```

Then add to `jest.config.js`:
```javascript
setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
```

---

## Testing Best Practices for This Project

### 1. Test File Naming
- Use `.test.ts` extension
- Place in `__tests__` directories
- Match source file structure

### 2. Mock External Dependencies
- Mock axios for network calls
- Mock Google Places API client
- Mock Supabase client (if testing database operations)

### 3. Use Descriptive Test Names
```typescript
it('should extract Place ID with high confidence', () => {
  // test code
})
```

### 4. Group Related Tests
```typescript
describe('parseGoogleMapsUrl', () => {
  describe('Place ID extraction', () => {
    // tests
  })
  describe('Coordinate extraction', () => {
    // tests
  })
})
```

### 5. Test Edge Cases
- Empty strings
- Invalid URLs
- Missing API keys
- Network errors
- Timeout scenarios

---

## Integration with CI/CD

### GitHub Actions Example

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: cd backend && pnpm install
      - run: cd backend && pnpm test
```

---

## Next Steps

After setup is complete:

1. ✅ Run all existing tests to verify setup
2. ✅ Add new tests as you develop features
3. ✅ Set up coverage reporting (optional)
4. ✅ Integrate with CI/CD pipeline
5. ✅ Add pre-commit hooks to run tests (optional)

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Jest with TypeScript Guide](https://jestjs.io/docs/getting-started#using-typescript)

---

## Summary

**Files Created:**
1. `backend/jest.config.js` - Jest configuration
2. `backend/tsconfig.jest.json` - TypeScript config for Jest (optional)

**Files Modified:**
1. `backend/package.json` - Added test scripts

**Dependencies Added:**
- `jest`
- `@jest/globals`
- `ts-jest`
- `@types/jest`

**Commands to Run:**
```bash
cd backend
pnpm add -D jest @jest/globals ts-jest @types/jest
pnpm test
```

---

**Status:** Ready for implementation  
**Last Updated:** November 23, 2025

