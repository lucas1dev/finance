const request = require('supertest');
const app = require('../../app');
const { User, Account, Category, Investment, InvestmentContribution } = require('../../models');
const { generateToken } = require('../../utils/helpers');

describe('Investment Contribution Routes', () => {
  let token, user, account, category, investment;

  beforeAll(async () => {
    user = await User.create({
      name: 'Aportador',
      email: 'aportador@example.com',
      password: 'senha123'
    });
    account = await Account.create({
      name: 'Conta Aporte',
      bank_name: 'Banco Teste',
      account_type: 'checking',
      balance: 10000,
      user_id: user.id
    });
    category = await Category.create({
      name: 'Ações',
      type: 'expense',
      user_id: user.id
    });
    investment = await Investment.create({
      investment_type: 'acoes',
      asset_name: 'Bradesco',
      invested_amount: 1000,
      quantity: 100,
      unit_price: 10,
      operation_date: '2024-10-10',
      operation_type: 'compra',
      broker: 'xp_investimentos',
      account_id: account.id,
      category_id: category.id,
      user_id: user.id
    });
    token = generateToken(user.id);
  });

  afterAll(async () => {
    await InvestmentContribution.destroy({ where: {} });
    await Investment.destroy({ where: {} });
    await Account.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  beforeEach(async () => {
    await InvestmentContribution.destroy({ where: {} });
  });

  it('deve criar um novo aporte para um investimento', async () => {
    const aporte = {
      investment_id: investment.id,
      contribution_date: '2024-10-10',
      amount: 100,
      quantity: 10,
      unit_price: 10,
      broker: 'xp_investimentos',
      observations: 'Primeiro aporte'
    };
    const response = await request(app)
      .post('/api/investment-contributions')
      .set('Authorization', `Bearer ${token}`)
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
      investment_id: investment.id,
      contribution_date: '2024-10-10',
      amount: 100,
      quantity: 10,
      unit_price: 10,
      user_id: user.id
    });
    await InvestmentContribution.create({
      investment_id: investment.id,
      contribution_date: '2024-11-10',
      amount: 200,
      quantity: 20,
      unit_price: 10,
      user_id: user.id
    });
    const response = await request(app)
      .get(`/api/investment-contributions/investment/${investment.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.contributions.length).toBe(2);
    expect(response.body.summary.totalAmount).toBe(300);
    expect(response.body.summary.totalQuantity).toBe(30);
    expect(response.body.summary.averageUnitPrice).toBe(10);
  });

  it('deve atualizar um aporte', async () => {
    const aporte = await InvestmentContribution.create({
      investment_id: investment.id,
      contribution_date: '2024-10-10',
      amount: 100,
      quantity: 10,
      unit_price: 10,
      user_id: user.id
    });
    const response = await request(app)
      .put(`/api/investment-contributions/${aporte.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 150, quantity: 15 });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Aporte atualizado com sucesso');
    expect(response.body.contribution.amount).toBeDefined();
    expect(parseFloat(response.body.contribution.amount)).toBeCloseTo(150);
    expect(parseFloat(response.body.contribution.quantity)).toBeCloseTo(15);
  });

  it('deve excluir um aporte', async () => {
    const aporte = await InvestmentContribution.create({
      investment_id: investment.id,
      contribution_date: '2024-10-10',
      amount: 100,
      quantity: 10,
      unit_price: 10,
      user_id: user.id
    });
    const response = await request(app)
      .delete(`/api/investment-contributions/${aporte.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Aporte excluído com sucesso');
    const deleted = await InvestmentContribution.findByPk(aporte.id);
    expect(deleted).toBeNull();
  });

  it('deve retornar estatísticas dos aportes', async () => {
    await InvestmentContribution.create({
      investment_id: investment.id,
      contribution_date: '2024-10-10',
      amount: 100,
      quantity: 10,
      unit_price: 10,
      user_id: user.id
    });
    await InvestmentContribution.create({
      investment_id: investment.id,
      contribution_date: '2024-11-10',
      amount: 200,
      quantity: 20,
      unit_price: 10,
      user_id: user.id
    });
    const response = await request(app)
      .get('/api/investment-contributions/statistics')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.general.totalAmount).toBe(300);
    expect(response.body.general.totalQuantity).toBe(30);
    expect(response.body.general.totalContributions).toBe(2);
    expect(response.body.general.averageAmount).toBe(150);
  });
}); 