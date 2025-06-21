/**
 * Testes para o controller de integridade de dados.
 * 
 * @module __tests__/controllers/dataIntegrityController.test
 */

const request = require('supertest');
const app = require('../../app');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

describe('Data Integrity Controller', () => {
  let adminToken, adminUser;

  beforeAll(async () => {
    // Criar usuário admin
    const adminPassword = await bcrypt.hash('password123', 10);
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: adminPassword,
      role: 'admin'
    });

    // Gerar token admin
    adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Limpar dados de teste
    await User.destroy({ where: { email: 'admin@test.com' } });
  });

  describe('GET /api/data-integrity/stats', () => {
    it('should return integrity statistics', async () => {
      const response = await request(app)
        .get('/api/data-integrity/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('notifications');
      expect(response.body.data).toHaveProperty('transactions');
      expect(response.body.data).toHaveProperty('users');
      expect(response.body).toHaveProperty('message', 'Estatísticas de integridade obtidas com sucesso');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/data-integrity/stats');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/data-integrity/check/orphaned-notifications', () => {
    it('should check orphaned notifications', async () => {
      const response = await request(app)
        .post('/api/data-integrity/check/orphaned-notifications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('type', 'orphaned_notifications');
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.message).toContain('problemas encontrados');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/data-integrity/check/orphaned-notifications');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/data-integrity/check/duplicate-notifications', () => {
    it('should check duplicate notifications', async () => {
      const response = await request(app)
        .post('/api/data-integrity/check/duplicate-notifications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('type', 'duplicate_notifications');
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.message).toContain('problemas encontrados');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/data-integrity/check/duplicate-notifications');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/data-integrity/history', () => {
    it('should return integrity check history', async () => {
      const response = await request(app)
        .get('/api/data-integrity/history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('checks');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data.checks).toBeInstanceOf(Array);
      expect(response.body.data.checks).toHaveLength(2);
      expect(response.body.data.summary).toHaveProperty('totalChecks', 2);
      expect(response.body.data.summary).toHaveProperty('averageIssues', 1.5);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/data-integrity/history');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/data-integrity/config', () => {
    it('should return integrity configuration', async () => {
      const response = await request(app)
        .get('/api/data-integrity/config')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('autoFix');
      expect(response.body.data).toHaveProperty('sendAlert');
      expect(response.body.data).toHaveProperty('schedule');
      expect(response.body.data).toHaveProperty('alertThreshold');
      expect(response.body.data).toHaveProperty('criticalThreshold');
      expect(typeof response.body.data.autoFix).toBe('boolean');
      expect(typeof response.body.data.sendAlert).toBe('boolean');
      expect(typeof response.body.data.schedule).toBe('string');
      expect(typeof response.body.data.alertThreshold).toBe('number');
      expect(typeof response.body.data.criticalThreshold).toBe('number');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/data-integrity/config');

      expect(response.status).toBe(401);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 for non-admin users (user not found)', async () => {
      // Criar token de usuário regular que não existe no banco
      const regularToken = jwt.sign(
        { id: 999, email: 'user@test.com', role: 'user' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/data-integrity/stats')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(401); // 401 porque o usuário não existe no banco
    });

    it('should return 401 for invalid tokens', async () => {
      const response = await request(app)
        .get('/api/data-integrity/stats')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
}); 