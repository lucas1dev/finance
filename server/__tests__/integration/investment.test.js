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
        category_id: category.id
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token}`)
        .send(investmentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Investimento criado com sucesso');
      expect(response.body).toHaveProperty('investment');
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.investment.asset_name).toBe('Petrobras');
      expect(response.body.investment.investment_type).toBe('acoes');
      expect(parseFloat(response.body.investment.unit_price)).toBe(10);

      // Verificar se a transação foi criada
      expect(response.body.transaction.type).toBe('expense');
      expect(response.body.transaction.amount).toBe(1000);
      expect(response.body.transaction.description).toBe('Compra de Petrobras');

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
        account_id: 999
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token}`)
        .send(investmentData);

      expect(response.status).toBe(404);
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
      expect(response.body).toHaveProperty('investments');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('statistics');
      expect(response.body.investments).toHaveLength(2);
      expect(response.body.statistics.totalInvested).toBe(3000);
      expect(response.body.statistics.totalSold).toBe(0);
      expect(response.body.statistics.netInvestment).toBe(3000);
    });

    it('should apply filters correctly', async () => {
      const response = await request(app)
        .get('/api/investments?investment_type=acoes')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.investments).toHaveLength(1);
      expect(response.body.investments[0].investment_type).toBe('acoes');
    });

    it('should return paginated results', async () => {
      const response = await request(app)
        .get('/api/investments?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.investments).toHaveLength(1);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
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
      expect(response.body.id).toBe(investment.id);
      expect(response.body.asset_name).toBe('Vale');
      expect(response.body).toHaveProperty('account');
      expect(response.body).toHaveProperty('category');
    });

    it('should return 404 for non-existent investment', async () => {
      const response = await request(app)
        .get('/api/investments/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Investimento não encontrado');
    });

    it('should return 404 for investment from another user', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });

      const otherInvestment = await Investment.create({
        investment_type: 'acoes',
        asset_name: 'Other Asset',
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

      // Limpar
      await Investment.destroy({ where: { id: otherInvestment.id } });
      await User.destroy({ where: { id: otherUser.id } });
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
      expect(response.body).toHaveProperty('message', 'Investimento atualizado com sucesso');
      expect(response.body).toHaveProperty('investment');
      expect(response.body.investment.observations).toBe('Atualização das observações');
      expect(response.body.investment.broker).toBe('rico');
    });

    it('should return 404 for non-existent investment', async () => {
      const response = await request(app)
        .put('/api/investments/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ observations: 'Test' });

      expect(response.status).toBe(404);
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
      expect(response.body).toHaveProperty('message', 'Investimento excluído com sucesso');

      // Verificar se foi realmente excluído
      const deletedInvestment = await Investment.findByPk(investment.id);
      expect(deletedInvestment).toBeNull();
    });

    it('should return 404 for non-existent investment', async () => {
      const response = await request(app)
        .delete('/api/investments/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
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
      expect(response.body).toHaveProperty('general');
      expect(response.body).toHaveProperty('byType');
      expect(response.body).toHaveProperty('byBroker');
      expect(response.body).toHaveProperty('recentInvestments');
      expect(response.body.general.totalInvested).toBe(3000);
      expect(response.body.general.totalSold).toBe(0);
      expect(response.body.general.netInvestment).toBe(3000);
    });

    it('should list active positions', async () => {
      // Primeiro criar um investimento
      const investmentData = {
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        ticker: 'PETR4',
        invested_amount: 1000,
        quantity: 100,
        unit_price: 10,
        operation_date: '2024-03-20',
        operation_type: 'compra',
        broker: 'xp_investimentos',
        account_id: account.id,
        category_id: category.id
      };

      await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token}`)
        .send(investmentData);

      // Agora testar listagem de posições
      const response = await request(app)
        .get('/api/investments/positions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('positions');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.positions)).toBe(true);
    });

    it('should get specific asset position', async () => {
      // Primeiro criar um investimento
      const investmentData = {
        investment_type: 'acoes',
        asset_name: 'Vale',
        ticker: 'VALE3',
        invested_amount: 500,
        quantity: 50,
        unit_price: 10,
        operation_date: '2024-03-20',
        operation_type: 'compra',
        broker: 'xp_investimentos',
        account_id: account.id,
        category_id: category.id
      };

      await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token}`)
        .send(investmentData);

      // Agora testar obtenção da posição específica
      const response = await request(app)
        .get('/api/investments/positions/Vale')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('position');
      expect(response.body).toHaveProperty('operations');
      expect(response.body.position.assetName).toBe('Vale');
      expect(response.body.position.totalQuantity).toBe(50);
    });

    it('should sell an existing asset', async () => {
      // Primeiro criar um investimento para ter posição
      const investmentData = {
        investment_type: 'acoes',
        asset_name: 'Bradesco',
        ticker: 'BBDC4',
        invested_amount: 1200,
        quantity: 60,
        unit_price: 20,
        operation_date: '2024-03-20',
        operation_type: 'compra',
        broker: 'xp_investimentos',
        account_id: account.id,
        category_id: category.id
      };

      await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token}`)
        .send(investmentData);

      // Agora vender parte da posição
      const sellData = {
        quantity: 30,
        unit_price: 22,
        operation_date: '2024-03-25',
        account_id: account.id,
        broker: 'xp_investimentos',
        observations: 'Venda parcial'
      };

      const response = await request(app)
        .post('/api/investments/positions/Bradesco/sell')
        .set('Authorization', `Bearer ${token}`)
        .send(sellData);

      console.log('Response status:', response.status);
      console.log('Response body:', JSON.stringify(response.body, null, 2));

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Venda registrada com sucesso');
      expect(response.body).toHaveProperty('investment');
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.investment.operation_type).toBe('venda');
      expect(response.body.investment.asset_name).toBe('Bradesco');
      expect(response.body.transaction.type).toBe('income');
    });

    it('should return error when trying to sell more than available', async () => {
      // Primeiro criar um investimento (compra)
      const investmentData = {
        investment_type: 'acoes',
        asset_name: 'Itau',
        ticker: 'ITUB4',
        invested_amount: 600,
        quantity: 60,
        unit_price: 10,
        operation_date: '2024-03-20',
        operation_type: 'compra',
        broker: 'xp_investimentos',
        account_id: account.id,
        category_id: category.id
      };

      await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token}`)
        .send(investmentData);

      // Tentar vender mais do que tem
      const sellData = {
        quantity: 100, // Mais do que os 60 comprados
        unit_price: 12,
        operation_date: '2024-03-25',
        account_id: account.id,
        broker: 'xp_investimentos'
      };

      const response = await request(app)
        .post('/api/investments/positions/Itau/sell')
        .set('Authorization', `Bearer ${token}`)
        .send(sellData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Quantidade insuficiente');
    });

    it('should return error when trying to sell non-existent asset', async () => {
      const sellData = {
        quantity: 10,
        unit_price: 12,
        operation_date: '2024-03-25',
        account_id: account.id,
        broker: 'xp_investimentos'
      };

      const response = await request(app)
        .post('/api/investments/positions/AtivoInexistente/sell')
        .set('Authorization', `Bearer ${token}`)
        .send(sellData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Posição não encontrada');
    });
  });
}); 