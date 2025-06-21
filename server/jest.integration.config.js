module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/integration/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/integration/setup.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
  // Configurações para execução em conjunto
  maxWorkers: 1, // Executar testes sequencialmente para evitar conflitos
  bail: false, // Não parar na primeira falha
  detectOpenHandles: true, // Detectar handles abertos
  // Configurações de cache
  cache: false,
  // Configurações de relatório
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
}; 