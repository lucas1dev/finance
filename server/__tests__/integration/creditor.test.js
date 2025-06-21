/**
 * Testes de integração para as rotas de Credores
 */
const request = require('supertest');
const app = require('../../app');
const { Creditor, User } = require('../../models');
const { createTestUser, cleanAllTestData } = require('./setup');

describe('Creditor Routes Integration', () => {
  let authToken, testUser, testCreditor;

  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    // Limpar dados relevantes
    await Creditor.destroy({ where: {} });
    await User.destroy({ where: { email: 'testcreditor@example.com' } });
    
    // Criar usuário de teste via API e obter token
    authToken = await createTestUser(app, 'testcreditor@example.com', 'Test User Creditor');
    testUser = await User.findOne({ where: { email: 'testcreditor@example.com' } });
  });

  describe('POST /api/creditors', () => {
    it('deve criar um novo credor com dados válidos', async () => {
      const creditorData = {
        name: 'Banco Teste',
        document_type: 'CNPJ',
        document_number: '11.222.333/0001-81',
        address: 'Rua Teste, 123',
        phone: '(11) 99999-9999',
        email: 'contato@bancoteste.com'
      };

      const response = await request(app)
        .post('/api/creditors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(creditorData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Credor criado com sucesso');
      expect(response.body).toHaveProperty('creditor');
      expect(response.body.creditor.name).toBe(creditorData.name);
      expect(response.body.creditor.document_number).toBe(creditorData.document_number);
      expect(response.body.creditor.user_id).toBe(testUser.id);
    }, 30000);

    it('deve retornar erro 400 para dados inválidos', async () => {
      const invalidData = {
        name: '',
        document_type: 'CNPJ',
        document_number: '123',
        address: 'Rua Teste, 123'
      };

      const response = await request(app)
        .post('/api/creditors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('errors');
    }, 30000);

    it('deve retornar erro 401 sem autenticação', async () => {
      const creditorData = {
        name: 'Banco Teste',
        document_type: 'CNPJ',
        document_number: '11.222.333/0001-81',
        address: 'Rua Teste, 123'
      };

      const response = await request(app)
        .post('/api/creditors')
        .send(creditorData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/creditors', () => {
    beforeEach(async () => {
      // Criar credores de teste
      await Creditor.create({
        name: 'Banco A',
        document_type: 'CNPJ',
        document_number: '11.222.333/0001-81',
        address: 'Rua A, 123',
        user_id: testUser.id
      });

      await Creditor.create({
        name: 'Banco B',
        document_type: 'CNPJ',
        document_number: '22.333.444/0001-92',
        address: 'Rua B, 456',
        user_id: testUser.id
      });
    });

    it('deve listar credores com paginação', async () => {
      const response = await request(app)
        .get('/api/creditors?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('creditors');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.creditors).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    }, 10000);

    it('deve aplicar filtros corretamente', async () => {
      const response = await request(app)
        .get('/api/creditors?name=Banco A')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.creditors).toHaveLength(1);
      expect(response.body.creditors[0].name).toBe('Banco A');
    });

    it('deve retornar erro 401 sem autenticação', async () => {
      const response = await request(app)
        .get('/api/creditors');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/creditors/search', () => {
    beforeEach(async () => {
      await Creditor.create({
        name: 'Banco Teste',
        document_type: 'CNPJ',
        document_number: '11.222.333/0001-81',
        address: 'Rua Teste, 123',
        user_id: testUser.id
      });
    });

    it('deve buscar credores por termo', async () => {
      const response = await request(app)
        .get('/api/creditors/search?q=Teste')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('creditors');
      expect(response.body.creditors).toHaveLength(1);
      expect(response.body.creditors[0].name).toBe('Banco Teste');
    });

    it('deve retornar lista vazia para termo não encontrado', async () => {
      const response = await request(app)
        .get('/api/creditors/search?q=Inexistente')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.creditors).toHaveLength(0);
    });

    it('deve retornar lista vazia para termo muito curto', async () => {
      const response = await request(app)
        .get('/api/creditors/search?q=a')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.creditors).toHaveLength(0);
    });
  });

  describe('GET /api/creditors/:id', () => {
    beforeEach(async () => {
      testCreditor = await Creditor.create({
        name: 'Banco Teste',
        document_type: 'CNPJ',
        document_number: '11.222.333/0001-81',
        address: 'Rua Teste, 123',
        user_id: testUser.id
      });
    });

    it('deve retornar um credor específico', async () => {
      const response = await request(app)
        .get(`/api/creditors/${testCreditor.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('creditor');
      expect(response.body.creditor.id).toBe(testCreditor.id);
      expect(response.body.creditor.name).toBe('Banco Teste');
    });

    it('deve retornar erro 404 para credor inexistente', async () => {
      const response = await request(app)
        .get('/api/creditors/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Credor não encontrado');
    });

    it('deve retornar erro 401 sem autenticação', async () => {
      const response = await request(app)
        .get(`/api/creditors/${testCreditor.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/creditors/:id', () => {
    beforeEach(async () => {
      testCreditor = await Creditor.create({
        name: 'Banco Original',
        document_type: 'CNPJ',
        document_number: '11.222.333/0001-81',
        address: 'Rua Original, 123',
        user_id: testUser.id
      });
    });

    it('deve atualizar um credor com dados válidos', async () => {
      const updateData = {
        name: 'Banco Atualizado',
        address: 'Rua Nova, 456',
        phone: '(11) 88888-8888'
      };

      const response = await request(app)
        .put(`/api/creditors/${testCreditor.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Credor atualizado com sucesso');
      expect(response.body).toHaveProperty('creditor');
      expect(response.body.creditor.name).toBe(updateData.name);
      expect(response.body.creditor.address).toBe(updateData.address);
      expect(response.body.creditor.phone).toBe(updateData.phone);
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const invalidData = {
        name: '',
        document_number: '123'
      };

      const response = await request(app)
        .put(`/api/creditors/${testCreditor.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('errors');
    });

    it('deve retornar erro 404 para credor inexistente', async () => {
      const updateData = {
        name: 'Banco Atualizado'
      };

      const response = await request(app)
        .put('/api/creditors/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Credor não encontrado');
    });

    it('deve retornar erro 401 sem autenticação', async () => {
      const updateData = {
        name: 'Banco Atualizado'
      };

      const response = await request(app)
        .put(`/api/creditors/${testCreditor.id}`)
        .send(updateData);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/creditors/:id', () => {
    beforeEach(async () => {
      testCreditor = await Creditor.create({
        name: 'Banco para Deletar',
        document_type: 'CNPJ',
        document_number: '11.222.333/0001-81',
        address: 'Rua Deletar, 123',
        user_id: testUser.id
      });
    });

    it('deve deletar um credor com sucesso', async () => {
      const response = await request(app)
        .delete(`/api/creditors/${testCreditor.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Credor removido com sucesso');

      // Verificar se foi realmente deletado
      const deletedCreditor = await Creditor.findByPk(testCreditor.id);
      expect(deletedCreditor).toBeNull();
    });

    it('deve retornar erro 404 para credor inexistente', async () => {
      const response = await request(app)
        .delete('/api/creditors/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Credor não encontrado');
    });

    it('deve retornar erro 401 sem autenticação', async () => {
      const response = await request(app)
        .delete(`/api/creditors/${testCreditor.id}`);

      expect(response.status).toBe(401);
    });
  });
}); 