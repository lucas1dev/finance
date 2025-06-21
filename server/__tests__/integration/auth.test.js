const app = require('../../app');
const { createTestUser, cleanAllTestData } = require('./setup');
const request = require('supertest');

// Não é necessário token global para estes testes

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    await cleanAllTestData();
  });

  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const uniqueEmail = `test${Date.now()}@example.com`;
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: uniqueEmail,
          password: 'password123',
          companyName: 'Test Company',
          document: '12345678901234'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(uniqueEmail);
    });

    it('deve retornar erro ao tentar registrar com email já existente', async () => {
      // Primeiro registro
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          companyName: 'Test Company',
          document: '12345678901234'
        });

      // Tentativa de registro com mesmo email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'test@example.com',
          password: 'password123',
          companyName: 'Another Company',
          document: '98765432109876'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Limpar e criar usuário para teste de login
      await cleanAllTestData();
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          companyName: 'Test Company',
          document: '12345678901234'
        });
    });

    it('deve fazer login com sucesso', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('deve retornar erro com credenciais inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 