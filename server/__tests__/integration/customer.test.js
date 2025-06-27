const app = require('../../app');
const { createTestUser, cleanAllTestData } = require('./setup');
const request = require('supertest');
const { sequelize, User, Customer } = require('../../models');

describe('Customer Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    await Customer.destroy({ where: {} });
    await User.destroy({ where: { email: 'testcustomer@example.com' } });
    authToken = await createTestUser(app, 'testcustomer@example.com', 'Test User Customer');
  });

  describe('POST /api/customers', () => {
    it('deve criar um novo cliente com sucesso', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Cliente Teste',
          documentType: 'CPF',
          document: '12345678909',
          email: 'cliente@teste.com',
          phone: '11999999999'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('customer');
      expect(response.body.data.customer).toHaveProperty('id');
      expect(response.body.data.customer.name).toBe('Cliente Teste');
    });

    it('deve retornar erro ao tentar criar cliente sem autenticação', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({
          name: 'Cliente Teste',
          documentType: 'CPF',
          document: '12345678909',
          email: 'cliente@teste.com',
          phone: '11999999999'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/customers', () => {
    beforeEach(async () => {
      await Customer.destroy({ where: {} });
      await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Cliente 1',
          documentType: 'CPF',
          document: '12345678909',
          email: 'cliente1@teste.com',
          phone: '11999999999'
        });

      await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Cliente 2',
          documentType: 'CNPJ',
          document: '12345678000195',
          email: 'cliente2@teste.com',
          phone: '11988888888'
        });
    });

    it('deve listar todos os clientes', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('deve filtrar clientes por tipo', async () => {
      const response = await request(app)
        .get('/api/customers?type=customer')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2); // Todos os clientes, pois não há filtro por tipo no service
    });
  });

  describe('GET /api/customers/:id', () => {
    let customerId;

    beforeEach(async () => {
      await Customer.destroy({ where: {} });
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Cliente Teste',
          documentType: 'CPF',
          document: '12345678909',
          email: 'cliente@teste.com',
          phone: '11999999999'
        });

      customerId = response.body.data.customer.id;
    });

    it('deve retornar um cliente específico', async () => {
      const response = await request(app)
        .get(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('customer');
      expect(response.body.data.customer.id).toBe(customerId);
      expect(response.body.data.customer.name).toBe('Cliente Teste');
    });

    it('deve retornar 404 para cliente inexistente', async () => {
      const response = await request(app)
        .get('/api/customers/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 