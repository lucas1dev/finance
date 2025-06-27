const request = require('supertest');
const app = require('../../app');
const { Category, User } = require('../../models');
const { createTestUser, cleanAllTestData } = require('./setup');

describe('Category Integration Tests', () => {
  let authToken;
  let testUser;
  let testCategory;

  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    await Category.destroy({ where: {} });
    await User.destroy({ where: { email: 'testcategory@example.com' } });
    // Criar usuário de teste via API e obter token
    authToken = await createTestUser(app, 'testcategory@example.com', 'Test User Category');
    testUser = await User.findOne({ where: { email: 'testcategory@example.com' } });
    // Não criar categoria padrão aqui!
  });

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const categoryData = {
        name: 'Test Category',
        type: 'expense'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('categoryId');
      expect(typeof response.body.data.categoryId).toBe('number');

      testCategory = await Category.findByPk(response.body.data.categoryId);
      expect(testCategory.name).toBe('Test Category');
      expect(testCategory.type).toBe('expense');
      expect(testCategory.user_id).toBe(testUser.id);
    });

    it('should create an income category', async () => {
      const categoryData = {
        name: 'Salary',
        type: 'income'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('categoryId');

      const category = await Category.findByPk(response.body.data.categoryId);
      expect(category.type).toBe('income');
    });

    it('should return 400 for duplicate category name and type', async () => {
      const categoryData = {
        name: 'Test Category',
        type: 'expense'
      };

      // Criar categoria previamente
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      // Tentativa de duplicidade
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Já existe uma categoria com este nome e tipo');
    });

    it('should allow same name with different type', async () => {
      const categoryData = {
        name: 'Test Category',
        type: 'income'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('categoryId');
    });
  });

  describe('GET /api/categories', () => {
    beforeEach(async () => {
      testCategory = await Category.create({
        name: 'Test Category',
        type: 'expense',
        user_id: testUser.id
      });
    });

    it('should list all categories for the user', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verificar se todas as categorias pertencem ao usuário
      response.body.data.forEach(category => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('type');
        expect(category).toHaveProperty('created_at');
        expect(category).toHaveProperty('updated_at');
      });
    });

    it('should return categories ordered by name', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      
      // Verificar se está ordenado alfabeticamente
      const names = response.body.data.map(cat => cat.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  describe('GET /api/categories/:id', () => {
    let category;
    beforeEach(async () => {
      category = await Category.create({
        name: 'Categoria Unica',
        type: 'expense',
        user_id: testUser.id
      });
    });

    it('deve retornar uma categoria específica do usuário', async () => {
      const response = await request(app)
        .get(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', category.id);
      expect(response.body.data).toHaveProperty('name', 'Categoria Unica');
    });

    it('deve retornar 404 se a categoria não existir', async () => {
      const response = await request(app)
        .get('/api/categories/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Categoria não encontrada');
    });

    it('não deve permitir acesso de outro usuário', async () => {
      // Criar outro usuário
      const otherUser = await User.create({
        name: 'Outro Usuário',
        email: 'outro@exemplo.com',
        password: 'senha123',
        two_factor_secret: 'secret'
      });
      const otherLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'outro@exemplo.com', password: 'senha123' });
      const otherToken = otherLogin.body.data.token;

      const response = await request(app)
        .get(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Categoria não encontrada');

      await User.destroy({ where: { id: otherUser.id } });
    });
  });

  describe('PUT /api/categories/:id', () => {
    beforeEach(async () => {
      testCategory = await Category.create({
        name: 'Test Category',
        type: 'expense',
        user_id: testUser.id
      });
    });

    it('should update a category', async () => {
      const updateData = {
        name: 'Updated Test Category',
        type: 'income'
      };

      const response = await request(app)
        .put(`/api/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Categoria atualizada com sucesso');

      // Verificar se foi realmente atualizada
      const updatedCategory = await Category.findByPk(testCategory.id);
      expect(updatedCategory.name).toBe('Updated Test Category');
      expect(updatedCategory.type).toBe('income');
    });

    it('should return 404 for non-existent category', async () => {
      const updateData = {
        name: 'Non-existent',
        type: 'expense'
      };

      const response = await request(app)
        .put('/api/categories/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Categoria não encontrada');
    });

    it('should return 400 for duplicate name and type', async () => {
      // Criar uma categoria diferente
      const otherCategory = await Category.create({
        name: 'Other Category',
        type: 'expense',
        user_id: testUser.id
      });

      const updateData = {
        name: 'Other Category',
        type: 'expense'
      };

      const response = await request(app)
        .put(`/api/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Já existe uma categoria com este nome e tipo');

      // Limpar
      await otherCategory.destroy();
    });
  });

  describe('DELETE /api/categories/:id', () => {
    beforeEach(async () => {
      testCategory = await Category.create({
        name: 'Test Category',
        type: 'expense',
        user_id: testUser.id
      });
    });

    it('should delete a category', async () => {
      const response = await request(app)
        .delete(`/api/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Categoria excluída com sucesso');

      // Verificar se foi realmente deletada
      const deletedCategory = await Category.findByPk(testCategory.id);
      expect(deletedCategory).toBeNull();
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .delete('/api/categories/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Categoria não encontrada');
    });
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should not allow access to other users categories', async () => {
      // Criar uma categoria para o primeiro usuário
      const firstUserCategory = await Category.create({
        name: 'First User Category',
        type: 'expense',
        user_id: testUser.id
      });

      // Criar outro usuário
      const otherUser = await User.create({
        name: 'Other User Category',
        email: 'otherusercategory@example.com',
        password: 'password123',
        two_factor_secret: 'test-secret'
      });

      // Fazer login com outro usuário
      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'otherusercategory@example.com',
          password: 'password123'
        });

      expect(otherLoginResponse.status).toBe(200);
      expect(otherLoginResponse.body).toHaveProperty('data');
      expect(otherLoginResponse.body.data).toHaveProperty('token');
      
      const otherAuthToken = otherLoginResponse.body.data.token;

      // Tentar acessar categoria do primeiro usuário via PUT (rota que existe)
      const response = await request(app)
        .put(`/api/categories/${firstUserCategory.id}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({
          name: 'Tentativa de Acesso',
          type: 'expense'
        });

      // Deve retornar 404 porque a categoria não pertence ao outro usuário
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Categoria não encontrada');

      // Limpar
      await User.destroy({ where: { id: otherUser.id } });
      await Category.destroy({ where: { id: firstUserCategory.id } });
    });
  });
}); 