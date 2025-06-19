const request = require('supertest');
const app = require('../../app');
const { InvestmentGoal, Category, Investment, User } = require('../../models');
const { generateToken } = require('../../utils/helpers');

describe('Investment Goal Routes', () => {
  let token, user, category;

  beforeAll(async () => {
    // Criar usuário de teste
    user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    // Criar categoria de teste
    category = await Category.create({
      name: 'Investimentos',
      type: 'expense',
      user_id: user.id
    });

    // Gerar token JWT
    token = generateToken(user.id);
  });

  afterAll(async () => {
    // Limpar dados de teste
    await Investment.destroy({ where: {} });
    await InvestmentGoal.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  beforeEach(async () => {
    // Limpar metas antes de cada teste
    await InvestmentGoal.destroy({ where: {} });
  });

  describe('POST /investment-goals', () => {
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
        .post('/investment-goals')
        .set('Authorization', `Bearer ${token}`)
        .send(goalData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Meta de investimento criada com sucesso');
      expect(response.body).toHaveProperty('goal');
      expect(response.body.goal.title).toBe('Aposentadoria');
      expect(response.body.goal.target_amount).toBe(500000);
      expect(response.body.goal.progress).toBe(0);
      expect(response.body.goal).toHaveProperty('category');
    });

    it('should return 400 for invalid goal data', async () => {
      const invalidData = {
        title: '',
        target_amount: -1000,
        target_date: 'invalid-date'
      };

      const response = await request(app)
        .post('/investment-goals')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
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
        .post('/investment-goals')
        .set('Authorization', `Bearer ${token}`)
        .send(goalData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Categoria não encontrada');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/investment-goals')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('GET /investment-goals', () => {
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
        .get('/investment-goals')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('goals');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('statistics');
      expect(response.body.goals).toHaveLength(2);
      expect(response.body.statistics.totalGoals).toBe(2);
      expect(response.body.statistics.activeGoals).toBe(2);
      expect(response.body.statistics.completedGoals).toBe(0);
    });

    it('should apply status filter correctly', async () => {
      const response = await request(app)
        .get('/investment-goals?status=ativa')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.goals).toHaveLength(2);
    });

    it('should return paginated results', async () => {
      const response = await request(app)
        .get('/investment-goals?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.goals).toHaveLength(1);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should include progress, isOverdue, and isCompleted properties', async () => {
      const response = await request(app)
        .get('/investment-goals')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.goals[0]).toHaveProperty('progress');
      expect(response.body.goals[0]).toHaveProperty('isOverdue');
      expect(response.body.goals[0]).toHaveProperty('isCompleted');
      expect(typeof response.body.goals[0].progress).toBe('number');
      expect(typeof response.body.goals[0].isOverdue).toBe('boolean');
      expect(typeof response.body.goals[0].isCompleted).toBe('boolean');
    });
  });

  describe('GET /investment-goals/:id', () => {
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
        .get(`/investment-goals/${goal.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(goal.id);
      expect(response.body.title).toBe('Casa Própria');
      expect(response.body).toHaveProperty('progress');
      expect(response.body).toHaveProperty('isOverdue');
      expect(response.body).toHaveProperty('isCompleted');
      expect(response.body).toHaveProperty('category');
    });

    it('should return 404 for non-existent goal', async () => {
      const response = await request(app)
        .get('/investment-goals/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
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
        .get(`/investment-goals/${otherGoal.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);

      // Limpar
      await InvestmentGoal.destroy({ where: { id: otherGoal.id } });
      await User.destroy({ where: { id: otherUser.id } });
    });
  });

  describe('PUT /investment-goals/:id', () => {
    let goal;

    beforeEach(async () => {
      goal = await InvestmentGoal.create({
        title: 'Educação',
        description: 'Meta para educação dos filhos',
        target_amount: 200000,
        target_date: '2035-12-31',
        current_amount: 25000,
        color: '#8B5CF6',
        user_id: user.id,
        category_id: category.id
      });
    });

    it('should update an investment goal successfully', async () => {
      const updateData = {
        title: 'Educação Superior',
        target_amount: 250000,
        description: 'Meta atualizada para educação superior'
      };

      const response = await request(app)
        .put(`/investment-goals/${goal.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Meta de investimento atualizada com sucesso');
      expect(response.body).toHaveProperty('goal');
      expect(response.body.goal.title).toBe('Educação Superior');
      expect(response.body.goal.target_amount).toBe(250000);
      expect(response.body.goal.description).toBe('Meta atualizada para educação superior');
      expect(response.body.goal).toHaveProperty('progress');
    });

    it('should return 404 for non-existent goal', async () => {
      const response = await request(app)
        .put('/investment-goals/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /investment-goals/:id/amount', () => {
    let goal;

    beforeEach(async () => {
      goal = await InvestmentGoal.create({
        title: 'Carro',
        description: 'Meta para compra de carro',
        target_amount: 80000,
        target_date: '2026-12-31',
        current_amount: 20000,
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
        .put(`/investment-goals/${goal.id}/amount`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Valor atual da meta atualizado com sucesso');
      expect(response.body).toHaveProperty('goal');
      expect(response.body.goal.current_amount).toBe(35000);
      expect(response.body.goal).toHaveProperty('progress');
    });

    it('should return 404 for non-existent goal', async () => {
      const response = await request(app)
        .put('/investment-goals/999/amount')
        .set('Authorization', `Bearer ${token}`)
        .send({ current_amount: 1000 });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /investment-goals/:id/calculate', () => {
    let goal;

    beforeEach(async () => {
      goal = await InvestmentGoal.create({
        title: 'Investimentos',
        description: 'Meta baseada em investimentos',
        target_amount: 100000,
        target_date: '2030-12-31',
        current_amount: 0,
        color: '#06B6D4',
        user_id: user.id,
        category_id: category.id
      });
    });

    it('should calculate goal amount based on investments', async () => {
      // Criar alguns investimentos
      await Investment.create({
        investment_type: 'acoes',
        asset_name: 'Petrobras',
        invested_amount: 15000,
        quantity: 150,
        operation_date: '2024-01-15',
        operation_type: 'compra',
        status: 'ativo',
        user_id: user.id
      });

      await Investment.create({
        investment_type: 'fundos',
        asset_name: 'Fundos Imobiliários',
        invested_amount: 25000,
        quantity: 250,
        operation_date: '2024-01-20',
        operation_type: 'compra',
        status: 'ativo',
        user_id: user.id
      });

      const response = await request(app)
        .put(`/investment-goals/${goal.id}/calculate`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Valor atual da meta calculado automaticamente');
      expect(response.body).toHaveProperty('goal');
      expect(response.body.goal.current_amount).toBe(40000);
      expect(response.body.goal).toHaveProperty('progress');
    });

    it('should return 404 for non-existent goal', async () => {
      const response = await request(app)
        .put('/investment-goals/999/calculate')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /investment-goals/:id', () => {
    let goal;

    beforeEach(async () => {
      goal = await InvestmentGoal.create({
        title: 'Temporária',
        description: 'Meta temporária para teste',
        target_amount: 10000,
        target_date: '2024-12-31',
        current_amount: 1000,
        color: '#6B7280',
        user_id: user.id,
        category_id: category.id
      });
    });

    it('should delete an investment goal successfully', async () => {
      const response = await request(app)
        .delete(`/investment-goals/${goal.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Meta de investimento excluída com sucesso');

      // Verificar se foi realmente excluída
      const deletedGoal = await InvestmentGoal.findByPk(goal.id);
      expect(deletedGoal).toBeNull();
    });

    it('should return 404 for non-existent goal', async () => {
      const response = await request(app)
        .delete('/investment-goals/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /investment-goals/statistics', () => {
    beforeEach(async () => {
      // Criar metas para estatísticas
      await InvestmentGoal.create({
        title: 'Meta 1',
        description: 'Primeira meta',
        target_amount: 100000,
        target_date: '2025-12-31',
        current_amount: 25000,
        color: '#3B82F6',
        user_id: user.id,
        category_id: category.id
      });

      await InvestmentGoal.create({
        title: 'Meta 2',
        description: 'Segunda meta',
        target_amount: 50000,
        target_date: '2024-12-31',
        current_amount: 50000,
        color: '#10B981',
        user_id: user.id,
        category_id: category.id
      });

      await InvestmentGoal.create({
        title: 'Meta 3',
        description: 'Terceira meta',
        target_amount: 75000,
        target_date: '2023-12-31',
        current_amount: 30000,
        color: '#F59E0B',
        user_id: user.id,
        category_id: category.id
      });
    });

    it('should return investment goal statistics', async () => {
      const response = await request(app)
        .get('/investment-goals/statistics')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('general');
      expect(response.body).toHaveProperty('upcomingGoals');
      expect(response.body.general).toHaveProperty('totalGoals');
      expect(response.body.general).toHaveProperty('activeGoals');
      expect(response.body.general).toHaveProperty('completedGoals');
      expect(response.body.general).toHaveProperty('overdueGoals');
      expect(response.body.general).toHaveProperty('completionRate');
      expect(response.body.general).toHaveProperty('averageProgress');
    });
  });
}); 