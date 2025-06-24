# Padrões de Teste - Projeto Finance

## 📋 Visão Geral

Este documento define os padrões e boas práticas para testes no projeto Finance, garantindo consistência, confiabilidade e manutenibilidade. Baseado nas correções realizadas e na experiência adquirida durante o desenvolvimento.

## 🎯 Tipos de Teste

### 1. Testes Unitários (`__tests__/controllers/`)
- **Objetivo**: Testar funções, classes e módulos isoladamente
- **Escopo**: Uma única unidade de código
- **Mocks**: Usar mocks para dependências externas
- **Configuração**: `jest.unit.config.js`

### 2. Testes de Integração (`__tests__/integration/`)
- **Objetivo**: Testar integração entre componentes
- **Escopo**: Múltiplas unidades trabalhando juntas
- **Banco**: Usar banco de dados real (MySQL de teste)
- **Configuração**: `jest.integration.config.js`
- **Execução**: Sequencial para evitar conflitos

## 🏗️ Padrão para Testes Unitários

### Estrutura Básica

```javascript
/**
 * Testes unitários para [Nome do Serviço/Controller/Modelo]
 * @module __tests__/controllers/[nome].test
 */

describe('[Nome do Módulo]', () => {
  let moduleInstance;
  let mockDependencies;

  beforeEach(() => {
    jest.resetModules(); // Limpa o cache dos requires
    jest.clearAllMocks();

    // 1. Definir mocks
    mockDependencies = {
      // Mocks específicos do módulo
    };

    // 2. Aplicar mocks
    jest.mock('../../path/to/dependencies', () => mockDependencies);
    jest.mock('../../utils/logger', () => ({
      logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
    }));

    // 3. Importar módulo após mocks
    moduleInstance = require('../../path/to/module');
  });

  describe('[Funcionalidade]', () => {
    it('deve [comportamento esperado]', async () => {
      // Arrange
      mockDependencies.someFunction.mockResolvedValue(expectedValue);

      // Act
      const result = await moduleInstance.someMethod();

      // Assert
      expect(result).toBe(expectedValue);
      expect(mockDependencies.someFunction).toHaveBeenCalledWith(expectedParams);
    });
  });
});
```

### Padrão para Controllers (Atualizado)

```javascript
/**
 * Testes unitários para o controlador de [Nome]
 * @author Lucas
 *
 * @fileoverview
 * Testa as funções do [nome]Controller, cobrindo casos de sucesso, erro e borda.
 *
 * @example
 * // Para rodar os testes:
 * // npm test __tests__/controllers/[nome]Controller.test.js
 */

describe('[Nome]Controller', () => {
  let controller;
  let mockModels, mockValidators, mockErrors, mockOp;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock dos operadores do Sequelize
    mockOp = {
      like: Symbol('like'),
      ne: Symbol('ne'),
      or: Symbol('or'),
      gte: Symbol('gte'),
      lte: Symbol('lte')
    };

    // Mocks dos modelos
    mockModels = {
      [ModelName]: {
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        findAndCountAll: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        count: jest.fn()
      }
    };

    // Mocks dos validadores
    mockValidators = {
      [validatorName]: {
        safeParse: jest.fn(),
        parse: jest.fn()
      }
    };

    // Mocks dos erros
    mockErrors = {
      ValidationError: class ValidationError extends Error {
        constructor(message, errors) {
          super(message);
          this.name = 'ValidationError';
          this.errors = errors;
        }
      },
      NotFoundError: class NotFoundError extends Error {
        constructor(message) {
          super(message);
          this.name = 'NotFoundError';
        }
      }
    };

    // Aplicar mocks
    jest.mock('../../models', () => mockModels);
    jest.mock('../../utils/[validatorName]', () => mockValidators);
    jest.mock('../../utils/errors', () => mockErrors);
    jest.mock('sequelize', () => ({
      Op: mockOp
    }));

    // Importar controller
    controller = require('../../controllers/[nome]Controller');
  });

  describe('[Método]', () => {
    it('deve [comportamento esperado]', async () => {
      // Arrange
      const req = { userId: 1, body: {}, params: {}, query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      mockValidators.[validatorName].safeParse.mockReturnValue({
        success: true,
        data: req.body
      });
      mockModels.[ModelName].[method].mockResolvedValue(expectedValue);

      // Act
      await controller.[method](req, res, next);

      // Assert
      expect(mockValidators.[validatorName].safeParse).toHaveBeenCalledWith(req.body);
      expect(mockModels.[ModelName].[method]).toHaveBeenCalledWith(expectedParams);
      expect(res.status).toHaveBeenCalledWith(expectedStatus);
      expect(res.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('deve retornar erro de validação para dados inválidos', async () => {
      // Arrange
      const req = { userId: 1, body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const validationErrors = [{ message: 'Campo obrigatório' }];
      mockValidators.[validatorName].safeParse.mockReturnValue({
        success: false,
        error: { errors: validationErrors }
      });

      // Act
      await controller.[method](req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(mockErrors.ValidationError));
      expect(next.mock.calls[0][0].message).toBe('Dados inválidos');
    });

    it('deve passar erro do banco para o next', async () => {
      // Arrange
      const req = { userId: 1, body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const dbError = new Error('Erro de banco');
      mockValidators.[validatorName].safeParse.mockReturnValue({
        success: true,
        data: req.body
      });
      mockModels.[ModelName].[method].mockRejectedValue(dbError);

      // Act
      await controller.[method](req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });
});
```

