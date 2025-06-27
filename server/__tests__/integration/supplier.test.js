const request = require('supertest');
const app = require('../../app');
const { User, Supplier, Payable } = require('../../models');
const { createTestUser, cleanAllTestData } = require('./setup');

describe('Supplier Integration Tests', () => {
  let authToken;
  let testUser;
  let testSupplier;

  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    await cleanAllTestData();
    // Criar usuário de teste via API e obter token
    authToken = await createTestUser(app, 'testsupplier@example.com', 'Test User Supplier');
    testUser = await User.findOne({ where: { email: 'testsupplier@example.com' } });
  });

  describe('POST /api/suppliers', () => {
    it('deve criar um novo fornecedor com sucesso', async () => {
      const timestamp = Date.now().toString().slice(-1); // Último dígito
      const cnpjs = ['12345678000195', '12345678000276', '12345678000357', '12345678000438', '12345678000519'];
      const supplierData = {
        name: 'Fornecedor Teste',
        document_type: 'CNPJ',
        document_number: cnpjs[parseInt(timestamp) % cnpjs.length], // CNPJ válido único
        email: 'fornecedor@teste.com',
        phone: '11988888888',
        address: 'Endereço do Fornecedor'
      };

      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(supplierData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('supplier');
      expect(response.body.data.supplier).toHaveProperty('id');
      expect(response.body.data.supplier.name).toBe(supplierData.name);

      const createdSupplier = await Supplier.findOne({
        where: { id: response.body.data.supplier.id }
      });

      expect(createdSupplier).toBeTruthy();
      expect(createdSupplier.name).toBe(supplierData.name);
    });

    it('deve retornar erro ao tentar criar fornecedor com documento inválido', async () => {
      const supplierData = {
        name: 'Fornecedor Teste',
        document_type: 'CNPJ',
        document_number: '12345678901234',
        email: 'fornecedor@teste.com'
      };

      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(supplierData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro ao tentar criar fornecedor sem campos obrigatórios', async () => {
      const supplierData = {
        name: 'Fornecedor Teste',
        email: 'fornecedor@teste.com'
      };

      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(supplierData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/suppliers', () => {
    beforeEach(async () => {
      // Criar fornecedores de teste com CNPJ único
      const timestamp = Date.now().toString().slice(-1);
      const cnpjs = ['12345678000195', '12345678000276', '12345678000357', '12345678000438', '12345678000519'];
      const uniqueCnpj = cnpjs[parseInt(timestamp) % cnpjs.length];
      
      testSupplier = await Supplier.create({
        name: 'Fornecedor Teste',
        document_type: 'CNPJ',
        document_number: uniqueCnpj,
        email: 'fornecedor@teste.com',
        user_id: testUser.id
      });
    });

    it('deve listar todos os fornecedores do usuário', async () => {
      const response = await request(app)
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      // Verificar se o fornecedor criado está na lista
      const foundSupplier = response.body.data.find(s => s.id === testSupplier.id);
      expect(foundSupplier).toBeTruthy();
      expect(foundSupplier.name).toBe('Fornecedor Teste');
    });

    it('deve retornar erro ao tentar listar fornecedores sem autenticação', async () => {
      const response = await request(app)
        .get('/api/suppliers');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/suppliers/:id', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        name: 'Fornecedor Teste',
        document_type: 'CNPJ',
        document_number: '12345678000195',
        email: 'fornecedor@teste.com',
        user_id: testUser.id
      });
    });

    it('deve retornar detalhes do fornecedor', async () => {
      const response = await request(app)
        .get(`/api/suppliers/${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('supplier');
      expect(response.body.data.supplier.name).toBe('Fornecedor Teste');
    });

    it('deve retornar erro ao tentar acessar fornecedor inexistente', async () => {
      const response = await request(app)
        .get('/api/suppliers/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/suppliers/:id', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        name: 'Fornecedor Teste',
        document_type: 'CNPJ',
        document_number: '12345678000195',
        email: 'fornecedor@teste.com',
        user_id: testUser.id
      });
    });

    it('deve atualizar fornecedor com sucesso', async () => {
      const updateData = {
        name: 'Fornecedor Atualizado',
        document_type: 'CNPJ',
        document_number: '12345678000195',
        email: 'novo@email.com'
      };

      const response = await request(app)
        .put(`/api/suppliers/${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('supplier');

      const updatedSupplier = await Supplier.findOne({
        where: { id: testSupplier.id }
      });

      expect(updatedSupplier.name).toBe('Fornecedor Atualizado');
      expect(updatedSupplier.email).toBe('novo@email.com');
    });

    it('deve retornar erro ao tentar atualizar com documento inválido', async () => {
      const updateData = {
        name: 'Fornecedor Atualizado',
        document_type: 'CNPJ',
        document_number: '12345678901234',
        email: 'novo@email.com'
      };

      const response = await request(app)
        .put(`/api/suppliers/${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/suppliers/:id', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        name: 'Fornecedor Teste',
        document_type: 'CNPJ',
        document_number: '12345678000195',
        email: 'fornecedor@teste.com',
        user_id: testUser.id
      });
    });

    it('deve remover fornecedor com sucesso', async () => {
      const response = await request(app)
        .delete(`/api/suppliers/${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('message', 'Fornecedor removido com sucesso');

      const deletedSupplier = await Supplier.findOne({
        where: { id: testSupplier.id }
      });

      expect(deletedSupplier).toBeNull();
    });

    it('deve retornar erro ao tentar remover fornecedor com contas a pagar', async () => {
      // Criar uma conta a pagar associada ao fornecedor
      await Payable.create({
        user_id: testUser.id,
        supplier_id: testSupplier.id,
        description: 'Conta de teste',
        amount: 1000,
        due_date: new Date(),
        status: 'pending'
      });

      const response = await request(app)
        .delete(`/api/suppliers/${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 