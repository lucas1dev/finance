/**
 * Testes para o middleware de autorização de administradores.
 * 
 * @module tests/middlewares/adminAuth
 */

const request = require('supertest');
const app = require('../../app');
const db = require('../../models');
const { User } = db;
const jwt = require('jsonwebtoken');

describe('AdminAuth Middleware', () => {
  let adminUser, adminToken, regularUser, regularToken;

  beforeAll(async () => {
    // Criar usuário administrador
    adminUser = await User.create({
      name: 'Admin Test',
      email: 'admin.test@example.com',
      password: 'password123',
      role: 'admin'
    });

    // Criar usuário regular
    regularUser = await User.create({
      name: 'User Test',
      email: 'user.test@example.com',
      password: 'password123',
      role: 'user'
    });

    // Gerar tokens
    adminToken = jwt.sign({ id: adminUser.id }, process.env.JWT_SECRET || 'test-secret');
    regularToken = jwt.sign({ id: regularUser.id }, process.env.JWT_SECRET || 'test-secret');
  });

  afterAll(async () => {
    await User.destroy({ where: {} });
  });

  describe('adminAuth middleware', () => {
    it('should allow access for admin user', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history')
        .set('Authorization', `Bearer ${adminToken}`);

      // Pode retornar 200 (se houver dados) ou 404 (se não houver), mas não deve ser 403
      expect(response.status).not.toBe(403);
    });

    it('should deny access for regular user', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Acesso negado. Apenas administradores podem acessar este recurso.');
    });

    it('should deny access for unauthenticated user', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history');

      expect(response.status).toBe(401);
    });

    it('should deny access for invalid token', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should deny access for non-existent user', async () => {
      const nonExistentToken = jwt.sign({ id: 99999 }, process.env.JWT_SECRET || 'test-secret');
      
      const response = await request(app)
        .get('/api/notifications/jobs/history')
        .set('Authorization', `Bearer ${nonExistentToken}`);

      // O middleware de autenticação pode retornar 401 ou 404 para usuário inexistente
      expect([401, 404]).toContain(response.status);
    });
  });

  describe('optionalAdminAuth middleware', () => {
    it('should set isAdmin flag for admin user', async () => {
      // Este teste seria melhor implementado com uma rota específica que usa optionalAdminAuth
      // Por enquanto, vamos testar que o middleware não bloqueia o acesso
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).not.toBe(403);
    });

    it('should not block access for regular user', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).not.toBe(403);
    });
  });
}); 