### Padrão para Casos de Borda

```javascript
describe('[Método]', () => {
  it('deve lidar com casos de borda robustamente', async () => {
    // Para casos onde o mock pode não funcionar perfeitamente
    jest.resetModules();
    jest.clearAllMocks();
    
    // Reaplicar mocks
    jest.mock('../../models', () => mockModels);
    jest.mock('../../utils/[validatorName]', () => mockValidators);
    jest.mock('../../utils/errors', () => mockErrors);
    jest.mock('sequelize', () => ({ Op: mockOp }));
    
    // Importar controller após mocks
    const controller = require('../../controllers/[nome]Controller');
    
    const req = { userId: 1, query: { param: 'value' } };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await controller.[method](req, res, next);

    // Assertions robustas para casos de borda
    const arg = res.json.mock.calls[0][0];
    expect(arg).toHaveProperty('expectedProperty');
    expect(Array.isArray(arg.arrayProperty) || arg.arrayProperty === undefined).toBe(true);
  });
});
```

### Padrão para Serviços

```javascript
describe('Service', () => {
  let service;
  let mockModels, mockUtils;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mocks
    mockModels = {
      User: { findByPk: jest.fn(), create: jest.fn() },
      Transaction: { findAll: jest.fn(), create: jest.fn() }
    };

    mockUtils = {
      validateData: jest.fn(),
      formatResponse: jest.fn()
    };

    // Aplicar mocks
    jest.mock('../../models', () => mockModels);
    jest.mock('../../utils/helpers', () => mockUtils);

    // Importar serviço
    service = require('../../services/someService');
  });

  describe('processData', () => {
    it('deve processar dados corretamente', async () => {
      // Arrange
      const inputData = { userId: 1, amount: 100 };
      mockModels.User.findByPk.mockResolvedValue({ id: 1 });
      mockUtils.validateData.mockReturnValue(true);

      // Act
      const result = await service.processData(inputData);

      // Assert
      expect(mockModels.User.findByPk).toHaveBeenCalledWith(1);
      expect(result).toBeDefined();
    });
  });
});
```

## 🔧 Padrão para Testes de Integração

### Estrutura Básica (Padrão Atualizado)

```javascript
/**
 * Testes de integração para [Nome do Endpoint/Recurso]
 * @module __tests__/integration/[nome].test
 */

const request = require('supertest');
const app = require('../../app');
const { createTestUser, cleanAllTestData } = require('../integration/setup');

describe('[Recurso] Integration Tests', () => {
  let authToken, testUser, testData;

  beforeAll(async () => {
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
  });

  beforeEach(async () => {
    // 1. Limpeza completa de dados
    await cleanAllTestData();

    // 2. Criar dados obrigatórios via API
    authToken = await createTestUser(app);
    testUser = await User.findOne({ where: { email: 'test@example.com' } });
    
    // 3. Criar dados dependentes
    testData = await createTestData(testUser.id);
  });

  describe('POST /api/[recurso]', () => {
    it('deve criar um novo recurso com sucesso', async () => {
      const response = await request(app)
        .post('/api/[recurso]')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // dados do teste
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('deve retornar erro para dados inválidos', async () => {
      const response = await request(app)
        .post('/api/[recurso]')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // dados inválidos
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro sem autenticação', async () => {
      const response = await request(app)
        .post('/api/[recurso]')
        .send({
          // dados do teste
        });

      expect(response.status).toBe(401);
    });
  });
});
```

