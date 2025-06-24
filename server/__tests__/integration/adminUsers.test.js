const request = require('supertest');
const app = require('../../app');
const { User, Transaction, Account, Notification } = require('../../models');
const { createTestUser, cleanAllTestData } = require('./setup');

describe('Admin Users Integration Tests', () => {
  let adminToken, userToken, adminUser, regularUser, testUser;

  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    const timestamp = Date.now();
    
    // Criar usuário administrador
    adminUser = await User.create({
      name: 'Admin User',
      email: `admin${timestamp}@test.com`,
      password: 'password123',
      role: 'admin',
      active: true
    });

    // Criar usuário regular
    regularUser = await User.create({
      name: 'Regular User',
      email: `user${timestamp}@test.com`,
      password: 'password123',
      role: 'user',
      active: true
    });

    // Criar usuário de teste
    testUser = await User.create({
      name: 'Test User',
      email: `test${timestamp}@test.com`,
      password: 'password123',
      role: 'user',
      active: true
    });

    // Fazer login como admin
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: `admin${timestamp}@test.com`,
        password: 'password123'
      });
    adminToken = adminLoginResponse.body.token;

    // Fazer login como usuário regular
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: `user${timestamp}@test.com`,
        password: 'password123'
      });
    userToken = userLoginResponse.body.token;
  });

  describe('GET /api/admin/users', () => {
    it('should return list of users for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('pages');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/admin/users');

      expect(response.status).toBe(401);
    });

    it('should filter users by status', async () => {
      // Desativar um usuário
      await testUser.update({ active: false });

      const response = await request(app)
        .get('/api/admin/users?status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users.every(user => user.status === 'active')).toBe(true);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=user')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users.every(user => user.role === 'user')).toBe(true);
    });

    it('should search users by name or email', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=test')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users.some(user => 
        user.name.toLowerCase().includes('test') || 
        user.email.toLowerCase().includes('test')
      )).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });
  });

  describe('GET /api/admin/users/stats', () => {
    it('should return user statistics for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('inactive');
      expect(response.body).toHaveProperty('newUsers');
      expect(response.body).toHaveProperty('adminUsers');
      expect(response.body).toHaveProperty('regularUsers');
      expect(response.body).toHaveProperty('recentActivityUsers');
      expect(response.body).toHaveProperty('growthRate');
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('periodStart');
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.active).toBe('number');
      expect(typeof response.body.inactive).toBe('number');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/admin/users/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should handle different periods', async () => {
      const periods = ['week', 'month', 'quarter', 'year'];
      
      for (const period of periods) {
        const response = await request(app)
          .get(`/api/admin/users/stats?period=${period}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.period).toBe(period);
      }
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return user details for admin', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('transactions');
      expect(response.body.stats).toHaveProperty('accounts');
      expect(response.body.stats).toHaveProperty('notifications');
      expect(response.body.id).toBe(testUser.id);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/admin/users/:id/status', () => {
    it('should update user status for admin', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('newStatus');
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.newStatus).toBe('inactive');

      // Verificar se o status foi atualizado no banco
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.active).toBe(false);
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('should return 400 when admin tries to deactivate themselves', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${adminUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/admin/users/99999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' });

      expect(response.status).toBe(404);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'inactive' });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('should update user role for admin', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('newRole');
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.newRole).toBe('admin');

      // Verificar se o role foi atualizado no banco
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.role).toBe('admin');
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('should return 400 when admin tries to change their own role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${adminUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/admin/users/99999/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(response.status).toBe(404);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user without associated data', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('userId');
      expect(response.body.userId).toBe(testUser.id);

      // Verificar se o usuário foi excluído
      const deletedUser = await User.findByPk(testUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should return 400 when admin tries to delete themselves', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 400 when user has associated data', async () => {
      // Criar dados associados ao usuário
      await Account.create({
        user_id: testUser.id,
        bank_name: 'Test Bank',
        account_type: 'checking',
        balance: 1000
      });

      const response = await request(app)
        .delete(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('accounts');
      expect(response.body.details.accounts).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
}); 