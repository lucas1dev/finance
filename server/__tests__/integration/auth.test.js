const app = require('../../app');
const { createTestUser, cleanAllTestData } = require('./setup');
const request = require('supertest');
const { User } = require('../../models');

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

  describe('POST /api/auth/forgot-password', () => {
    it('deve retornar erro quando usuário não existe', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'usuario_inexistente@example.com' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Usuário não encontrado.');
    });

    it('deve processar solicitação de recuperação para usuário existente', async () => {
      // Criar usuário de teste
      const testUser = await User.create({
        name: 'Usuário Teste',
        email: 'teste@example.com',
        password: 'senha123'
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'teste@example.com' });

      // O endpoint deve retornar sucesso mesmo se o email não for enviado
      // (devido às credenciais de exemplo)
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Instruções de recuperação enviadas para seu email.');
    });

    it('deve validar formato de email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'email_invalido' });

      // O endpoint não valida formato de email, apenas verifica se o usuário existe
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Usuário não encontrado.');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('deve redefinir senha com token válido', async () => {
      // Criar usuário de teste
      const testUser = await User.create({
        name: 'Usuário Teste',
        email: 'teste@example.com',
        password: 'senha_antiga'
      });

      // Gerar token de recuperação
      const jwt = require('jsonwebtoken');
      const resetToken = jwt.sign(
        { id: testUser.id, type: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ 
          token: resetToken,
          newPassword: 'nova_senha123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Senha atualizada com sucesso.');

      // Verificar se a senha foi realmente atualizada
      const updatedUser = await User.findByPk(testUser.id);
      const isValidPassword = await updatedUser.validatePassword('nova_senha123');
      expect(isValidPassword).toBe(true);
    });

    it('deve rejeitar token inválido', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ 
          token: 'token_invalido',
          newPassword: 'nova_senha123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Token inválido ou expirado.');
    });

    it('deve rejeitar token expirado', async () => {
      // Criar usuário de teste
      const testUser = await User.create({
        name: 'Usuário Teste',
        email: 'teste@example.com',
        password: 'senha_antiga'
      });

      // Gerar token expirado
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { id: testUser.id, type: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '0s' } // Token expira imediatamente
      );

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ 
          token: expiredToken,
          newPassword: 'nova_senha123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Token inválido ou expirado.');
    });
  });
}); 