const config = {
  rootDir: '.',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  // Transpile ESM packages used in UI components
  transformIgnorePatterns: [
    '/node_modules/(?!(?:@radix-ui|radix-ui|lucide-react|class-variance-authority)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Next.js specific shims if ever imported
    'next/image': '<rootDir>/src/test/shims/next-image.tsx',
  },
  testMatch: ['**/__tests__/**/*.(spec|test).(ts|tsx)'],
  collectCoverageFrom: ['src/**/*.(ts|tsx)'],
};

export default config;
