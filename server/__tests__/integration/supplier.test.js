const request = require('supertest');
const app = require('../../app');
const { Customer, CustomerType, Payable, User } = require('../../models');
const { sequelize } = require('../../models');
const { createTestUser } = require('./setup');

let authToken;
let testUser;
let testSupplier;

beforeAll(async () => {
  // Criar usuário de teste e buscar no banco
  authToken = await createTestUser(app);
  testUser = await User.findOne({ where: { email: 'test@example.com' } });
});

beforeEach(async () => {
  // Limpar dados de teste antes de cada teste
  await CustomerType.destroy({ where: {} });
  await Payable.destroy({ where: {} });
  await Customer.destroy({ where: {} });
});

afterAll(async () => {
  // O setup global já cuida do cleanup da conexão
  // Não precisamos fazer cleanup manual aqui
});

describe('Supplier Integration Tests', () => {
  describe('POST /api/suppliers', () => {
    it('deve criar um novo fornecedor com sucesso', async () => {
      const supplierData = {
        name: 'Fornecedor Teste',
        documentType: 'CNPJ',
        documentNumber: '12345678000195',
        email: 'fornecedor@teste.com',
        phone: '11988888888',
        address: 'Endereço do Fornecedor'
      };

      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(supplierData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('Fornecedor criado com sucesso');

      const createdSupplier = await Customer.findOne({
        where: { id: response.body.id },
        include: [{ model: CustomerType, as: 'types' }]
      });

      expect(createdSupplier).toBeTruthy();
      expect(createdSupplier.name).toBe(supplierData.name);
      expect(createdSupplier.types[0].type).toBe('supplier');
    });

    it('deve retornar erro ao tentar criar fornecedor com documento inválido', async () => {
      const supplierData = {
        name: 'Fornecedor Teste',
        documentType: 'CNPJ',
        documentNumber: '12345678901234', // CNPJ inválido
        email: 'fornecedor@teste.com'
      };

      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(supplierData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Documento inválido');
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
      expect(response.body.error).toBe('Nome, tipo e número do documento são obrigatórios');
    });
  });

  describe('GET /api/suppliers', () => {
    beforeEach(async () => {
      // Criar fornecedores de teste
      testSupplier = await Customer.create({
        name: 'Fornecedor Teste',
        document_type: 'CNPJ',
        document_number: '12345678000195',
        email: 'fornecedor@teste.com',
        user_id: testUser.id
      });

      await CustomerType.create({
        customer_id: testSupplier.id,
        type: 'supplier'
      });
    });

    it('deve listar todos os fornecedores do usuário', async () => {
      const response = await request(app)
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Fornecedor Teste');
    });

    it('deve retornar erro ao tentar listar fornecedores sem autenticação', async () => {
      const response = await request(app)
        .get('/api/suppliers');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/suppliers/:id', () => {
    beforeEach(async () => {
      testSupplier = await Customer.create({
        name: 'Fornecedor Teste',
        document_type: 'CNPJ',
        document_number: '12345678000195',
        email: 'fornecedor@teste.com',
        user_id: testUser.id
      });

      await CustomerType.create({
        customer_id: testSupplier.id,
        type: 'supplier'
      });
    });

    it('deve retornar detalhes do fornecedor', async () => {
      const response = await request(app)
        .get(`/api/suppliers/${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Fornecedor Teste');
      expect(response.body.types[0].type).toBe('supplier');
    });

    it('deve retornar erro ao tentar acessar fornecedor inexistente', async () => {
      const response = await request(app)
        .get('/api/suppliers/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Fornecedor não encontrado');
    });
  });

  describe('PUT /api/suppliers/:id', () => {
    beforeEach(async () => {
      testSupplier = await Customer.create({
        name: 'Fornecedor Teste',
        document_type: 'CNPJ',
        document_number: '12345678000195',
        email: 'fornecedor@teste.com',
        user_id: testUser.id
      });

      await CustomerType.create({
        customer_id: testSupplier.id,
        type: 'supplier'
      });
    });

    it('deve atualizar fornecedor com sucesso', async () => {
      const updateData = {
        name: 'Fornecedor Atualizado',
        documentType: 'CNPJ',
        documentNumber: '12345678000195',
        email: 'novo@email.com'
      };

      const response = await request(app)
        .put(`/api/suppliers/${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Fornecedor atualizado com sucesso');

      const updatedSupplier = await Customer.findOne({
        where: { id: testSupplier.id }
      });

      expect(updatedSupplier.name).toBe('Fornecedor Atualizado');
      expect(updatedSupplier.email).toBe('novo@email.com');
    });

    it('deve retornar erro ao tentar atualizar com documento inválido', async () => {
      const updateData = {
        name: 'Fornecedor Atualizado',
        documentType: 'CNPJ',
        documentNumber: '12345678901234', // CNPJ inválido
        email: 'novo@email.com'
      };

      const response = await request(app)
        .put(`/api/suppliers/${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Documento inválido');
    });
  });

  describe('DELETE /api/suppliers/:id', () => {
    beforeEach(async () => {
      testSupplier = await Customer.create({
        name: 'Fornecedor Teste',
        document_type: 'CNPJ',
        document_number: '12345678000195',
        email: 'fornecedor@teste.com',
        user_id: testUser.id
      });

      await CustomerType.create({
        customer_id: testSupplier.id,
        type: 'supplier'
      });
    });

    it('deve remover fornecedor com sucesso', async () => {
      const response = await request(app)
        .delete(`/api/suppliers/${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Fornecedor removido com sucesso');

      const deletedSupplier = await Customer.findOne({
        where: { id: testSupplier.id },
        include: [{ model: CustomerType, as: 'types' }]
      });

      expect(deletedSupplier).toBeNull();
    });

    it('deve retornar erro ao tentar remover fornecedor com contas a pagar', async () => {
      // Criar uma conta a pagar associada ao fornecedor
      await Payable.create({
        user_id: testUser.id,
        customer_id: testSupplier.id,
        description: 'Conta de teste',
        amount: 1000,
        due_date: new Date(),
        status: 'pending'
      });

      const response = await request(app)
        .delete(`/api/suppliers/${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Não é possível excluir um fornecedor com contas a pagar associadas');
    });
  });
}); 