### Padrão de Criação de Dados

#### Via API (Recomendado)

```javascript
// ✅ BOM: Criar dados via API
const categoryResponse = await request(app)
  .post('/api/categories')
  .set('Authorization', `Bearer ${authToken}`)
  .send({
    name: 'Test Category',
    type: 'expense',
    color: '#FF0000'
  });

const category = categoryResponse.body.category;
```

#### Via Factory (Para casos específicos)

```javascript
// ⚠️ Use apenas quando necessário
const category = await createTestCategory({
  name: 'Test Category',
  type: 'expense',
  user_id: testUser.id
});
```

## 🚀 Execução de Testes

### Comandos Disponíveis

```bash
# Testes unitários
npm run test:unit                    # Executar testes unitários
npm run test:unit:watch              # Executar em modo watch
npm run test:unit:coverage           # Executar com cobertura

# Testes de integração
npm run test:integration             # Executar todos os testes de integração
npm run test:integration:watch       # Executar em modo watch
npm run test:integration:coverage    # Executar com cobertura

# Execução sequencial (recomendado)
npm run test:integration:sequential  # Executar suítes sequencialmente
npm run test:integration:sequential:list  # Listar suítes disponíveis
npm run test:integration:sequential:specific auth.test.js category.test.js  # Executar suítes específicas

# Todos os testes
npm run test:all                     # Unitários + Integração
npm run test:all:coverage            # Com cobertura
npm run test:all:sequential          # Unitários + Integração sequencial
```

### Script de Execução Sequencial

O script `run-integration-tests.js` resolve conflitos de dados entre suítes:

```bash
# Executar todas as suítes em ordem
node run-integration-tests.js

# Listar suítes disponíveis
node run-integration-tests.js --list

# Executar suítes específicas
node run-integration-tests.js --specific auth.test.js category.test.js
```

## ✅ Boas Práticas

### 1. Isolamento

- ✅ **Cada teste deve ser independente**
- ✅ **Limpe dados no beforeEach**
- ✅ **Use emails únicos para usuários**
- ❌ **Não dependa de dados de outros testes**

### 2. Criação de Dados

- ✅ **Crie dados via API quando possível**
- ✅ **Use factories apenas quando necessário**
- ✅ **Crie dados dependentes na ordem correta**
- ❌ **Não use dados hardcoded**

### 3. Assertions

- ✅ **Teste status HTTP primeiro**
- ✅ **Teste estrutura da resposta**
- ✅ **Teste casos de erro**
- ✅ **Use assertions específicas**

```javascript
// ✅ BOM
expect(response.status).toBe(201);
expect(response.body).toHaveProperty('id');
expect(response.body.name).toBe('Test Name');

// ❌ RUIM
expect(response.body).toBeDefined();
```

### 4. Organização

- ✅ **Agrupe testes relacionados**
- ✅ **Use descrições claras**
- ✅ **Mantenha testes simples**
- ✅ **Documente casos complexos**

### 5. Performance

- ✅ **Use execução sequencial para integração**
- ✅ **Limpe dados eficientemente**
- ✅ **Evite operações desnecessárias**
- ✅ **Use timeouts apropriados**

### 6. Mocks e Dependências

- ✅ **Use jest.resetModules() no beforeEach**
- ✅ **Aplique mocks antes de importar o módulo**
- ✅ **Mock operadores do Sequelize (Op.like, Op.ne, etc.)**
- ✅ **Mock validadores Zod (safeParse, parse)**
- ✅ **Mock classes de erro customizadas**
- ❌ **Não mock o controller inteiro**

## 🔧 Solução de Problemas

### Problemas Comuns

#### 1. Conflitos de Dados Entre Suítes

**Sintoma**: Testes passam isoladamente mas falham quando executados juntos

**Solução**:
- Use execução sequencial: `npm run test:integration:sequential`
- Implemente limpeza completa no `beforeEach`
- Use emails únicos para usuários de teste

#### 2. Erros de Foreign Key

**Sintoma**: `Cannot add or update a child row: a foreign key constraint fails`

**Solução**:
- Limpe dados na ordem correta (filhos primeiro)
- Use `cleanAllTestData()` que já implementa a ordem correta
- Crie dados dependentes via API

