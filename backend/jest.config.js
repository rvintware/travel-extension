/** @type {import('jest').Config} */
const config = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Node environment (not browser/DOM)
  testEnvironment: 'node',
  
  // Root directory for tests
  roots: ['<rootDir>'],
  
  // Test file patterns
  // Unit tests: fast, mocked, always run
  // Integration tests: real APIs, slower, optional
  // E2E tests: full job execution, requires dev server
  // Performance tests: benchmarks, run sparingly
  testMatch: [
    '**/__tests__/unit/**/*.test.ts',
    '**/__tests__/integration/**/*.integration.test.ts',
    '**/__tests__/e2e/**/*.e2e.test.ts',
    '**/__tests__/performance/**/*.benchmark.test.ts',
    '**/__tests__/**/*.test.ts' // Fallback for root level tests
  ],
  
  // Module name mapper for path aliases (@/*)
  // This matches the tsconfig.json paths configuration
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Transform TypeScript files
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json', // Use dedicated Jest config
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
    '!**/__tests__/**', // Exclude all tests from coverage
  ],
  
  // Test timeout
  // - Unit tests: 5 seconds (default)
  // - Integration tests: 30 seconds
  // - E2E tests: 60 seconds (require Inngest dev server)
  testTimeout: 60000, // Increased for E2E tests
  
  // Setup files (runs before tests)
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Optional: for global test setup
};

module.exports = config;

