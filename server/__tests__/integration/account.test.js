const request = require('supertest');
const app = require('../../app');
const { Account, User } = require('../../models');

describe('Account Integration Tests', () => {
  let authToken;
  let testUser;
  let testAccount;

  beforeAll(async () => {
    // Criar usuário de teste
    testUser = await User.create({
      name: 'Test User Account',
      email: 'testaccount@example.com',
      password: 'password123',
      two_factor_secret: 'test-secret'
    });

    // Fazer login para obter token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testaccount@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await Account.destroy({ where: { user_id: testUser.id } });
    await User.destroy({ where: { id: testUser.id } });
  });

  describe('POST /api/accounts', () => {
    it('should create a new account', async () => {
      const accountData = {
        bank_name: 'Test Bank',
        account_type: 'checking',
        balance: 1000.00,
        description: 'Test account'
      };

      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(accountData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Conta criada com sucesso');
      expect(response.body).toHaveProperty('accountId');
      expect(typeof response.body.accountId).toBe('number');

      testAccount = await Account.findByPk(response.body.accountId);
      expect(testAccount.bank_name).toBe('Test Bank');
      expect(testAccount.account_type).toBe('checking');
      expect(Number(testAccount.balance)).toBeCloseTo(1000.00, 1);
      expect(testAccount.user_id).toBe(testUser.id);
    });

    it('should create a savings account', async () => {
      const accountData = {
        bank_name: 'Savings Bank',
        account_type: 'savings',
        balance: 5000.00,
        description: 'Savings account'
      };

      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(accountData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accountId');

      const account = await Account.findByPk(response.body.accountId);
      expect(account.account_type).toBe('savings');
      expect(Number(account.balance)).toBeCloseTo(5000.00, 1);
    });

    it('should create account with zero balance', async () => {
      const accountData = {
        bank_name: 'Zero Bank',
        account_type: 'checking',
        balance: 0,
        description: 'Zero balance account'
      };

      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(accountData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accountId');

      const account = await Account.findByPk(response.body.accountId);
      expect(Number(account.balance)).toBeCloseTo(0.00, 1);
    });
  });

  describe('GET /api/accounts', () => {
    it('should list all accounts for the user', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accounts');
      expect(response.body).toHaveProperty('totalBalance');
      expect(Array.isArray(response.body.accounts)).toBe(true);
      expect(response.body.accounts.length).toBeGreaterThan(0);

      // Verificar se todas as contas pertencem ao usuário
      response.body.accounts.forEach(account => {
        expect(account).toHaveProperty('id');
        expect(account).toHaveProperty('bank_name');
        expect(account).toHaveProperty('account_type');
        expect(account).toHaveProperty('balance');
        expect(account).toHaveProperty('description');
        expect(account).toHaveProperty('user_id', testUser.id);
      });

      // Verificar se o saldo total está correto
      const expectedTotal = response.body.accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
      expect(response.body.totalBalance).toBe(expectedTotal);
    });

    it('should return empty array for user with no accounts', async () => {
      // Criar outro usuário sem contas
      const otherUser = await User.create({
        name: 'Other User Account',
        email: 'otheruseraccount@example.com',
        password: 'password123',
        two_factor_secret: 'test-secret'
      });

      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'otheruseraccount@example.com',
          password: 'password123'
        });

      const otherAuthToken = otherLoginResponse.body.token;

      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${otherAuthToken}`);

      expect(response.status).toBe(200);
      expect(response.body.accounts).toEqual([]);
      expect(response.body.totalBalance).toBe(0);

      // Limpar
      await User.destroy({ where: { id: otherUser.id } });
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('should get a specific account', async () => {
      const response = await request(app)
        .get(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testAccount.id);
      expect(response.body).toHaveProperty('bank_name', 'Test Bank');
      expect(response.body).toHaveProperty('account_type', 'checking');
      expect(Number(response.body.balance)).toBeCloseTo(1000.00, 1);
      expect(response.body).toHaveProperty('user_id', testUser.id);
    });

    it('should return 404 for non-existent account', async () => {
      const response = await request(app)
        .get('/api/accounts/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Conta não encontrada');
    });

    it('should return 403 for account belonging to another user', async () => {
      // Criar outro usuário com conta
      const otherUser = await User.create({
        name: 'Other User Account 2',
        email: 'otheruseraccount2@example.com',
        password: 'password123',
        two_factor_secret: 'test-secret'
      });

      const otherAccount = await Account.create({
        user_id: otherUser.id,
        bank_name: 'Other Bank',
        account_type: 'checking',
        balance: 100.00,
        description: 'Other user account'
      });

      const response = await request(app)
        .get(`/api/accounts/${otherAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Acesso negado');

      // Limpar
      await Account.destroy({ where: { id: otherAccount.id } });
      await User.destroy({ where: { id: otherUser.id } });
    });
  });

  describe('PUT /api/accounts/:id', () => {
    it('should update an account', async () => {
      const updateData = {
        bank_name: 'Updated Bank',
        account_type: 'savings',
        balance: 2000.00,
        description: 'Updated account description'
      };

      const response = await request(app)
        .put(`/api/accounts/${testAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Conta atualizada com sucesso');

      // Verificar se foi realmente atualizada
      const updatedAccount = await Account.findByPk(testAccount.id);
      expect(updatedAccount.bank_name).toBe('Updated Bank');
      expect(updatedAccount.account_type).toBe('savings');
      expect(Number(updatedAccount.balance)).toBeCloseTo(2000.00, 1);
      expect(updatedAccount.description).toBe('Updated account description');
    });

    it('should return 404 for non-existent account', async () => {
      const updateData = {
        bank_name: 'Non-existent Bank',
        account_type: 'checking',
        balance: 100.00
      };

      const response = await request(app)
        .put('/api/accounts/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Conta não encontrada');
    });

    it('should return 403 for account belonging to another user', async () => {
      // Criar outro usuário com conta
      const otherUser = await User.create({
        name: 'Other User Account 3',
        email: 'otheruseraccount3@example.com',
        password: 'password123',
        two_factor_secret: 'test-secret'
      });

      const otherAccount = await Account.create({
        user_id: otherUser.id,
        bank_name: 'Other Bank',
        account_type: 'checking',
        balance: 100.00,
        description: 'Other user account'
      });

      const updateData = {
        bank_name: 'Unauthorized Update',
        account_type: 'savings',
        balance: 500.00
      };

      const response = await request(app)
        .put(`/api/accounts/${otherAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Acesso negado');

      // Limpar
      await Account.destroy({ where: { id: otherAccount.id } });
      await User.destroy({ where: { id: otherUser.id } });
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('should delete an account', async () => {
      // Criar uma conta para deletar
      const accountToDelete = await Account.create({
        user_id: testUser.id,
        bank_name: 'Account to Delete',
        account_type: 'checking',
        balance: 100.00,
        description: 'Account to be deleted'
      });

      const response = await request(app)
        .delete(`/api/accounts/${accountToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Conta excluída com sucesso');

      // Verificar se foi realmente deletada
      const deletedAccount = await Account.findByPk(accountToDelete.id);
      expect(deletedAccount).toBeNull();
    });

    it('should return 404 for non-existent account', async () => {
      const response = await request(app)
        .delete('/api/accounts/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Conta não encontrada');
    });

    it('should return 403 for account belonging to another user', async () => {
      // Criar outro usuário com conta
      const otherUser = await User.create({
        name: 'Other User Account 4',
        email: 'otheruseraccount4@example.com',
        password: 'password123',
        two_factor_secret: 'test-secret'
      });

      const otherAccount = await Account.create({
        user_id: otherUser.id,
        bank_name: 'Other Bank',
        account_type: 'checking',
        balance: 100.00,
        description: 'Other user account'
      });

      const response = await request(app)
        .delete(`/api/accounts/${otherAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Acesso negado');

      // Limpar
      await Account.destroy({ where: { id: otherAccount.id } });
      await User.destroy({ where: { id: otherUser.id } });
    });
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/accounts');

      expect(response.status).toBe(401);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
}); 