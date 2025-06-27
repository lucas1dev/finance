# 🏦 Sistema Financeiro - Backend

## 📋 Visão Geral

Sistema completo de gerenciamento financeiro pessoal e empresarial com API REST robusta, validações avançadas, autenticação segura, sistema de auditoria, investimentos, financiamentos, dashboard avançado e jobs automatizados.

## 🚀 Status do Projeto

### ✅ Funcionalidades Implementadas
- **55 suítes de teste**: Sistema de testes robusto
- **802 testes**: Cobertura abrangente
- **Validações Zod**: Implementadas em todos os controllers
- **Autenticação JWT**: Sistema seguro com 2FA
- **Autorização**: Middlewares de permissão e admin
- **Documentação**: JSDoc e OpenAPI completos
- **Sistema de Auditoria**: Logs detalhados de todas as ações
- **Jobs Automatizados**: Processamento de contas fixas e notificações
- **Categorias Padrão**: Sistema de categorias padrão e personalizadas
- **Cores Personalizadas**: Suporte a cores hexadecimais para categorias
- **Proteção de Dados**: Categorias padrão protegidas contra edição/exclusão
- **Sistema de Sessões**: Controle avançado de sessões de usuário
- **Configurações Personalizadas**: Sistema de configurações por usuário
- **Dashboard Avançado**: Métricas consolidadas e relatórios
- **Sistema de Investimentos**: Gestão completa de portfólio
- **Sistema de Financiamentos**: Cálculos automáticos de amortização
- **Sistema de Notificações**: Alertas e lembretes por email
- **Sistema de Jobs**: Processamento em background
- **Sistema de Monitoramento**: Performance e integridade de dados

## 🛠️ Stack Tecnológica Completa

### 🏗️ **Core Framework & Runtime**
- **Node.js** (v18+) - Runtime JavaScript server-side
- **Express.js** (v4.18+) - Framework web minimalista e flexível
- **Nodemon** - Auto-reload para desenvolvimento

### 🗄️ **Banco de Dados & ORM**
- **MySQL** (v8.0+) - Sistema de gerenciamento de banco de dados relacional
- **Sequelize** (v6.31+) - ORM (Object-Relational Mapping) para Node.js
- **Sequelize CLI** - Ferramentas de linha de comando para migrações
- **MySQL2** - Driver MySQL nativo para Node.js

### 🔐 **Autenticação & Segurança**
- **JSON Web Tokens (JWT)** - Autenticação stateless
- **bcrypt/bcryptjs** - Criptografia de senhas
- **Speakeasy** - Geração de códigos 2FA (Two-Factor Authentication)
- **QRCode** - Geração de QR codes para 2FA
- **Helmet** - Middleware de segurança HTTP
- **Express Rate Limit** - Proteção contra ataques de força bruta
- **CORS** - Cross-Origin Resource Sharing

### 📝 **Validação & Validação de Dados**
- **Zod** (v3.21+) - Biblioteca de validação TypeScript-first
- **Express Validator** - Middleware de validação para Express

### 🧪 **Testes & Qualidade**
- **Jest** (v29.5+) - Framework de testes JavaScript
- **Supertest** - Biblioteca para testar APIs HTTP
- **ESLint** - Linter para JavaScript
- **ESLint Plugin Jest** - Regras específicas para testes Jest

### 📧 **Comunicação & Notificações**
- **Nodemailer** - Biblioteca para envio de emails
- **Node Cron** - Agendamento de tarefas (cron jobs)

### 📊 **Cache & Performance**
- **Redis** (v5.5+) - Banco de dados em memória para cache
- **Rate Limit Redis** - Rate limiting com Redis
- **Compression** - Middleware de compressão gzip

### 📚 **Documentação**
- **JSDoc** (v4.0+) - Gerador de documentação JavaScript
- **Clean JSDoc Theme** - Tema moderno para documentação
- **Swagger UI Express** - Interface para documentação da API
- **YAML.js** - Parser YAML para configurações

### 🔍 **Monitoramento & Logs**
- **Winston** (v3.17+) - Biblioteca de logging estruturado
- **Sistema de Auditoria Customizado** - Logs detalhados de ações