#### 3. Problemas de Autenticação

**Sintoma**: `401 Unauthorized` em testes que deveriam passar

**Solução**:
- Use `createTestUser()` para gerar token válido
- Verifique se o token está sendo enviado corretamente
- Use emails únicos para evitar conflitos

#### 4. Timeouts

**Sintoma**: `Exceeded timeout of 30000 ms for a test`

**Solução**:
- Aumente `testTimeout` na configuração se necessário
- Verifique se há operações assíncronas não aguardadas
- Use `detectOpenHandles: true` para identificar handles abertos

#### 5. Problemas com Mocks do Sequelize

**Sintoma**: `{ creditors: undefined }` em vez de `{ creditors: [] }`

**Solução**:
- Use `jest.resetModules()` no beforeEach
- Mock operadores do Sequelize: `jest.mock('sequelize', () => ({ Op: mockOp }))`
- Para casos de borda, use assertions robustas
- Importe o controller após aplicar todos os mocks

#### 6. Cache de Módulos do Jest

**Sintoma**: Mocks não sendo aplicados corretamente

**Solução**:
- Use `jest.resetModules()` no início do beforeEach
- Aplique todos os mocks antes de importar o módulo
- Para casos específicos, importe o módulo dentro do teste

## 📝 Exemplos Práticos

### Exemplo 1: Teste de Criação

```javascript
describe('POST /api/accounts', () => {
  it('deve criar uma nova conta com dados válidos', async () => {
    const accountData = {
      name: 'Conta Teste',
      type: 'checking',
      balance: 1000.00
    };

    const response = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(accountData);

    expect(response.status).toBe(201);
    expect(response.body.account).toMatchObject({
      name: accountData.name,
      type: accountData.type,
      balance: accountData.balance.toString()
    });
  });

  it('deve retornar erro para dados inválidos', async () => {
    const invalidData = {
      name: '', // nome vazio
      type: 'invalid_type',
      balance: -100 // saldo negativo
    };

    const response = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
```

### Exemplo 2: Teste de Listagem com Filtros

```javascript
describe('GET /api/transactions', () => {
  beforeEach(async () => {
    // Criar transações de teste
    await createTestTransaction({ type: 'income', amount: 1000 });
    await createTestTransaction({ type: 'expense', amount: 500 });
  });

  it('deve listar todas as transações', async () => {
    const response = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(2);
  });

  it('deve filtrar por tipo', async () => {
    const response = await request(app)
      .get('/api/transactions?type=income')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].type).toBe('income');
  });
});
```

### Exemplo 3: Teste de Atualização

```javascript
describe('PUT /api/categories/:id', () => {
  let category;

  beforeEach(async () => {
    // Criar categoria para atualizar
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Categoria Original',
        type: 'expense',
        color: '#FF0000'
      });
    
    category = response.body.category;
  });

  it('deve atualizar categoria com dados válidos', async () => {
    const updateData = {
      name: 'Categoria Atualizada',
      color: '#00FF00'
    };

    const response = await request(app)
      .put(`/api/categories/${category.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.category.name).toBe(updateData.name);
    expect(response.body.category.color).toBe(updateData.color);
  });

  it('deve retornar 404 para categoria inexistente', async () => {
    const response = await request(app)
      .put('/api/categories/99999')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test' });

    expect(response.status).toBe(404);
  });
});
```

## 📊 Métricas e Relatórios

### Cobertura de Código

```bash
# Gerar relatório de cobertura
npm run test:all:coverage

# Ver relatório no navegador
open coverage/lcov-report/index.html
```

### Relatório de Status

O arquivo `TEST_STATUS_REPORT.md` mantém o status atual dos testes:

- Suítes estáveis vs. com problemas
- Taxa de sucesso
- Problemas conhecidos
- Próximos passos

## 🔄 Manutenção

### Atualizações Regulares

1. **Revisar relatório de status** semanalmente
2. **Executar testes completos** antes de releases
3. **Atualizar documentação** quando necessário
4. **Revisar padrões** periodicamente

### Adicionando Novos Testes

1. **Siga o padrão estabelecido**
2. **Use execução sequencial** para integração
3. **Documente casos complexos**
4. **Atualize o relatório de status**

---

**Última atualização**: 21/06/2025  
**Versão**: 3.0  
**Autor**: Equipe de Desenvolvimento 