/**
 * Testes para o controller de auditoria.
 * 
 * @module __tests__/controllers/auditController.test
 */

const request = require('supertest');
const app = require('../../app');
const { AuditLog, User } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Audit Controller', () => {
  let adminToken, regularToken, adminUser, regularUser, testAuditLog;

  beforeAll(async () => {
    // Criar usuários diretamente
    const adminPassword = await bcrypt.hash('password123', 10);
    const regularPassword = await bcrypt.hash('password123', 10);

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: adminPassword,
      role: 'admin'
    });

    regularUser = await User.create({
      name: 'Regular User',
      email: 'user@test.com',
      password: regularPassword,
      role: 'user'
    });

    // Gerar tokens
    adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    regularToken = jwt.sign(
      { id: regularUser.id, email: regularUser.email, role: regularUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Criar log de auditoria de teste
    testAuditLog = await AuditLog.create({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: 'test_action',
      resource: 'test_resource',
      status: 'success',
      details: 'Test audit log',
      ipAddress: '127.0.0.1',
      userAgent: 'Test User Agent'
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await AuditLog.destroy({ where: {} });
    await User.destroy({ where: { email: { [require('sequelize').Op.in]: ['admin@test.com', 'user@test.com'] } } });
  });

  describe('GET /api/audit/logs', () => {
    it('should return audit logs with pagination', async () => {
      const response = await request(app)
        .get('/api/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('logs');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('totalPages');
    });

    it('should filter audit logs by user ID', async () => {
      const response = await request(app)
        .get(`/api/audit/logs?userId=${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs).toBeInstanceOf(Array);
      expect(response.body.data.logs.every(log => log.userId === adminUser.id)).toBe(true);
    });

    it('should filter audit logs by action', async () => {
      const response = await request(app)
        .get('/api/audit/logs?action=test_action')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs).toBeInstanceOf(Array);
      expect(response.body.data.logs.every(log => log.action === 'test_action')).toBe(true);
    });

    it('should filter audit logs by resource', async () => {
      const response = await request(app)
        .get('/api/audit/logs?resource=test_resource')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs).toBeInstanceOf(Array);
      expect(response.body.data.logs.every(log => log.resource === 'test_resource')).toBe(true);
    });

    it('should filter audit logs by status', async () => {
      const response = await request(app)
        .get('/api/audit/logs?status=success')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs).toBeInstanceOf(Array);
      expect(response.body.data.logs.every(log => log.status === 'success')).toBe(true);
    });

    it('should filter audit logs by date range', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/audit/logs?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs).toBeInstanceOf(Array);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/audit/logs');

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/audit/logs')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/audit/stats', () => {
    it('should return audit statistics for default period (30d)', async () => {
      const response = await request(app)
        .get('/api/audit/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('period', '30d');
      expect(response.body.data).toHaveProperty('totalActions');
      expect(response.body.data).toHaveProperty('successActions');
      expect(response.body.data).toHaveProperty('failureActions');
      expect(response.body.data).toHaveProperty('successRate');
      expect(response.body.data).toHaveProperty('uniqueUsers');
      expect(response.body.data).toHaveProperty('actionsByType');
      expect(response.body.data).toHaveProperty('resourcesByType');
    });

    it('should return audit statistics for 7 days period', async () => {
      const response = await request(app)
        .get('/api/audit/stats?period=7d')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('period', '7d');
    });

    it('should return audit statistics for 90 days period', async () => {
      const response = await request(app)
        .get('/api/audit/stats?period=90d')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('period', '90d');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/audit/stats');

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/audit/stats')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/audit/logs/:id', () => {
    it('should return audit log details', async () => {
      const response = await request(app)
        .get(`/api/audit/logs/${testAuditLog.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('id', testAuditLog.id);
      expect(response.body.data).toHaveProperty('action', 'test_action');
      expect(response.body.data).toHaveProperty('resource', 'test_resource');
      expect(response.body.data).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should return 404 for non-existent audit log', async () => {
      const response = await request(app)
        .get('/api/audit/logs/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Log de auditoria não encontrado');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get(`/api/audit/logs/${testAuditLog.id}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`/api/audit/logs/${testAuditLog.id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/audit/users/:userId/logs', () => {
    it('should return audit logs for specific user', async () => {
      const response = await request(app)
        .get(`/api/audit/users/${adminUser.id}/logs`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('logs');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.logs.every(log => log.userId === adminUser.id)).toBe(true);
    });

    it('should return empty logs for user with no audit history', async () => {
      const response = await request(app)
        .get(`/api/audit/users/${regularUser.id}/logs`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs).toHaveLength(0);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get(`/api/audit/users/${adminUser.id}/logs`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`/api/audit/users/${adminUser.id}/logs`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock AuditLog.findAndCountAll to throw an error
      const originalFindAndCountAll = AuditLog.findAndCountAll;
      AuditLog.findAndCountAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Erro interno do servidor');

      // Restore original method
      AuditLog.findAndCountAll = originalFindAndCountAll;
    });

    it('should handle invalid date parameters', async () => {
      const response = await request(app)
        .get('/api/audit/logs?startDate=invalid-date')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200); // Should not crash, just return empty results
    });
  });
}); 