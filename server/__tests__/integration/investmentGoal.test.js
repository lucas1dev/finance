const request = require('supertest');
const app = require('../../app');
const { InvestmentGoal, Category, Investment, User, Account } = require('../../models');
const { generateToken } = require('../../utils/helpers');
const { createTestUser, cleanAllTestData } = require('./setup');

describe('Investment Goal Routes', () => {
  let token, user, category;

  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    // Limpeza completa de dados
    await cleanAllTestData();

    // Criar usuário de teste via API e obter token
    token = await createTestUser(app, 'testinvestmentgoal@example.com', 'Test User Investment Goal');
    user = await User.findOne({ where: { email: 'testinvestmentgoal@example.com' } });
    
    // Criar categoria de teste
    category = await Category.create({
      name: 'Investimentos',
      type: 'expense',
      user_id: user.id
    });
  });

  describe('POST /api/investment-goals', () => {
    it('should create a new investment goal successfully', async () => {
      const goalData = {
        title: 'Aposentadoria',
        description: 'Meta para aposentadoria aos 60 anos',
        target_amount: 500000,
        target_date: '2030-12-31',
        current_amount: 0,
        color: '#3B82F6',
        category_id: category.id
      };

      const response = await request(app)
        .post('/api/investment-goals')
        .set('Authorization', `Bearer ${token}`)
        .send(goalData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Meta de investimento criada com sucesso');
      expect(response.body.data).toHaveProperty('goal');
      expect(response.body.data.goal.title).toBe('Aposentadoria');
      expect(response.body.data.goal.target_amount).toBe('500000.00');
      expect(response.body.data.goal.progress).toBe(0);
      expect(response.body.data.goal).toHaveProperty('category');
    });

    it('should return 400 for invalid goal data', async () => {
      const invalidData = {
        title: '',
        target_amount: -1000,
        target_date: 'invalid-date'
      };

      const response = await request(app)
        .post('/api/investment-goals')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 404 when category does not exist', async () => {
      const goalData = {
        title: 'Aposentadoria',
        description: 'Meta para aposentadoria',
        target_amount: 500000,
        target_date: '2030-12-31',
        category_id: 999
      };

      const response = await request(app)
        .post('/api/investment-goals')
        .set('Authorization', `Bearer ${token}`)
        .send(goalData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Categoria não encontrada');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/investment-goals')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/investment-goals', () => {
    beforeEach(async () => {
      // Criar algumas metas de teste
      await InvestmentGoal.create({
        title: 'Aposentadoria',
        description: 'Meta para aposentadoria',
        target_amount: 500000,
        target_date: '2030-12-31',
        current_amount: 100000,
        color: '#3B82F6',
        user_id: user.id,
        category_id: category.id
      });

      await InvestmentGoal.create({
        title: 'Viagem Europa',
        description: 'Meta para viagem à Europa',
        target_amount: 50000,
        target_date: '2025-06-30',
        current_amount: 15000,
        color: '#10B981',
        user_id: user.id,
        category_id: category.id
      });
    });

    it('should return investment goals with pagination and statistics', async () => {
      const response = await request(app)
        .get('/api/investment-goals')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('goals');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data.goals).toHaveLength(2);
      expect(response.body.data.statistics.totalGoals).toBe(2);
      expect(response.body.data.statistics.activeGoals).toBe(2);
      expect(response.body.data.statistics.completedGoals).toBe(0);
    });

    it('should apply status filter correctly', async () => {
      const response = await request(app)
        .get('/api/investment-goals?status=ativa')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.goals).toHaveLength(2);
    });

    it('should return paginated results', async () => {
      const response = await request(app)
        .get('/api/investment-goals?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.goals).toHaveLength(1);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });

    it('should include progress, isOverdue, and isCompleted properties', async () => {
      const response = await request(app)
        .get('/api/investment-goals')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.goals[0]).toHaveProperty('progress');
      expect(response.body.data.goals[0]).toHaveProperty('isOverdue');
      expect(response.body.data.goals[0]).toHaveProperty('isCompleted');
      expect(typeof response.body.data.goals[0].progress).toBe('number');
      expect(typeof response.body.data.goals[0].isOverdue).toBe('boolean');
      expect(typeof response.body.data.goals[0].isCompleted).toBe('boolean');
    });
  });

  describe('GET /api/investment-goals/:id', () => {
    let goal;

    beforeEach(async () => {
      goal = await InvestmentGoal.create({
        title: 'Casa Própria',
        description: 'Meta para compra de casa própria',
        target_amount: 300000,
        target_date: '2028-12-31',
        current_amount: 50000,
        color: '#F59E0B',
        user_id: user.id,
        category_id: category.id
      });
    });

    it('should return a specific investment goal', async () => {
      const response = await request(app)
        .get(`/api/investment-goals/${goal.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.id).toBe(goal.id);
      expect(response.body.data.title).toBe('Casa Própria');
      expect(response.body.data).toHaveProperty('progress');
      expect(response.body.data).toHaveProperty('isOverdue');
      expect(response.body.data).toHaveProperty('isCompleted');
      expect(response.body.data).toHaveProperty('category');
    });

    it('should return 404 for non-existent goal', async () => {
      const response = await request(app)
        .get('/api/investment-goals/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Meta de investimento não encontrada');
    });

    it('should return 404 for goal from another user', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });

      const otherGoal = await InvestmentGoal.create({
        title: 'Other Goal',
        description: 'Other goal description',
        target_amount: 100000,
        target_date: '2025-12-31',
        current_amount: 0,
        user_id: otherUser.id,
        category_id: category.id
      });

      const response = await request(app)
        .get(`/api/investment-goals/${otherGoal.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Meta de investimento não encontrada');
    });
  });

  describe('PUT /api/investment-goals/:id', () => {
    let goal;

    beforeEach(async () => {
      goal = await InvestmentGoal.create({
        title: 'Educação',
        description: 'Meta para educação superior',
        target_amount: 100000,
        target_date: '2026-12-31',
        current_amount: 20000,
        color: '#8B5CF6',
        user_id: user.id,
        category_id: category.id
      });
    });

    it('should update an investment goal successfully', async () => {
      const updateData = {
        title: 'Educação Superior',
        description: 'Meta atualizada para educação superior',
        target_amount: 120000,
        color: '#EC4899'
      };

      const response = await request(app)
        .put(`/api/investment-goals/${goal.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Meta de investimento atualizada com sucesso');
      expect(response.body.data.goal.title).toBe('Educação Superior');
      expect(response.body.data.goal.target_amount).toBe(120000);
      expect(response.body.data.goal.color).toBe('#EC4899');
    });

    it('should return 404 for non-existent goal', async () => {
      const response = await request(app)
        .put('/api/investment-goals/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Meta de investimento não encontrada');
    });
  });

  describe('PUT /api/investment-goals/:id/amount', () => {
    let goal;

    beforeEach(async () => {
      goal = await InvestmentGoal.create({
        title: 'Carro',
        description: 'Meta para compra de carro',
        target_amount: 80000,
        target_date: '2027-06-30',
        current_amount: 25000,
        color: '#EF4444',
        user_id: user.id,
        category_id: category.id
      });
    });

    it('should update goal amount successfully', async () => {
      const updateData = {
        current_amount: 35000
      };

      const response = await request(app)
        .put(`/api/investment-goals/${goal.id}/amount`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Valor atual da meta atualizado com sucesso');
      expect(response.body.data.goal.current_amount).toBe(35000);
    });

    it('should return 404 for non-existent goal', async () => {
      const response = await request(app)
        .put('/api/investment-goals/999/amount')
        .set('Authorization', `Bearer ${token}`)
        .send({ current_amount: 10000 });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Meta de investimento não encontrada');
    });
  });

  describe('PUT /api/investment-goals/:id/calculate', () => {
    let goal;

    beforeEach(async () => {
      goal = await InvestmentGoal.create({
        title: 'Aposentadoria',
        description: 'Meta para aposentadoria',
        target_amount: 1000000,
        target_date: '2040-12-31',
        current_amount: 0,
        color: '#3B82F6',
        user_id: user.id,
        category_id: category.id
      });
    });

    it('should calculate goal amount based on investments', async () => {
      // Criar uma conta para os investimentos
      const account = await Account.create({
        name: 'Conta Teste',
        bank_name: 'Banco Teste',
        account_type: 'corrente',
        type: 'corrente',
        balance: 100000,
        user_id: user.id
      });

      // Criar alguns investimentos
      await Investment.create({
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 16000,
        quantity: 100,
        operation_date: '2024-01-15',
        operation_type: 'compra',
        account_id: account.id,
        user_id: user.id,
        category_id: category.id
      });

      await Investment.create({
        investment_type: 'fundos',
        asset_name: 'Fundo XP',
        invested_amount: 27000,
        quantity: 1000,
        operation_date: '2024-01-20',
        operation_type: 'compra',
        account_id: account.id,
        user_id: user.id,
        category_id: category.id
      });

      const response = await request(app)
        .put(`/api/investment-goals/${goal.id}/calculate`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Valor da meta calculado com sucesso');
      expect(response.body.data).toHaveProperty('goal');
      expect(response.body.data).toHaveProperty('calculatedAmount');
      expect(response.body.data).toHaveProperty('investmentsCount');
    });

    it('should return 404 for non-existent goal', async () => {
      const response = await request(app)
        .put('/api/investment-goals/999/calculate')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Meta de investimento não encontrada');
    });
  });

  describe('DELETE /api/investment-goals/:id', () => {
    let goal;

    beforeEach(async () => {
      goal = await InvestmentGoal.create({
        title: 'Temporária',
        description: 'Meta temporária para teste',
        target_amount: 10000,
        target_date: '2025-12-31',
        current_amount: 0,
        color: '#6B7280',
        user_id: user.id,
        category_id: category.id
      });
    });

    it('should delete an investment goal successfully', async () => {
      const response = await request(app)
        .delete(`/api/investment-goals/${goal.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Meta de investimento excluída com sucesso');

      // Verificar se foi realmente excluída
      const deletedGoal = await InvestmentGoal.findByPk(goal.id);
      expect(deletedGoal).toBeNull();
    });

    it('should return 404 for non-existent goal', async () => {
      const response = await request(app)
        .delete('/api/investment-goals/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Meta de investimento não encontrada');
    });
  });

  describe('GET /api/investment-goals/statistics', () => {
    beforeEach(async () => {
      // Criar metas com diferentes status
      await InvestmentGoal.create({
        title: 'Meta 1',
        description: 'Primeira meta',
        target_amount: 100000,
        target_date: '2025-12-31',
        current_amount: 50000,
        status: 'ativa',
        color: '#3B82F6',
        user_id: user.id,
        category_id: category.id
      });

      await InvestmentGoal.create({
        title: 'Meta 2',
        description: 'Segunda meta',
        target_amount: 50000,
        target_date: '2025-12-31',
        current_amount: 50000,
        status: 'concluida',
        color: '#10B981',
        user_id: user.id,
        category_id: category.id
      });
    });

    it('should return investment goal statistics', async () => {
      const response = await request(app)
        .get('/api/investment-goals/statistics')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('amounts');
      expect(response.body.data).toHaveProperty('progressByCategory');
      expect(response.body.data.summary.totalGoals).toBe(2);
      expect(response.body.data.summary.activeGoals).toBe(1);
      expect(response.body.data.summary.completedGoals).toBe(1);
      expect(response.body.data.amounts.totalTargetAmount).toBe(150000);
      expect(response.body.data.amounts.totalCurrentAmount).toBe(100000);
    });
  });
}); 