### 🚀 **Deploy & Produção**
- **PM2** - Process manager para Node.js
- **Docker** - Containerização (configuração disponível)
- **Environment Variables** - Configuração via dotenv

### 📦 **Utilitários & Helpers**
- **HTTP Server** - Servidor local para documentação
- **Clean Scripts** - Scripts de limpeza e manutenção

## 🏛️ **Arquitetura do Sistema**

### **Padrão MVC (Model-View-Controller)**
- **Models**: Definições Sequelize com relacionamentos
- **Controllers**: Lógica de negócio e validações
- **Routes**: Definição de endpoints da API
- **Middlewares**: Autenticação, autorização e validação

### **Camadas de Segurança**
1. **Rate Limiting** - Proteção contra ataques
2. **Helmet** - Headers de segurança
3. **CORS** - Controle de origens
4. **JWT Validation** - Autenticação de tokens
5. **Zod Validation** - Validação de entrada
6. **Role-based Access** - Controle de permissões
7. **2FA** - Autenticação de dois fatores

### **Sistema de Jobs**
- **Contas Fixas**: Processamento automático de vencimentos
- **Notificações**: Sistema de alertas por email
- **Auditoria**: Logs automáticos de ações importantes
- **Data Integrity**: Verificação de integridade de dados
- **Performance Monitoring**: Monitoramento de performance

## 📁 Estrutura do Projeto

```
server/
├── controllers/          # Lógica de negócio (MVC)
│   ├── authController.js           # Autenticação e 2FA
│   ├── accountController.js        # Gestão de contas
│   ├── transactionController.js    # Transações financeiras
│   ├── categoryController.js       # Categorias
│   ├── customerController.js       # Clientes
│   ├── supplierController.js       # Fornecedores
│   ├── receivableController.js     # Contas a receber
│   ├── payableController.js        # Contas a pagar
│   ├── paymentController.js        # Pagamentos
│   ├── investmentController.js     # Investimentos
│   ├── investmentGoalController.js # Metas de investimento
│   ├── investmentContributionController.js # Contribuições
│   ├── financingController.js      # Financiamentos
│   ├── financingPaymentController.js # Pagamentos de financiamento
│   ├── creditorController.js       # Credores
│   ├── fixedAccountController.js   # Contas fixas
│   ├── dashboardController.js      # Dashboard e métricas
│   ├── notificationController.js   # Notificações
│   ├── auditController.js          # Auditoria
│   ├── jobAdminController.js       # Administração de jobs
│   ├── jobSchedulerController.js   # Agendamento
│   ├── jobTimeoutController.js     # Controle de timeouts
│   ├── dataIntegrityController.js  # Integridade de dados
│   ├── permissionController.js     # Permissões
│   ├── settingsController.js       # Configurações
│   └── userController.js           # Gestão de usuários
├── models/              # Modelos Sequelize
├── routes/              # Definição de rotas
├── middlewares/         # Middlewares (auth, validação)
├── services/            # Serviços externos (email, jobs)
├── utils/               # Utilitários e helpers
├── docs/                # Documentação (JSDoc, OpenAPI)
├── __tests__/           # Testes unitários e integração
├── migrations/          # Migrações do banco
├── seeders/             # Dados iniciais
├── config/              # Configurações
├── database/            # Schema e seeds
└── ecosystem.config.js  # Configuração PM2
```

## 🔧 Instalação e Configuração

### Pré-requisitos
- **Node.js** 18.0.0+
- **MySQL** 8.0+
- **Redis** (opcional, para cache)
- **npm** 8.0.0+ ou **yarn**

### Instalação
```bash
# Clonar o repositório
git clone <repository-url>
cd finance/server

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Configurar banco de dados
npm run setup:db

# Executar migrações
npm run migrate
```

### Configuração Inicial do Banco

Após executar as migrações, execute o seeder para criar as categorias padrão:

