/**
 * Testes de integração para os endpoints de jobs e notificações.
 * Testa endpoints reais da API usando banco de dados real.
 * 
 * @module tests/controllers/notificationController.integration
 */

const request = require('supertest');
const app = require('../../app');
const jwt = require('jsonwebtoken');

describe('NotificationController - Jobs Endpoints (integração)', () => {
  let adminUser, regularUser;
  let sequelize;

  beforeAll(async () => {
    // Importar sequelize corretamente
    const db = require('../../models');
    sequelize = db.sequelize;
    
    // Limpar tabelas
    await sequelize.sync({ force: true });
    
    // Criar usuário administrador
    const { User } = require('../../models');
    adminUser = await User.create({
      name: 'Admin Test',
      email: 'admin.test@example.com',
      password: 'password123',
      role: 'admin',
    });
    adminUser.token = jwt.sign({ id: adminUser.id }, process.env.JWT_SECRET || 'test-secret');
    
    // Criar usuário regular
    regularUser = await User.create({
      name: 'User Test',
      email: 'user.test@example.com',
      password: 'password123',
      role: 'user',
    });
    regularUser.token = jwt.sign({ id: regularUser.id }, process.env.JWT_SECRET || 'test-secret');
  });

  beforeEach(async () => {
    // Limpar execuções de jobs antes de cada teste
    const { JobExecution } = require('../../models');
    await JobExecution.destroy({ where: {} });
  });

  afterAll(async () => {
    const { User, JobExecution } = require('../../models');
    await JobExecution.destroy({ where: {} });
    await User.destroy({ where: {} });
    if (sequelize && sequelize.close) {
      await sequelize.close();
    }
  });

  describe('GET /notifications/jobs/history', () => {
    it('should return job history for admin user', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('history');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should filter by job name', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history?jobType=payment_check')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history?status=success')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/history');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /notifications/jobs/stats', () => {
    it('should return job statistics for admin user', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/stats')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalExecutions');
      expect(response.body.data).toHaveProperty('successRate');
      expect(response.body.data).toHaveProperty('avgDuration');
      expect(response.body.data).toHaveProperty('successExecutions');
      expect(response.body.data).toHaveProperty('errorExecutions');
    });

    it('should filter by days parameter', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/stats?period=7d')
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(response.status).toBe(200);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/stats')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app)
        .get('/api/notifications/jobs/stats');

      expect(response.status).toBe(401);
    });
  });
}); 