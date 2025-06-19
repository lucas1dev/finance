module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/integration/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/integration/setup.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000
}; 