```bash
# Executar seeder de categorias padrão
npm run seed

# Ou executar manualmente
node -e "
const { Category } = require('./models');
const { Op } = require('sequelize');

async function seedCategories() {
  const defaultCategories = [
    // Receitas
    { name: 'Salário', type: 'income', color: '#4CAF50', is_default: true },
    { name: 'Freelance', type: 'income', color: '#8BC34A', is_default: true },
    { name: 'Investimentos', type: 'income', color: '#FFC107', is_default: true },
    { name: 'Outros', type: 'income', color: '#9E9E9E', is_default: true },
    // Despesas
    { name: 'Alimentação', type: 'expense', color: '#FF5722', is_default: true },
    { name: 'Transporte', type: 'expense', color: '#2196F3', is_default: true },
    { name: 'Moradia', type: 'expense', color: '#673AB7', is_default: true },
    { name: 'Saúde', type: 'expense', color: '#E91E63', is_default: true },
    { name: 'Educação', type: 'expense', color: '#3F51B5', is_default: true },
    { name: 'Lazer', type: 'expense', color: '#FF9800', is_default: true },
    { name: 'Vestuário', type: 'expense', color: '#795548', is_default: true },
    { name: 'Outros', type: 'expense', color: '#607D8B', is_default: true }
  ];

  for (const category of defaultCategories) {
    await Category.findOrCreate({
      where: { name: category.name, type: category.type, is_default: true },
      defaults: category
    });
  }
  
  console.log('Categorias padrão criadas com sucesso!');
}

seedCategories().catch(console.error);
"
```

### Variáveis de Ambiente
```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=3306
DB_NAME=finance
DB_USER=root
DB_PASS=password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Servidor
PORT=3001
NODE_ENV=development

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# 2FA
TWO_FACTOR_ISSUER=FinanceApp
```

## 🚀 Execução

### Desenvolvimento
```bash
# Iniciar servidor
npm run dev

# Com nodemon (reload automático)
npm run dev:watch
```

### Produção
```bash
# Build e start
npm run build
npm start

# Com PM2
npm run pm2:start
```

## 🧪 Testes

### Executar Testes
```bash
# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Com cobertura
npm run test:coverage

# Execução sequencial
node run-integration-tests.js
```

### Status dos Testes
```
Test Suites: 55 passed, 55 total
Tests:       802 passed, 1 skipped, 803 total
Snapshots:   0 total
Time:        210.153 s
```

## 📚 Documentação

### API Documentation
- **Swagger UI**: http://localhost:3001/api-docs
- **OpenAPI Spec**: `docs/openapi.yaml`
- **JSDoc**: `docs/jsdoc/`

### Documentos Disponíveis
- [Documentação Completa](docs/DOCUMENTATION.md)
- [Guia de Testes](docs/TESTING_GUIDE.md)
- [Padrões de Teste](docs/TESTING_PATTERNS.md)
- [Status dos Testes](docs/TEST_STATUS_REPORT.md)
- [Tarefas e Melhorias](docs/TASKS_MELHORIAS.md)
- [Configuração de Email](docs/EMAIL_CONFIGURATION.md)
- [Guia de Produção](docs/PRODUCTION.md)
- [Changelog](docs/CHANGELOG.md)

## 🔐 Autenticação e Autorização

### JWT Tokens
```bash
# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Resposta
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "name": "User", "email": "user@example.com" }
}
```

### Headers de Autorização
```bash
Authorization: Bearer <token>
```

### Roles e Permissões
- **admin**: Acesso completo ao sistema
- **user**: Acesso limitado aos próprios dados

## 📊 Endpoints Principais

### Autenticação
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Recuperação de senha
- `POST /api/auth/reset-password` - Reset de senha
- `PUT /api/auth/profile` - Atualizar perfil
- `PUT /api/auth/password` - Alterar senha
- `POST /api/auth/setup-2fa` - Configurar 2FA
- `POST /api/auth/verify-2fa` - Verificar 2FA

### Contas
- `GET /api/accounts` - Listar contas
- `POST /api/accounts` - Criar conta
- `GET /api/accounts/:id` - Obter conta
- `PUT /api/accounts/:id` - Atualizar conta
- `DELETE /api/accounts/:id` - Excluir conta

