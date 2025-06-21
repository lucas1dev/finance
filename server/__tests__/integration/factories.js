/**
 * Factories para testes de integração
 * Garante criação correta de dados relacionados e evita problemas de foreign key
 */

const bcrypt = require('bcryptjs');

/**
 * Factory para criar usuário de teste
 * @param {Object} overrides - Dados para sobrescrever os padrões
 * @returns {Promise<Object>} Usuário criado
 */
const createTestUser = async (overrides = {}) => {
  const { User } = require('../../models');
  
  const defaultData = {
    name: `Test User ${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    password: await bcrypt.hash('password123', 10),
    role: 'user',
  };

  const userData = { ...defaultData, ...overrides };
  return await User.create(userData);
};

/**
 * Factory para criar categoria de teste
 * @param {Object} overrides - Dados para sobrescrever os padrões
 * @returns {Promise<Object>} Categoria criada
 */
const createTestCategory = async (overrides = {}) => {
  const { Category } = require('../../models');
  
  const defaultData = {
    name: `Test Category ${Date.now()}`,
    type: 'expense',
    user_id: overrides.user_id || 1,
    color: '#FF0000',
  };

  const categoryData = { ...defaultData, ...overrides };
  return await Category.create(categoryData);
};

/**
 * Factory para criar conta de teste
 * @param {Object} overrides - Dados para sobrescrever os padrões
 * @returns {Promise<Object>} Conta criada
 */
const createTestAccount = async (overrides = {}) => {
  const { Account } = require('../../models');
  
  const defaultData = {
    name: `Test Account ${Date.now()}`,
    bank_name: 'Banco Teste',
    account_type: 'checking',
    balance: 1000.00,
    user_id: overrides.user_id || 1,
    is_active: true,
  };

  const accountData = { ...defaultData, ...overrides };
  return await Account.create(accountData);
};

/**
 * Factory para criar fornecedor de teste
 * @param {Object} overrides - Dados para sobrescrever os padrões
 * @returns {Promise<Object>} Fornecedor criado
 */
const createTestSupplier = async (overrides = {}) => {
  const { Supplier } = require('../../models');
  
  const defaultData = {
    name: `Test Supplier ${Date.now()}`,
    document_type: 'CNPJ',
    document_number: '12345678000190',
    email: `supplier-${Date.now()}@example.com`,
    phone: '(11) 99999-9999',
    address: 'Rua Teste, 123',
    user_id: overrides.user_id || 1,
  };

  const supplierData = { ...defaultData, ...overrides };
  return await Supplier.create(supplierData);
};

/**
 * Factory para criar credor de teste
 * @param {Object} overrides - Dados para sobrescrever os padrões
 * @returns {Promise<Object>} Credor criado
 */
const createTestCreditor = async (overrides = {}) => {
  const { Creditor } = require('../../models');
  
  const defaultData = {
    name: `Test Creditor ${Date.now()}`,
    document_type: 'CNPJ',
    document_number: '98765432000198',
    email: `creditor-${Date.now()}@example.com`,
    phone: '(11) 88888-8888',
    address: 'Av. Credor, 456',
    user_id: overrides.user_id || 1,
  };

  const creditorData = { ...defaultData, ...overrides };
  return await Creditor.create(creditorData);
};

/**
 * Factory para criar financiamento de teste
 * @param {Object} overrides - Dados para sobrescrever os padrões
 * @returns {Promise<Object>} Financiamento criado
 */
const createTestFinancing = async (overrides = {}) => {
  const { Financing } = require('../../models');
  
  const defaultData = {
    description: `Test Financing ${Date.now()}`,
    financing_type: 'emprestimo_pessoal',
    amount: 100000.00,
    total_amount: 100000.00,
    interest_rate: 0.01,
    term_months: 120,
    payment_method: 'boleto', // valor válido
    monthly_payment: 1000.00,
    creditor_id: overrides.creditor_id || 1,
    account_id: overrides.account_id || 1,
    user_id: overrides.user_id || 1,
    start_date: new Date(),
    is_active: true,
    status: 'ativo',
    current_balance: 100000.00,
    amortization_method: 'SAC',
  };

  const financingData = { ...defaultData, ...overrides };
  return await Financing.create(financingData);
};

/**
 * Factory para criar conta fixa de teste
 * @param {Object} overrides - Dados para sobrescrever os padrões
 * @returns {Promise<Object>} Conta fixa criada
 */
const createTestFixedAccount = async (overrides = {}) => {
  const { FixedAccount } = require('../../models');
  
  const defaultData = {
    description: `Test Fixed Account ${Date.now()}`,
    amount: 1500.00,
    periodicity: 'monthly',
    due_day: 10,
    start_date: new Date(),
    next_due_date: new Date(),
    category_id: overrides.category_id || 1,
    supplier_id: overrides.supplier_id || 1,
    user_id: overrides.user_id || 1,
    is_active: true,
  };

  const fixedAccountData = { ...defaultData, ...overrides };
  return await FixedAccount.create(fixedAccountData);
};

/**
 * Factory para criar investimento de teste
 * @param {Object} overrides - Dados para sobrescrever os padrões
 * @returns {Promise<Object>} Investimento criado
 */
const createTestInvestment = async (overrides = {}) => {
  const { Investment } = require('../../models');
  
  const defaultData = {
    name: `Test Investment ${Date.now()}`,
    investment_type: 'acoes',
    asset_name: 'Ação XPTO3',
    invested_amount: 5000.00,
    quantity: 100,
    operation_date: new Date(),
    operation_type: 'compra',
    amount: 5000.00,
    account_id: overrides.account_id || 1,
    user_id: overrides.user_id || 1,
    start_date: new Date(),
    is_active: true,
  };

  const investmentData = { ...defaultData, ...overrides };
  return await Investment.create(investmentData);
};

/**
 * Factory para criar transação de teste
 * @param {Object} overrides - Dados para sobrescrever os padrões
 * @returns {Promise<Object>} Transação criada
 */
const createTestTransaction = async (overrides = {}) => {
  const { Transaction } = require('../../models');
  
  const defaultData = {
    description: `Test Transaction ${Date.now()}`,
    amount: 100.00,
    type: 'expense',
    date: new Date(),
    account_id: overrides.account_id || 1,
    category_id: overrides.category_id || 1,
    user_id: overrides.user_id || 1,
  };

  const transactionData = { ...defaultData, ...overrides };
  return await Transaction.create(transactionData);
};

/**
 * Setup completo para testes que precisam de dados relacionados
 * @param {Object} options - Opções de configuração
 * @returns {Promise<Object>} Objeto com todos os dados criados
 */
const createCompleteTestSetup = async (options = {}) => {
  const user = await createTestUser(options.user);
  const category = await createTestCategory({ user_id: user.id, ...options.category });
  const account = await createTestAccount({ user_id: user.id, ...options.account });
  const supplier = await createTestSupplier({ user_id: user.id, ...options.supplier });
  const creditor = await createTestCreditor({ user_id: user.id, ...options.creditor });
  
  const financing = await createTestFinancing({
    user_id: user.id,
    creditor_id: creditor.id,
    account_id: account.id,
    ...options.financing,
  });

  const fixedAccount = await createTestFixedAccount({
    user_id: user.id,
    category_id: category.id,
    supplier_id: supplier.id,
    ...options.fixedAccount,
  });

  const investment = await createTestInvestment({
    user_id: user.id,
    account_id: account.id,
    ...options.investment,
  });

  return {
    user,
    category,
    account,
    supplier,
    creditor,
    financing,
    fixedAccount,
    investment,
  };
};

/**
 * Gerar token JWT para usuário
 * @param {Object} user - Usuário para gerar token
 * @returns {string} Token JWT
 */
const generateAuthToken = (user) => {
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
};

module.exports = {
  createTestUser,
  createTestCategory,
  createTestAccount,
  createTestSupplier,
  createTestCreditor,
  createTestFinancing,
  createTestFixedAccount,
  createTestInvestment,
  createTestTransaction,
  createCompleteTestSetup,
  generateAuthToken,
}; 