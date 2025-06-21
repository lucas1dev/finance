# Guia de Boas Práticas para Testes - Sistema Financeiro

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Testes](#estrutura-de-testes)
3. [Padrões de Teste](#padrões-de-teste)
4. [Execução de Testes](#execução-de-testes)
5. [Solução de Problemas](#solução-de-problemas)
6. [Boas Práticas](#boas-práticas)
7. [Exemplos Práticos](#exemplos-práticos)

## 🎯 Visão Geral

Este guia documenta os padrões e boas práticas estabelecidos para testes no sistema financeiro, baseado nas correções realizadas e na experiência adquirida durante o desenvolvimento.

### Objetivos

- **Isolamento**: Cada teste deve ser independente e não afetar outros testes
- **Confiabilidade**: Testes devem ser estáveis e previsíveis
- **Performance**: Execução rápida e eficiente
- **Manutenibilidade**: Código de teste limpo e bem documentado

## 🏗️ Estrutura de Testes

### Organização de Arquivos

```
server/
├── __tests__/
│   ├── integration/           # Testes de integração
│   │   ├── setup.js          # Setup global
│   │   ├── factories.js      # Factories para dados de teste
│   │   ├── auth.test.js      # Testes de autenticação
│   │   ├── account.test.js   # Testes de contas
│   │   └── ...               # Outras suítes
│   └── controllers/          # Testes unitários
│       ├── authController.test.js
│       └── ...
├── jest.config.js            # Configuração Jest padrão
├── jest.integration.config.js # Configuração Jest integração
├── jest.unit.config.js       # Configuração Jest unitários
└── run-integration-tests.js  # Script de execução sequencial
```

### Configurações Jest

#### Configuração de Integração (`jest.integration.config.js`)

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/integration/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/integration/setup.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
  maxWorkers: 1, // Execução sequencial
  bail: false,
  detectOpenHandles: true,
  cache: false,
  collectCoverage: false
};
```

## 🔧 Padrões de Teste

### 1. Estrutura Básica de Teste

```javascript
const request = require('supertest');
const app = require('../../app');
const { createTestUser, cleanAllTestData } = require('../integration/setup');

describe('Nome da Suíte', () => {
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

  describe('POST /api/endpoint', () => {
    it('deve criar um novo recurso com sucesso', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // dados do teste
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('deve retornar erro para dados inválidos', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // dados inválidos
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro sem autenticação', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .send({
          // dados do teste
        });

      expect(response.status).toBe(401);
    });
  });
});
```

### 2. Padrão de Criação de Dados

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

### 3. Padrão de Limpeza

```javascript
// Limpeza completa no beforeEach
beforeEach(async () => {
  await cleanAllTestData();
  // ... criar dados necessários
});

// Limpeza no afterAll
afterAll(async () => {
  await cleanAllTestData();
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

### Debug de Testes

```bash
# Executar com mais detalhes
npm run test:integration -- --verbose

# Executar teste específico
npm test -- __tests__/integration/auth.test.js

# Executar com debug
DEBUG=* npm run test:integration
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

**Última atualização**: 20/06/2025  
**Versão**: 1.0  
**Autor**: Equipe de Desenvolvimento