### Transações
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `GET /api/transactions/:id` - Obter transação
- `PUT /api/transactions/:id` - Atualizar transação
- `DELETE /api/transactions/:id` - Excluir transação

### Categorias
- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria
- `GET /api/categories/:id` - Obter categoria
- `PUT /api/categories/:id` - Atualizar categoria
- `DELETE /api/categories/:id` - Excluir categoria

#### 📋 Categorias Padrão e Personalizadas

O sistema oferece dois tipos de categorias:

**Categorias Padrão (`is_default: true`)**
- Criadas automaticamente pelo sistema
- Disponíveis para todos os usuários
- **Não podem ser editadas ou excluídas**
- Incluem categorias comuns como:
  - **Receitas**: Salário, Freelance, Investimentos, Outros
  - **Despesas**: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Vestuário, Outros

**Categorias Personalizadas (`is_default: false`)**
- Criadas pelos usuários
- Podem ser editadas e excluídas livremente
- Suportam cores personalizadas
- Campo `color` opcional (atribuído automaticamente se não informado)

**Exemplo de Uso:**
```bash
# Listar categorias (inclui padrão e personalizadas)
GET /api/categories

# Criar categoria personalizada
POST /api/categories
{
  "name": "Viagens",
  "type": "expense",
  "color": "#FF6B6B"
}

# Tentar editar categoria padrão (retorna erro)
PUT /api/categories/1
# Erro: "Não é possível editar categorias padrão do sistema"
```

### Clientes e Fornecedores
- `GET /api/customers` - Listar clientes
- `POST /api/customers` - Criar cliente
- `GET /api/suppliers` - Listar fornecedores
- `POST /api/suppliers` - Criar fornecedor

### Contas a Receber/Pagar
- `GET /api/receivables` - Listar contas a receber
- `POST /api/receivables` - Criar conta a receber
- `GET /api/payables` - Listar contas a pagar
- `POST /api/payables` - Criar conta a pagar

### Investimentos
- `GET /api/investments` - Listar investimentos
- `POST /api/investments` - Criar investimento
- `GET /api/investments/:id` - Obter investimento
- `PUT /api/investments/:id` - Atualizar investimento
- `DELETE /api/investments/:id` - Excluir investimento
- `GET /api/investments/statistics` - Estatísticas de investimentos
- `GET /api/investments/positions` - Posições ativas
- `POST /api/investments/:id/sell` - Vender ativo

### Metas de Investimento
- `GET /api/investment-goals` - Listar metas
- `POST /api/investment-goals` - Criar meta
- `GET /api/investment-goals/:id` - Obter meta
- `PUT /api/investment-goals/:id` - Atualizar meta
- `DELETE /api/investment-goals/:id` - Excluir meta
- `GET /api/investment-goals/:id/progress` - Progresso da meta

### Contribuições para Investimentos
- `GET /api/investment-contributions` - Listar contribuições
- `POST /api/investment-contributions` - Criar contribuição
- `GET /api/investment-contributions/:id` - Obter contribuição
- `PUT /api/investment-contributions/:id` - Atualizar contribuição
- `DELETE /api/investment-contributions/:id` - Excluir contribuição

### Financiamentos
- `GET /api/financings` - Listar financiamentos
- `POST /api/financings` - Criar financiamento
- `GET /api/financings/:id` - Obter financiamento
- `PUT /api/financings/:id` - Atualizar financiamento
- `DELETE /api/financings/:id` - Excluir financiamento
- `GET /api/financings/:id/amortization` - Tabela de amortização
- `POST /api/financings/:id/simulate-early-payment` - Simular pagamento antecipado
- `GET /api/financings/statistics` - Estatísticas de financiamentos

### Pagamentos de Financiamento
- `GET /api/financing-payments` - Listar pagamentos
- `POST /api/financing-payments` - Criar pagamento
- `GET /api/financing-payments/:id` - Obter pagamento
- `PUT /api/financing-payments/:id` - Atualizar pagamento
- `DELETE /api/financing-payments/:id` - Excluir pagamento

