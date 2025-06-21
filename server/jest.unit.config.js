/**
 * Configuração Jest para testes unitários.
 * Não inclui setup global de banco de dados, apenas mocks.
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/services/**/*.test.js',
    '**/__tests__/utils/**/*.test.js',
    '**/__tests__/middlewares/**/*.test.js',
    '**/__tests__/controllers/**/*.test.js'
  ],
  collectCoverageFrom: [
    'services/**/*.js',
    'utils/**/*.js',
    'middlewares/**/*.js',
    'controllers/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage/unit',
  testTimeout: 10000,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  // Sem setup global para testes unitários
  setupFilesAfterEnv: [],
  globalSetup: undefined,
  globalTeardown: undefined,
  setupFiles: [],
  // Configurações específicas para testes unitários
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  // Ignorar arquivos de integração
  testPathIgnorePatterns: [
    '/node_modules/',
    '/integration/',
    '/coverage/'
  ]
}; 