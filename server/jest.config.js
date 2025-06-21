module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'middlewares/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupTestEnv.js'],
  testTimeout: 30000,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  // Ignorar setup global para testes unitários
  globalSetup: undefined,
  globalTeardown: undefined,
  // Ignorar setup para arquivos unitários e de services
  setupFiles: process.env.JEST_UNIT ? [] : ['<rootDir>/__tests__/integration/setup.js'],
}; 