### Credores
- `GET /api/creditors` - Listar credores
- `POST /api/creditors` - Criar credor
- `GET /api/creditors/:id` - Obter credor
- `PUT /api/creditors/:id` - Atualizar credor
- `DELETE /api/creditors/:id` - Excluir credor

### Contas Fixas
- `GET /api/fixed-accounts` - Listar contas fixas
- `POST /api/fixed-accounts` - Criar conta fixa
- `GET /api/fixed-accounts/:id` - Obter conta fixa
- `PUT /api/fixed-accounts/:id` - Atualizar conta fixa
- `DELETE /api/fixed-accounts/:id` - Excluir conta fixa
- `PUT /api/fixed-accounts/:id/pay` - Pagar conta fixa

### Dashboard
- `GET /api/dashboard` - Dashboard completo
- `GET /api/dashboard/metrics` - Métricas consolidadas
- `GET /api/dashboard/charts` - Dados para gráficos
- `GET /api/dashboard/alerts` - Alertas e notificações

### Notificações
- `GET /api/notifications` - Listar notificações
- `POST /api/notifications` - Criar notificação
- `GET /api/notifications/:id` - Obter notificação
- `PUT /api/notifications/:id` - Atualizar notificação
- `DELETE /api/notifications/:id` - Excluir notificação
- `PUT /api/notifications/:id/read` - Marcar como lida

### Jobs e Automação
- `GET /api/job-admin/stats` - Estatísticas dos jobs
- `GET /api/job-admin/jobs` - Listar jobs
- `POST /api/job-admin/jobs/:id/execute` - Executar job
- `POST /api/fixed-account-jobs/process` - Processar contas fixas
- `POST /api/notification-jobs/send` - Enviar notificações
- `GET /api/job-scheduler/jobs` - Jobs agendados
- `POST /api/job-scheduler/jobs` - Agendar job
- `GET /api/job-timeouts/stats` - Estatísticas de timeout

### Auditoria
- `GET /api/audit/logs` - Logs de auditoria
- `GET /api/audit/stats` - Estatísticas de auditoria
- `GET /api/audit/logs/:id` - Obter log específico

### Integridade de Dados
- `GET /api/data-integrity/check` - Verificar integridade
- `POST /api/data-integrity/fix` - Corrigir problemas
- `GET /api/data-integrity/report` - Relatório de integridade

### Configurações
- `GET /api/settings` - Obter configurações
- `PUT /api/settings` - Atualizar configurações
- `GET /api/settings/notifications` - Configurações de notificação
- `PUT /api/settings/notifications` - Atualizar notificações

### Usuários e Permissões
- `GET /api/users` - Listar usuários (admin)
- `POST /api/users` - Criar usuário (admin)
- `GET /api/users/:id` - Obter usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Excluir usuário (admin)
- `GET /api/permissions` - Listar permissões
- `POST /api/permissions` - Criar permissão
- `PUT /api/permissions/:id` - Atualizar permissão

## 🔒 Validações Implementadas

### Controllers com Validação Zod
- ✅ **authController** - Login, registro, recuperação, 2FA
- ✅ **transactionController** - CRUD de transações
- ✅ **accountController** - CRUD de contas
- ✅ **categoryController** - CRUD de categorias
- ✅ **customerController** - CRUD de clientes
- ✅ **supplierController** - CRUD de fornecedores
- ✅ **paymentController** - CRUD de pagamentos
- ✅ **receivableController** - CRUD de recebíveis
- ✅ **payableController** - CRUD de pagáveis
- ✅ **financingController** - CRUD de financiamentos
- ✅ **financingPaymentController** - CRUD de pagamentos de financiamento
- ✅ **investmentController** - CRUD de investimentos
- ✅ **investmentGoalController** - CRUD de metas de investimento
- ✅ **investmentContributionController** - CRUD de contribuições
- ✅ **fixedAccountController** - CRUD de contas fixas
- ✅ **creditorController** - CRUD de credores
- ✅ **dashboardController** - Métricas e relatórios
- ✅ **notificationController** - Sistema de notificações
- ✅ **auditController** - Logs de auditoria
- ✅ **jobAdminController** - Administração de jobs
- ✅ **jobSchedulerController** - Agendamento de jobs
- ✅ **jobTimeoutController** - Controle de timeouts
- ✅ **dataIntegrityController** - Verificação de integridade
- ✅ **permissionController** - Gestão de permissões
- ✅ **settingsController** - Configurações
- ✅ **userController** - Gestão de usuários

