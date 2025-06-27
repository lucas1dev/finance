const { beforeAll, afterAll } = require("@jest/globals");
const { sequelize } = require('../../models');
const request = require('supertest');
const app = require('../../app');

let isSetupComplete = false;
let setupPromise = null;
let globalTestCounter = 0;

/**
 * Setup global para testes de integração
 * Configura o banco de teste e limpa dados entre execuções
 */
async function globalSetup() {
  try {
    console.log('🔧 Configurando banco de teste...');
    
    // Desabilitar foreign key checks temporariamente
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    // Usar sequelize.sync() com force: true para recriar as tabelas
    // Isso evita o problema do limite de chaves no MySQL
    await sequelize.sync({ force: true });
    
    // Reabilitar foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log('✅ Banco de teste configurado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao configurar banco de teste:', error);
    if (error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    if (error && error.parent) {
      console.error('Erro do banco:', error.parent.sqlMessage || error.parent.message);
    }
    throw error;
  }
}

/**
 * Função para limpar dados de teste de forma segura
 * @param {Array} models - Array de modelos para limpar
 */
async function cleanTestData(models) {
  try {
    for (const model of models) {
      await model.destroy({ 
        where: {},
        force: true,
        truncate: { cascade: true }
      });
    }
  } catch (error) {
    console.warn('Aviso ao limpar dados de teste:', error.message);
  }
}

/**
 * Função para limpar todos os dados de teste de forma segura
 * Ordem de deleção: registros filhos primeiro, depois os pais
 */
async function cleanAllTestData() {
  try {
    const { 
      Payment, 
      FinancingPayment, 
      InvestmentContribution,
      Receivable, 
      Payable, 
      Transaction, 
      Investment, 
      InvestmentGoal,
      Financing,
      Creditor,
      Customer,
      CustomerType,
      Category,
      Account,
      FixedAccount,
      Supplier,
      User 
    } = require('../../models');
    
    // Limpar na ordem correta (filhos primeiro)
    await Payment.destroy({ where: {}, force: true });
    await FinancingPayment.destroy({ where: {}, force: true });
    await InvestmentContribution.destroy({ where: {}, force: true });
    await Receivable.destroy({ where: {}, force: true });
    await Payable.destroy({ where: {}, force: true });
    await Transaction.destroy({ where: {}, force: true });
    await Investment.destroy({ where: {}, force: true });
    await InvestmentGoal.destroy({ where: {}, force: true });
    await Financing.destroy({ where: {}, force: true });
    await FixedAccount.destroy({ where: {}, force: true });
    await Creditor.destroy({ where: {}, force: true });
    await CustomerType.destroy({ where: {}, force: true });
    await Customer.destroy({ where: {}, force: true });
    await Supplier.destroy({ where: {}, force: true });
    await Category.destroy({ where: {}, force: true });
    await Account.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    
    console.log('Dados de teste limpos com sucesso.');
  } catch (error) {
    console.warn('Aviso ao limpar dados de teste:', error.message);
  }
}

/**
 * Cria um usuário de teste via API e retorna o token de autenticação.
 * Usa um contador global para evitar conflitos de email entre suítes.
 * @param {Object} app - Instância do app Express.
 * @param {string} email - Email do usuário (opcional).
 * @param {string} name - Nome do usuário (opcional).
 * @returns {Promise<string>} Token JWT do usuário criado.
 */
async function createTestUser(app, email = null, name = 'Test User') {
  try {
    // Gerar email único para evitar conflitos entre suítes
    globalTestCounter++;
    const uniqueEmail = email || `test${globalTestCounter}@example.com`;
    
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: name,
        email: uniqueEmail,
        password: 'password123'
      });
    
    if (response.status === 201) {
      return response.body.token;
    } else if (response.status === 400 && response.body.error === 'Email já cadastrado') {
      // Se o email já existe, tentar fazer login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: uniqueEmail,
          password: 'password123'
        });
      
      if (loginResponse.status === 200) {
        return loginResponse.body.token;
      } else {
        throw new Error(`Erro ao fazer login: ${loginResponse.body.error}`);
      }
    } else {
      throw new Error(`Erro ao criar usuário de teste: ${response.body.error || response.status}`);
    }
  } catch (error) {
    console.error('Erro ao criar usuário de teste:', error);
    throw error;
  }
}

/**
 * Cria dados de teste básicos para uma suíte específica
 * @param {string} token - Token de autenticação
 * @param {Object} app - Instância do app Express
 * @returns {Promise<Object>} Dados criados
 */
async function createBasicTestData(token, app) {
  try {
    const testData = {};
    // Criar categoria
    const categoryResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Category',
        type: 'expense',
        color: '#FF0000'
      });
    if (categoryResponse.status === 201) {
      testData.category = categoryResponse.body.category;
    }
    // Criar conta
    const accountResponse = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Account',
        type: 'checking',
        balance: 1000.00
      });
    if (accountResponse.status === 201) {
      testData.account = accountResponse.body.account;
    }
    return testData;
  } catch (error) {
    console.error('Erro ao criar dados básicos de teste:', error);
    throw error;
  }
}

/**
 * Limpa todos os dados do banco de teste
 * Usado entre execuções de testes para garantir isolamento
 */
async function cleanTestDatabase() {
  try {
    console.log('🧹 Limpando banco de teste...');
    
    // Desabilitar foreign key checks temporariamente
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Obter todas as tabelas
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
    );
    
    // Limpar todas as tabelas
    for (const table of tables) {
      const tableName = table.table_name;
      if (tableName !== 'migrations' && tableName !== 'sequelizemeta') {
        await sequelize.query(`TRUNCATE TABLE \`${tableName}\``);
      }
    }
    
    // Reabilitar foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Banco de teste limpo com sucesso');
  } catch (error) {
    console.error('❌ Erro ao limpar banco de teste:', error);
    throw error;
  }
}

// Exports das funções utilitárias
module.exports = {
  createTestUser,
  createBasicTestData,
  cleanTestData,
  cleanAllTestData,
  globalSetup,
  cleanTestDatabase
};