const { sequelize } = require('../../models');
const request = require('supertest');
const app = require('../../app');

let isSetupComplete = false;

beforeAll(async () => {
  if (isSetupComplete) return;
  
  try {
    // Cria o banco de dados de teste se não existir
    await sequelize.query('CREATE DATABASE IF NOT EXISTS finance_test');
    
    // Sincroniza o banco de dados de teste apenas uma vez
    await sequelize.sync({ force: true });
    
    isSetupComplete = true;
  } catch (error) {
    console.error('Erro ao sincronizar banco de dados:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Fecha a conexão do Sequelize
    await sequelize.close();
  } catch (error) {
    console.error('Erro ao fechar conexão:', error);
  }
});

/**
 * Cria um usuário de teste via API e retorna o token de autenticação.
 * @param {Object} app - Instância do app Express.
 * @returns {Promise<string>} Token JWT do usuário criado.
 */
async function createTestUser(app) {
  try {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    if (response.status === 201) {
      return response.body.token;
    } else if (response.status === 400 && response.body.error === 'Email já cadastrado') {
      // Se o usuário já existe, faz login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      return loginResponse.body.token;
    } else {
      throw new Error(`Erro ao criar usuário de teste: ${response.body.error}`);
    }
  } catch (error) {
    console.error('Erro ao criar usuário de teste:', error);
    throw error;
  }
}

module.exports = {
  createTestUser
}; 