### Validações Específicas
- **Documentos**: CPF e CNPJ validados
- **Emails**: Formato e unicidade
- **Senhas**: Complexidade e confirmação
- **Valores**: Números positivos
- **Datas**: Formato e validade
- **Campos Obrigatórios**: Validação completa
- **Cores**: Formato hexadecimal válido para categorias
- **Categorias Padrão**: Proteção contra edição/exclusão
- **2FA**: Validação de códigos TOTP
- **Investimentos**: Validação de valores e tipos
- **Financiamentos**: Validação de cálculos e parcelas
- **Contas Fixas**: Validação de vencimentos

## 🛡️ Segurança

### Middlewares de Segurança
- **Helmet**: Headers de segurança HTTP
- **Rate Limiting**: Proteção contra ataques
- **CORS**: Configuração de origens permitidas
- **JWT**: Autenticação segura
- **Validação**: Entrada de dados validada
- **2FA**: Autenticação de dois fatores

### Boas Práticas
- Senhas criptografadas com bcrypt
- Tokens JWT com expiração
- Validação de entrada com Zod
- Logs estruturados
- Tratamento de erros centralizado
- Auditoria de ações importantes
- Rate limiting por IP e usuário

## 📈 Monitoramento

### Logs
```javascript
// Logs estruturados
{
  "level": "info",
  "message": "Usuário autenticado",
  "userId": 1,
  "timestamp": "2025-06-21T22:30:00.000Z"
}
```

### Métricas
- Tempo de resposta das APIs
- Taxa de erro
- Uso de recursos
- Performance do banco
- Execução de jobs
- Atividades de auditoria

## 🔄 Deploy

### Docker
```bash
# Build da imagem
docker build -t finance-server .

# Executar container
docker run -p 3001:3001 finance-server
```

### PM2
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js

# Monitorar
pm2 monit
```

## 🤝 Contribuição

### Padrões de Código
- ESLint configurado
- Prettier para formatação
- JSDoc obrigatório
- Testes para novas funcionalidades

### Processo
1. Fork do repositório
2. Criar branch para feature
3. Implementar com testes
4. Documentar mudanças
5. Pull Request

## 📞 Suporte

### Recursos
- **Documentação**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/finance/issues)
- **Email**: suporte@finance.com

### Comandos Úteis
```bash
# Verificar status
npm run status

# Limpar cache
npm run clean

# Verificar dependências
npm audit

# Atualizar documentação
npm run docs
```

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor de desenvolvimento
npm run dev:watch        # Com nodemon (reload automático)

# Banco de Dados
npm run setup:db         # Configurar banco de dados
npm run migrate          # Executar migrações
npm run seed             # Executar seeders
npm run migrate:undo     # Desfazer última migração
npm run migrate:reset    # Desfazer todas as migrações

# Testes
npm test                 # Executar todos os testes
npm run test:unit        # Testes unitários
npm run test:integration # Testes de integração
npm run test:coverage    # Testes com cobertura
npm run test:watch       # Testes em modo watch

# Documentação
npm run docs             # Gerar documentação JSDoc
npm run docs:serve       # Servir documentação localmente

# Produção
npm run build            # Build para produção
npm start                # Iniciar em produção
npm run pm2:start        # Iniciar com PM2
npm run pm2:stop         # Parar PM2
npm run pm2:restart      # Reiniciar PM2

# Utilitários
npm run lint             # Verificar código com ESLint
npm run lint:fix         # Corrigir problemas de linting
npm run clean            # Limpar arquivos temporários
npm run status           # Verificar status do projeto
```

---

**Versão**: 2.1.0  
**Última atualização**: Janeiro 2025  
**Status**: ✅ Produção Pronta  
**Licença**: MIT  
**Node.js**: >=18.0.0  
**MySQL**: >=8.0.0