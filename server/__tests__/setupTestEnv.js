const { globalSetup, cleanTestDatabase } = require('./integration/setup');

beforeAll(async () => {
  await globalSetup();
}, 30000);

beforeEach(async () => {
  // Limpar banco antes de cada teste para garantir isolamento
  // COMENTADO: Causava problemas com dados criados no beforeAll
  // // await cleanTestDatabase(); // COMENTADO: Causava problemas com dados criados no beforeAll
}, 10000);

afterAll(async () => {
  try {
    const { sequelize } = require('../models');
    if (sequelize && typeof sequelize.close === 'function') {
      await sequelize.close();
    }
  } catch (error) {
    console.warn('Erro ao fechar conexão do sequelize:', error.message);
  }
}); 