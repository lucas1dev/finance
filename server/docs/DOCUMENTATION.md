# 📚 Documentação do Sistema Financeiro

## 🎯 Visão Geral

Sistema financeiro completo desenvolvido em Node.js com Express, Sequelize e Mysql. O projeto implementa uma arquitetura robusta com separação clara de responsabilidades, testes abrangentes e documentação completa.

## 🏗️ Arquitetura

### 📁 Estrutura de Diretórios

```
server/
├── controllers/          # Controllers da API (delegam para services)
├── services/            # Lógica de negócio centralizada
├── models/              # Modelos do Sequelize
├── middlewares/         # Middlewares do Express
├── routes/              # Definição de rotas
├── utils/               # Utilitários e helpers
├── migrations/          # Migrações do banco de dados
├── seeders/             # Seeders para dados iniciais
├── __tests__/           # Testes unitários e de integração
└── docs/                # Documentação do projeto
```

### 🔧 Padrões Arquiteturais

#### Controllers → Services
- **Controllers**: Responsáveis apenas por receber requisições e retornar respostas
- **Services**: Contêm toda a lógica de negócio e validações
- **Padrão de Resposta**: `{ success: true, data: ... }` ou `{ success: false, error: ... }`

#### Exemplo de Controller Refatorado:
```javascript
// controllers/transactionController.js
const transactionService = require('../services/transactionService');

class TransactionController {
  async index(req, res) {
    try {
      const transactions = await transactionService.listTransactions(req.user.id);
      res.json({ success: true, data: transactions });
    } catch (error) {
      next(error);
    }
  }
}
```

#### Exemplo de Service:
```javascript
// services/transactionService.js
const { Transaction, Category, Account } = require('../models');
const { createTransactionSchema } = require('../utils/validators');
const { AppError } = require('../utils/errors');

class TransactionService {
  async listTransactions(userId) {
    const transactions = await Transaction.findAll({
      where: { user_id: userId },
      include: [Category, Account],
      order: [['date', 'DESC']]
    });
    return transactions;
  }

  async createTransaction(userId, transactionData) {
    const validatedData = createTransactionSchema.parse(transactionData);
    // Lógica de negócio aqui...
    return transaction;
  }
}
```

## 🎮 Controllers Refatorados

### ✅ Controllers Implementados (10/25)

1. **transactionController** → `transactionService`
   - Gestão completa de transações financeiras
   - Integração com categorias e contas
   - Cálculos automáticos de saldo

2. **accountController** → `accountService`
   - Gestão de contas bancárias
   - Cálculo de saldos e estatísticas
   - Validação de dados bancários

3. **categoryController** → `categoryService`
   - Gestão de categorias de transações
   - Categorias padrão do sistema
   - Validação de cores e tipos

4. **creditorController** → `creditorService`
   - Gestão de credores
   - Validação de documentos (CPF/CNPJ)
   - Relacionamento com financiamentos

5. **customerController** → `customerService`
   - Gestão de clientes
   - Validação de dados pessoais
   - Relacionamento com contas a receber

6. **investmentController** → `investmentService`
   - Gestão de investimentos
   - Cálculos de rentabilidade
   - Integração com metas de investimento

7. **investmentGoalController** → `investmentGoalService`
   - Gestão de metas de investimento
   - Cálculos de progresso
   - Alertas de vencimento

8. **payableController** → `payableService`
   - Gestão de contas a pagar
   - Integração com pagamentos
   - Cálculo de valores restantes

9. **supplierController** → `supplierService`
   - Gestão de fornecedores
   - Validação de documentos
   - Relacionamento com contas a pagar

10. **receivableController** → `receivableService`
    - Gestão de contas a receber
    - Integração com pagamentos
    - Cálculo de valores restantes

### 🔄 Controllers Pendentes (15/25)
- paymentController
- financingController
- financingPaymentController
- fixedAccountController
- notificationController
- userController
- settingsController
- authController
- auditController
- dataIntegrityController
- jobAdminController
- jobSchedulerController
- jobTimeoutController
- notificationJobController
- fixedAccountJobController

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js**: Runtime JavaScript
- **Express**: Framework web
- **Sequelize**: ORM para PostgreSQL
- **PostgreSQL**: Banco de dados principal
- **JWT**: Autenticação
- **Zod**: Validação de dados
- **Jest**: Framework de testes
- **Supertest**: Testes de API

### Ferramentas de Desenvolvimento
- **ESLint**: Linting de código
- **Prettier**: Formatação de código
- **JSDoc**: Documentação de código
- **Swagger**: Documentação da API
- **PM2**: Gerenciamento de processos

## 📊 Métricas do Projeto

### Testes
- **Total de Testes**: 595/595 (100%)
- **Suítes de Teste**: 41/41 (100%)
- **Tempo de Execução**: ~35s
- **Cobertura**: ~75%+ statements, ~65%+ branches, ~75%+ functions, ~75%+ lines

### Controllers
- **Refatorados**: 10/25 (40%)
- **Pendentes**: 15/25 (60%)
- **Padrão Implementado**: Controllers → Services

### Funcionalidades
- **Sistema de Transações**: ✅ Completo
- **Sistema de Contas**: ✅ Completo
- **Sistema de Categorias**: ✅ Completo
- **Sistema de Investimentos**: ✅ Completo
- **Sistema de Financiamentos**: ✅ Completo
- **Sistema de Contas Fixas**: ✅ Completo
- **Sistema de Notificações**: ✅ Completo
- **Dashboard**: ✅ Completo
- **Jobs Automatizados**: ✅ Completo

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- PostgreSQL 13+
- Redis (opcional, para cache)

### Instalação
```bash
# Clonar repositório
git clone <repository-url>
cd server

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar migrações
npm run migrate

# Executar seeders
npm run seed

# Iniciar servidor
npm start
```

### Testes
```bash
# Executar todos os testes
npm test

# Executar testes de integração
npm run test:integration

# Executar testes unitários
npm run test:unit

# Executar com cobertura
npm run test:coverage
```

## 📝 Padrões de Desenvolvimento

### Formato de Resposta
```javascript
// Sucesso
{
  "success": true,
  "data": { ... }
}

// Erro
{
  "success": false,
  "error": "Mensagem de erro"
}
```

### Tratamento de Erros
```javascript
// Usar AppError para erros operacionais
throw new AppError('Mensagem de erro', 400);

// Middleware global trata automaticamente
app.use(errorMiddleware);
```

### Validação de Dados
```javascript
// Usar Zod para validação
const validatedData = createSchema.parse(data);
```

### Testes
```javascript
// Mock de services em testes unitários
jest.mock('../services/transactionService');
const transactionService = require('../services/transactionService');

// Testes de integração com banco real
describe('Transaction Integration', () => {
  it('should create transaction', async () => {
    // Teste com dados reais
  });
});
```

## 📚 Documentação Adicional

- [Guia de Testes](TESTING_GUIDE.md)
- [Padrões de Teste](TESTING_PATTERNS.md)
- [Tarefas de Melhoria](TASKS_MELHORIAS.md)
- [Changelog](CHANGELOG.md)
- [API Documentation](openapi.yaml)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. 