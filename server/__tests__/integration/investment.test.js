const request = require('supertest');
const app = require('../../app');
const { Investment, Account, Category, Transaction, User } = require('../../models');
const { createTestUser, cleanAllTestData } = require('./setup');

describe('Investment Routes', () => {
  let token, user, account, category;

  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    // Limpar dados relevantes
    await Investment.destroy({ where: {} });
    await Transaction.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await Account.destroy({ where: {} });
    await User.destroy({ where: { email: 'testinvestment@example.com' } });

    // Criar usuário de teste via API e obter token
    token = await createTestUser(app, 'testinvestment@example.com', 'Test User Investment');
    user = await User.findOne({ where: { email: 'testinvestment@example.com' } });
    
    // Criar conta de teste
    account = await Account.create({
      name: 'Conta Principal',
      bank_name: 'Banco Teste',
      account_type: 'checking',
      balance: 10000,
      user_id: user.id
    });
    
    // Criar categoria de teste
    category = await Category.create({
      name: 'Ações',
      type: 'expense',
      user_id: user.id
    });
  });

  describe('POST /investments', () => {
    it('should create a new investment successfully', async () => {
      const investmentData = {
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        ticker: 'PETR4',
        invested_amount: 1000,
        quantity: 100,
        operation_date: '2024-01-15',
        operation_type: 'compra',
        broker: 'xp_investimentos',
        observations: 'Compra inicial',
        account_id: account.id,
        source_account_id: account.id,
        destination_account_id: account.id,
        category_id: category.id
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token}`)
        .send(investmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message', 'Investimento criado com sucesso');
      expect(response.body.data).toHaveProperty('investment');
      expect(response.body.data).toHaveProperty('transactions');
      expect(response.body.data.investment.asset_name).toBe('Petrobras');
      expect(response.body.data.investment.investment_type).toBe('acoes');
      expect(parseFloat(response.body.data.investment.unit_price)).toBe(10);

      // Verificar se a transação foi criada
      expect(response.body.data.transactions).toHaveLength(2);
      expect(response.body.data.transactions[0].type).toBe('expense');
      expect(response.body.data.transactions[0].amount).toBe(1000);

      // Verificar se o saldo da conta foi atualizado
      const updatedAccount = await Account.findByPk(account.id);
      expect(parseFloat(updatedAccount.balance)).toBe(9000);
    });

    it('should return 400 for invalid investment data', async () => {
      const invalidData = {
        investment_type: 'invalid_type',
        asset_name: '',
        invested_amount: -100
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 when account does not exist', async () => {
      const investmentData = {
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 1000,
        quantity: 100,
        operation_date: '2024-01-15',
        operation_type: 'compra',
        account_id: 999,
        source_account_id: 999,
        destination_account_id: 999
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token}`)
        .send(investmentData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error', 'Conta não encontrada');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/investments')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('GET /investments', () => {
    beforeEach(async () => {
      // Criar alguns investimentos de teste
      await Investment.create({
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 1000,
        quantity: 100,
        unit_price: 10,
        operation_date: '2024-01-15',
        operation_type: 'compra',
        user_id: user.id,
        account_id: account.id,
        category_id: category.id
      });

      await Investment.create({
        investment_type: 'fundos',
        asset_name: 'Fundos Imobiliários',
        invested_amount: 2000,
        quantity: 200,
        unit_price: 10,
        operation_date: '2024-01-20',
        operation_type: 'compra',
        user_id: user.id,
        account_id: account.id,
        category_id: category.id
      });
    });

    it('should return investments with pagination and statistics', async () => {
      const response = await request(app)
        .get('/api/investments')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('investments');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data.investments).toHaveLength(2);
      expect(response.body.data.statistics.totalInvested).toBe(3000);
      expect(response.body.data.statistics.totalSold).toBe(0);
      expect(response.body.data.statistics.netInvestment).toBe(3000);
    });

    it('should apply filters correctly', async () => {
      const response = await request(app)
        .get('/api/investments?investment_type=acoes')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.investments).toHaveLength(1);
      expect(response.body.data.investments[0].investment_type).toBe('acoes');
    });

    it('should return paginated results', async () => {
      const response = await request(app)
        .get('/api/investments?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.investments).toHaveLength(1);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });
  });

  describe('GET /investments/:id', () => {
    let investment;

    beforeEach(async () => {
      investment = await Investment.create({
        investment_type: 'acoes',
        asset_name: 'Vale',
        invested_amount: 1500,
        quantity: 150,
        unit_price: 10,
        operation_date: '2024-01-25',
        operation_type: 'compra',
        user_id: user.id,
        account_id: account.id,
        category_id: category.id
      });
    });

    it('should return a specific investment', async () => {
      const response = await request(app)
        .get(`/api/investments/${investment.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.investment.id).toBe(investment.id);
      expect(response.body.data.investment.asset_name).toBe('Vale');
      expect(response.body.data.investment).toHaveProperty('account');
      expect(response.body.data.investment).toHaveProperty('category');
    });

    it('should return 404 for non-existent investment', async () => {
      const response = await request(app)
        .get('/api/investments/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for investment from another user', async () => {
      // Criar outro usuário
      const otherToken = await createTestUser(app, 'otheruser@example.com', 'Other User');
      const otherUser = await User.findOne({ where: { email: 'otheruser@example.com' } });
      
      const otherInvestment = await Investment.create({
        investment_type: 'acoes',
        asset_name: 'Outro Ativo',
        invested_amount: 1000,
        quantity: 100,
        unit_price: 10,
        operation_date: '2024-01-15',
        operation_type: 'compra',
        user_id: otherUser.id,
        account_id: account.id,
        category_id: category.id
      });

      const response = await request(app)
        .get(`/api/investments/${otherInvestment.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /investments/:id', () => {
    let investment;

    beforeEach(async () => {
      investment = await Investment.create({
        investment_type: 'acoes',
        asset_name: 'Itaú',
        invested_amount: 2000,
        quantity: 200,
        unit_price: 10,
        operation_date: '2024-01-30',
        operation_type: 'compra',
        user_id: user.id,
        account_id: account.id,
        category_id: category.id
      });
    });

    it('should update an investment successfully', async () => {
      const updateData = {
        observations: 'Atualização das observações',
        broker: 'rico'
      };

      const response = await request(app)
        .put(`/api/investments/${investment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message', 'Investimento atualizado com sucesso');
      expect(response.body.data).toHaveProperty('investment');
      expect(response.body.data.investment.observations).toBe('Atualização das observações');
      expect(response.body.data.investment.broker).toBe('rico');
    });

    it('should return 404 for non-existent investment', async () => {
      const response = await request(app)
        .put('/api/investments/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ observations: 'test' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /investments/:id', () => {
    let investment;

    beforeEach(async () => {
      investment = await Investment.create({
        investment_type: 'acoes',
        asset_name: 'Bradesco',
        invested_amount: 1000,
        quantity: 100,
        unit_price: 10,
        operation_date: '2024-02-01',
        operation_type: 'compra',
        user_id: user.id,
        account_id: account.id,
        category_id: category.id
      });
    });

    it('should delete an investment successfully', async () => {
      const response = await request(app)
        .delete(`/api/investments/${investment.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message', 'Investimento excluído com sucesso');

      // Verificar se foi realmente excluído
      const deletedInvestment = await Investment.findByPk(investment.id);
      expect(deletedInvestment).toBeNull();
    });

    it('should return 404 for non-existent investment', async () => {
      const response = await request(app)
        .delete('/api/investments/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /investments/statistics', () => {
    beforeEach(async () => {
      // Criar investimentos para estatísticas
      await Investment.create({
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 1000,
        quantity: 100,
        unit_price: 10,
        operation_date: '2024-01-15',
        operation_type: 'compra',
        broker: 'xp_investimentos',
        user_id: user.id,
        account_id: account.id,
        category_id: category.id
      });

      await Investment.create({
        investment_type: 'fundos',
        asset_name: 'Fundos Imobiliários',
        invested_amount: 2000,
        quantity: 200,
        unit_price: 10,
        operation_date: '2024-01-20',
        operation_type: 'compra',
        broker: 'rico',
        user_id: user.id,
        account_id: account.id,
        category_id: category.id
      });
    });

    it('should return investment statistics', async () => {
      const response = await request(app)
        .get('/api/investments/statistics')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('general');
      expect(response.body.data).toHaveProperty('byType');
      expect(response.body.data).toHaveProperty('byBroker');
      expect(response.body.data).toHaveProperty('recentInvestments');
      expect(response.body.data.general.totalInvested).toBe(3000);
      expect(response.body.data.general.totalSold).toBe(0);
      expect(response.body.data.general.netInvestment).toBe(3000);
    });

    it('should list active positions', async () => {
      const response = await request(app)
        .get('/api/investments/positions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('positions');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.positions)).toBe(true);
      expect(response.body.data.positions).toHaveLength(2);
    });

    it('should get specific asset position', async () => {
      const response = await request(app)
        .get('/api/investments/positions/Vale')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });

    it('should sell an existing asset', async () => {
      const sellData = {
        quantity: 50,
        unit_price: 12,
        operation_date: '2024-02-15',
        account_id: account.id,
        broker: 'xp_investimentos'
      };

      const response = await request(app)
        .post('/api/investments/positions/Petrobras/sell')
        .set('Authorization', `Bearer ${token}`)
        .send(sellData);

      console.log('Response status:', response.status);
      console.log('Response body:', JSON.stringify(response.body, null, 2));

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message', 'Venda registrada com sucesso');
      expect(response.body.data).toHaveProperty('investment');
      expect(response.body.data).toHaveProperty('transaction');
      expect(response.body.data.investment.operation_type).toBe('venda');
      expect(response.body.data.transaction.type).toBe('income');
      expect(parseFloat(response.body.data.transaction.amount)).toBe(600);
    });

    it('should return error when trying to sell more than available', async () => {
      const sellData = {
        quantity: 200, // Mais do que disponível
        unit_price: 12,
        operation_date: '2024-02-15',
        account_id: account.id,
        broker: 'xp_investimentos'
      };

      const response = await request(app)
        .post('/api/investments/positions/Petrobras/sell')
        .set('Authorization', `Bearer ${token}`)
        .send(sellData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Quantidade insuficiente');
    });

    it('should return error when trying to sell non-existent asset', async () => {
      const sellData = {
        quantity: 50,
        unit_price: 12,
        operation_date: '2024-02-15',
        account_id: account.id,
        broker: 'xp_investimentos'
      };

      const response = await request(app)
        .post('/api/investments/positions/AtivoInexistente/sell')
        .set('Authorization', `Bearer ${token}`)
        .send(sellData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 