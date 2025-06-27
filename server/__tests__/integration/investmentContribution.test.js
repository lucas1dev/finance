const request = require('supertest');
const app = require('../../app');
const { InvestmentContribution, Investment, User, Account } = require('../../models');
const { createTestUser, cleanAllTestData } = require('./setup');

describe('Investment Contribution Integration Tests', () => {
  let authToken;
  let testUser;
  let testInvestment;
  let testAccount;

  beforeAll(async () => {
    // Configurar dados básicos necessários para todos os testes
    await cleanAllTestData();
  });

  afterAll(async () => {
    // Limpar todos os dados de teste de forma segura
    await cleanAllTestData();
  });

  beforeEach(async () => {
    // Limpar dados específicos antes de cada teste
    await InvestmentContribution.destroy({ where: {} });
    await Investment.destroy({ where: {} });
    await Account.destroy({ where: {} });
    await User.destroy({ where: { email: 'testinvestmentcontribution@example.com' } });

    // Criar usuário de teste via API e obter token
    authToken = await createTestUser(app, 'testinvestmentcontribution@example.com', 'Test User Investment Contribution');
    
    console.log('Token gerado:', authToken ? 'Token existe' : 'Token não existe');
    console.log('Token length:', authToken ? authToken.length : 0);
    
    // Buscar o usuário criado
    testUser = await User.findOne({ where: { email: 'testinvestmentcontribution@example.com' } });
    console.log('Usuário encontrado:', testUser ? testUser.id : 'Não encontrado');

    // Criar conta de teste
    testAccount = await Account.create({
      name: 'Conta Principal',
      bank_name: 'Banco Teste',
      account_type: 'checking',
      balance: 10000,
      user_id: testUser.id
    });

    // Criar investimento de teste
    testInvestment = await Investment.create({
      investment_type: 'acoes',
      asset_name: 'Petrobras',
      ticker: 'PETR4',
      invested_amount: 1000,
      quantity: 100,
      unit_price: 10,
      operation_date: '2024-01-15',
      operation_type: 'compra',
      user_id: testUser.id,
      account_id: testAccount.id
    });
  });

  it('deve criar um novo aporte para um investimento', async () => {
    const aporte = {
      investment_id: testInvestment.id,
      contribution_date: '2024-10-10',
      amount: 100,
      quantity: 10,
      unit_price: 10,
      broker: 'xp_investimentos',
      observations: 'Primeiro aporte',
      source_account_id: testAccount.id,
      destination_account_id: testAccount.id
    };
    const response = await request(app)
      .post('/api/investment-contributions')
      .set('Authorization', `Bearer ${authToken}`)
      .send(aporte);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Aporte criado com sucesso');
    expect(response.body.data.contribution.amount).toBeDefined();
    expect(response.body.data.contribution.quantity).toBeDefined();
    expect(response.body.data.contribution.unit_price).toBeDefined();
    expect(response.body.data.contribution.investment_id).toBe(testInvestment.id);
    expect(response.body.data.contribution.user_id).toBe(testUser.id);
    expect(response.body.data.transactions).toBeDefined();
    expect(Array.isArray(response.body.data.transactions)).toBe(true);
    expect(response.body.data.transactions).toHaveLength(2); // Débito e crédito
  });

  it('deve listar os aportes de um investimento', async () => {
    await InvestmentContribution.create({
      investment_id: testInvestment.id,
      contribution_date: '2024-10-10',
      amount: 100,
      quantity: 10,
      unit_price: 10,
      user_id: testUser.id,
      source_account_id: testAccount.id,
      destination_account_id: testAccount.id
    });
    await InvestmentContribution.create({
      investment_id: testInvestment.id,
      contribution_date: '2024-11-10',
      amount: 200,
      quantity: 20,
      unit_price: 10,
      user_id: testUser.id,
      source_account_id: testAccount.id,
      destination_account_id: testAccount.id
    });
    const response = await request(app)
      .get(`/api/investment-contributions/investment/${testInvestment.id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.contributions.length).toBe(2);
    expect(response.body.data.statistics.totalAmount).toBe(300);
    expect(response.body.data.statistics.totalQuantity).toBe(30);
    expect(response.body.data.statistics.averageUnitPrice).toBe(10);
  });

  it('deve atualizar um aporte', async () => {
    const aporte = await InvestmentContribution.create({
      investment_id: testInvestment.id,
      contribution_date: '2024-10-10',
      amount: 100,
      quantity: 10,
      unit_price: 10,
      user_id: testUser.id,
      source_account_id: testAccount.id,
      destination_account_id: testAccount.id
    });
    const response = await request(app)
      .put(`/api/investment-contributions/${aporte.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        amount: 150, 
        quantity: 15,
        source_account_id: testAccount.id,
        destination_account_id: testAccount.id
      });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Aporte atualizado com sucesso');
    expect(response.body.data.contribution.amount).toBeDefined();
    expect(parseFloat(response.body.data.contribution.amount)).toBeCloseTo(150);
    expect(parseFloat(response.body.data.contribution.quantity)).toBeCloseTo(15);
  });

  it('deve excluir um aporte', async () => {
    const aporte = await InvestmentContribution.create({
      investment_id: testInvestment.id,
      contribution_date: '2024-10-10',
      amount: 100,
      quantity: 10,
      unit_price: 10,
      user_id: testUser.id,
      source_account_id: testAccount.id,
      destination_account_id: testAccount.id
    });
    const response = await request(app)
      .delete(`/api/investment-contributions/${aporte.id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('message', 'Aporte removido com sucesso');
    const deleted = await InvestmentContribution.findByPk(aporte.id);
    expect(deleted).toBeNull();
  });

  it('deve retornar estatísticas dos aportes', async () => {
    await InvestmentContribution.create({
      investment_id: testInvestment.id,
      contribution_date: '2024-10-10',
      amount: 100,
      quantity: 10,
      unit_price: 10,
      user_id: testUser.id,
      source_account_id: testAccount.id,
      destination_account_id: testAccount.id
    });
    await InvestmentContribution.create({
      investment_id: testInvestment.id,
      contribution_date: '2024-11-10',
      amount: 200,
      quantity: 20,
      unit_price: 10,
      user_id: testUser.id,
      source_account_id: testAccount.id,
      destination_account_id: testAccount.id
    });
    const response = await request(app)
      .get('/api/investment-contributions/statistics')
      .set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.totalAmount).toBe(300);
    expect(response.body.data.totalQuantity).toBe(30);
    expect(response.body.data.totalContributions).toBe(2);
    expect(response.body.data.averageAmount).toBe(150);
  });
}); 