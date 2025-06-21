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
    
    // Buscar o usuário criado
    testUser = await User.findOne({ where: { email: 'testinvestmentcontribution@example.com' } });

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
      observations: 'Primeiro aporte'
    };
    const response = await request(app)
      .post('/api/investment-contributions')
      .set('Authorization', `Bearer ${authToken}`)
      .send(aporte);
    
    console.log('Response status:', response.status);
    console.log('Response body:', response.body);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Aporte criado com sucesso');
    expect(response.body.contribution.amount).toBe('100.00');
    expect(response.body.contribution.quantity).toBe('10.0000');
  });

  it('deve listar os aportes de um investimento', async () => {
    await InvestmentContribution.create({
      investment_id: testInvestment.id,
      contribution_date: '2024-10-10',
      amount: 100,
      quantity: 10,
      unit_price: 10,
      user_id: testUser.id
    });
    await InvestmentContribution.create({
      investment_id: testInvestment.id,
      contribution_date: '2024-11-10',
      amount: 200,
      quantity: 20,
      unit_price: 10,
      user_id: testUser.id
    });
    const response = await request(app)
      .get(`/api/investment-contributions/investment/${testInvestment.id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.contributions.length).toBe(2);
    expect(response.body.summary.totalAmount).toBe(300);
    expect(response.body.summary.totalQuantity).toBe(30);
    expect(response.body.summary.averageUnitPrice).toBe(10);
  });

  it('deve atualizar um aporte', async () => {
    const aporte = await InvestmentContribution.create({
      investment_id: testInvestment.id,
      contribution_date: '2024-10-10',
      amount: 100,
      quantity: 10,
      unit_price: 10,
      user_id: testUser.id
    });
    const response = await request(app)
      .put(`/api/investment-contributions/${aporte.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 150, quantity: 15 });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Aporte atualizado com sucesso');
    expect(response.body.contribution.amount).toBeDefined();
    expect(parseFloat(response.body.contribution.amount)).toBeCloseTo(150);
    expect(parseFloat(response.body.contribution.quantity)).toBeCloseTo(15);
  });

  it('deve excluir um aporte', async () => {
    const aporte = await InvestmentContribution.create({
      investment_id: testInvestment.id,
      contribution_date: '2024-10-10',
      amount: 100,
      quantity: 10,
      unit_price: 10,
      user_id: testUser.id
    });
    const response = await request(app)
      .delete(`/api/investment-contributions/${aporte.id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Aporte excluído com sucesso');
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
      user_id: testUser.id
    });
    await InvestmentContribution.create({
      investment_id: testInvestment.id,
      contribution_date: '2024-11-10',
      amount: 200,
      quantity: 20,
      unit_price: 10,
      user_id: testUser.id
    });
    const response = await request(app)
      .get('/api/investment-contributions/statistics')
      .set('Authorization', `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.general.totalAmount).toBe(300);
    expect(response.body.general.totalQuantity).toBe(30);
    expect(response.body.general.totalContributions).toBe(2);
    expect(response.body.general.averageAmount).toBe(150);
  });
}); 