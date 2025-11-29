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
  // Performance tests: benchmarks, run sparingly
  testMatch: [
    '**/__tests__/unit/**/*.test.ts',
    '**/__tests__/integration/**/*.integration.test.ts',
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
  
  // Test timeout (30 seconds for integration tests with network calls)
  testTimeout: 30000,
  
  // Setup files (runs before tests)
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Optional: for global test setup
};

module.exports = config;

