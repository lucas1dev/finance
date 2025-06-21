# Backend - Sistema Financeiro

## 📋 Visão Geral

Sistema financeiro completo para gerenciamento de finanças pessoais e empresariais, desenvolvido com Node.js, Express, Sequelize e MySQL. Inclui funcionalidades avançadas como gestão de investimentos, financiamentos, contas a pagar/receber e sistema de notificações.

## 🏗️ Estrutura do Projeto

```
server/
├── config/                 # Configurações do projeto
├── controllers/            # Controladores da aplicação
├── middlewares/            # Middlewares (autenticação, etc)
├── migrations/             # Migrações do banco de dados
├── models/                 # Modelos do Sequelize
├── routes/                 # Rotas da API
├── services/               # Serviços de negócio
├── utils/                  # Utilitários e helpers
├── __tests__/              # Testes unitários e de integração
│   ├── controllers/        # Testes unitários
│   └── integration/        # Testes de integração
├── docs/                   # Documentação
│   ├── jsdoc/             # Documentação JSDoc
│   └── openapi.yaml       # Especificação OpenAPI
├── database/               # Scripts de banco de dados
├── jest.config.js          # Configuração Jest
├── jest.integration.config.js # Configuração Jest integração
├── jest.unit.config.js     # Configuração Jest unitários
├── run-integration-tests.js # Script de execução sequencial
└── .env                    # Variáveis de ambiente
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Sequelize** - ORM para MySQL
- **MySQL** - Banco de dados
- **JWT** - Autenticação
- **Zod** - Validação de dados
- **Jest** - Framework de testes
- **Supertest** - Testes de API

### Documentação
- **JSDoc** - Documentação de código
- **OpenAPI/Swagger** - Documentação da API
- **Clean JSDoc Theme** - Tema para documentação

### Qualidade de Código
- **ESLint** - Linting
- **Prettier** - Formatação
- **Jest** - Testes unitários e de integração

## 🚀 Configuração do Ambiente

### 1. Instalação das Dependências
```bash
npm install
```

### 2. Configuração do Ambiente
Crie o arquivo `.env` baseado no `.env.example`:
```env
# Banco de Dados
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=finance
DB_HOST=localhost
DB_PORT=3306

# JWT
JWT_SECRET=seu_secret_jwt_super_seguro

# Servidor
PORT=3001
NODE_ENV=development

# Logs
LOG_LEVEL=info
```

### 3. Configuração do Banco de Dados
```bash
# Executar schema SQL (cria todas as tabelas)
node setup-database.js

# Ou usar migrations
npx sequelize-cli db:migrate
```

### 4. Executar o Servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 🧪 Testes

### Status dos Testes
- **13/17 suítes de integração** funcionando 100%
- **142/215 testes** passando (66%)
- **Execução sequencial** implementada para evitar conflitos
- **Cobertura de código** configurada

### Comandos de Teste

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
```bash
# Executar todas as suítes em ordem
node run-integration-tests.js

# Listar suítes disponíveis
node run-integration-tests.js --list

# Executar suítes específicas
node run-integration-tests.js --specific auth.test.js category.test.js
```

## 📚 Documentação

### Documentação da API
- **JSDoc**: `npm run docs` - Documentação detalhada do código
- **OpenAPI/Swagger**: `docs/openapi.yaml` - Especificação da API
- **Visualização**: `npm run docs:serve` - Servir documentação localmente

### Guias e Relatórios
- **[Guia de Testes](./TESTING_GUIDE.md)** - Padrões e boas práticas para testes
- **[Status dos Testes](./TEST_STATUS_REPORT.md)** - Relatório detalhado do status dos testes
- **[Padrões de Teste](./TESTING_PATTERNS.md)** - Padrões estabelecidos para testes
- **[Lista de Melhorias](./TASKS_MELHORIAS.md)** - Tarefas e melhorias do projeto
- **[Visão Geral da Documentação](./DOCUMENTATION.md)** - Centralização da documentação

### Comandos de Documentação
```bash
# Gerar documentação JSDoc
npm run docs

# Servir documentação localmente
npm run docs:serve

# Gerar documentação em modo watch
npm run docs:watch
```

## 🗄️ Modelos do Banco de Dados

### User
- `id`: ID do usuário
- `name`: Nome do usuário
- `email`: Email do usuário (único)
- `password`: Senha (hash bcrypt)
- `role`: Papel (admin/user)
- `two_factor_secret`: Secret para 2FA
- `two_factor_enabled`: Se 2FA está ativo
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Account
- `id`: ID da conta
- `user_id`: ID do usuário
- `name`: Nome da conta
- `type`: Tipo (checking/savings/investment/credit_card/other)
- `balance`: Saldo atual
- `description`: Descrição adicional
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Category
- `id`: ID da categoria
- `user_id`: ID do usuário
- `name`: Nome da categoria
- `type`: Tipo (income/expense)
- `color`: Cor em hexadecimal
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Transaction
- `id`: ID da transação
- `user_id`: ID do usuário
- `account_id`: ID da conta
- `category_id`: ID da categoria
- `investment_id`: ID do investimento (opcional)
- `fixed_account_id`: ID da conta fixa (opcional)
- `type`: Tipo (income/expense)
- `amount`: Valor
- `description`: Descrição
- `date`: Data da transação
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Customer
- `id`: ID do cliente
- `user_id`: ID do usuário
- `name`: Nome do cliente
- `document_type`: Tipo (CPF/CNPJ)
- `document_number`: Número do documento
- `email`: Email do cliente
- `phone`: Telefone
- `address`: Endereço
- `contact_person`: Pessoa de contato
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Supplier
- `id`: ID do fornecedor
- `user_id`: ID do usuário
- `name`: Nome do fornecedor
- `document_type`: Tipo (CPF/CNPJ)
- `document_number`: Número do documento
- `email`: Email do fornecedor
- `phone`: Telefone
- `address`: Endereço
- `contact_person`: Pessoa de contato
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Receivable
- `id`: ID do recebível
- `user_id`: ID do usuário
- `customer_id`: ID do cliente
- `category_id`: ID da categoria
- `amount`: Valor total
- `remaining_amount`: Valor restante
- `due_date`: Data de vencimento
- `description`: Descrição
- `status`: Status (pending/partially_paid/paid)
- `invoice_number`: Número da nota fiscal
- `payment_terms`: Condições de pagamento
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Payable
- `id`: ID do pagável
- `user_id`: ID do usuário
- `supplier_id`: ID do fornecedor
- `category_id`: ID da categoria
- `description`: Descrição
- `amount`: Valor
- `due_date`: Data de vencimento
- `payment_date`: Data do pagamento
- `status`: Status (pending/paid/overdue)
- `payment_method`: Método (boleto/transfer/card)
- `invoice_number`: Número da nota fiscal
- `notes`: Observações
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Payment
- `id`: ID do pagamento
- `receivable_id`: ID do recebível
- `amount`: Valor
- `payment_date`: Data do pagamento
- `payment_method`: Método (cash/pix/credit_card/debit_card/bank_transfer)
- `description`: Descrição
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Investment
- `id`: ID do investimento
- `user_id`: ID do usuário
- `investment_type`: Tipo (acoes/fundos/tesouro/cdb/criptomoedas/outros)
- `asset_name`: Nome do ativo
- `invested_amount`: Valor investido
- `current_value`: Valor atual
- `purchase_date`: Data de compra
- `sale_date`: Data de venda (opcional)
- `quantity`: Quantidade
- `unit_price`: Preço unitário
- `current_unit_price`: Preço unitário atual
- `broker`: Corretora
- `notes`: Observações
- `is_active`: Se está ativo
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### InvestmentGoal
- `id`: ID da meta
- `user_id`: ID do usuário
- `name`: Nome da meta
- `target_amount`: Valor alvo
- `current_amount`: Valor atual
- `target_date`: Data alvo
- `description`: Descrição
- `priority`: Prioridade (low/medium/high)
- `status`: Status (active/completed/cancelled)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### InvestmentContribution
- `id`: ID da contribuição
- `user_id`: ID do usuário
- `investment_goal_id`: ID da meta
- `amount`: Valor da contribuição
- `contribution_date`: Data da contribuição
- `description`: Descrição
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Creditor
- `id`: ID do credor
- `user_id`: ID do usuário
- `name`: Nome do credor
- `document_type`: Tipo (CPF/CNPJ)
- `document_number`: Número do documento
- `email`: Email do credor
- `phone`: Telefone
- `address`: Endereço
- `contact_person`: Pessoa de contato
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Financing
- `id`: ID do financiamento
- `user_id`: ID do usuário
- `creditor_id`: ID do credor
- `description`: Descrição
- `total_amount`: Valor total
- `remaining_amount`: Valor restante
- `interest_rate`: Taxa de juros
- `start_date`: Data de início
- `end_date`: Data de término
- `payment_day`: Dia do pagamento
- `payment_method`: Método (boleto/automatic_debit/transfer)
- `status`: Status (active/paid/cancelled)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### FinancingPayment
- `id`: ID do pagamento
- `financing_id`: ID do financiamento
- `payment_date`: Data do pagamento
- `amount`: Valor do pagamento
- `principal_amount`: Valor do principal
- `interest_amount`: Valor dos juros
- `payment_method`: Método (boleto/automatic_debit/transfer)
- `status`: Status (pending/paid/overdue)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### FixedAccount
- `id`: ID da conta fixa
- `user_id`: ID do usuário
- `name`: Nome da conta fixa
- `amount`: Valor
- `due_day`: Dia do vencimento
- `description`: Descrição
- `is_active`: Se está ativa
- `is_paid`: Se foi paga
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Notification
- `id`: ID da notificação
- `user_id`: ID do usuário
- `title`: Título
- `message`: Mensagem
- `type`: Tipo (info/warning/error/success)
- `is_read`: Se foi lida
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### JobExecution
- `id`: ID da execução
- `job_name`: Nome do job
- `status`: Status (running/completed/failed)
- `started_at`: Data de início
- `completed_at`: Data de conclusão
- `error_message`: Mensagem de erro
- `execution_time_ms`: Tempo de execução
- `created_at`: Data de criação
- `updated_at`: Data de atualização

## 🔗 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/logout` - Fazer logout

### Usuários
- `GET /api/users/profile` - Obter perfil
- `PUT /api/users/profile` - Atualizar perfil

### Contas
- `GET /api/accounts` - Listar contas
- `POST /api/accounts` - Criar conta
- `GET /api/accounts/:id` - Obter conta
- `PUT /api/accounts/:id` - Atualizar conta
- `DELETE /api/accounts/:id` - Deletar conta

### Categorias
- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria
- `GET /api/categories/:id` - Obter categoria
- `PUT /api/categories/:id` - Atualizar categoria
- `DELETE /api/categories/:id` - Deletar categoria

### Transações
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `GET /api/transactions/:id` - Obter transação
- `PUT /api/transactions/:id` - Atualizar transação
- `DELETE /api/transactions/:id` - Deletar transação

### Clientes
- `GET /api/customers` - Listar clientes
- `POST /api/customers` - Criar cliente
- `GET /api/customers/:id` - Obter cliente
- `PUT /api/customers/:id` - Atualizar cliente
- `DELETE /api/customers/:id` - Deletar cliente

### Fornecedores
- `GET /api/suppliers` - Listar fornecedores
- `POST /api/suppliers` - Criar fornecedor
- `GET /api/suppliers/:id` - Obter fornecedor
- `PUT /api/suppliers/:id` - Atualizar fornecedor
- `DELETE /api/suppliers/:id` - Deletar fornecedor

### Recebíveis
- `GET /api/receivables` - Listar recebíveis
- `POST /api/receivables` - Criar recebível
- `GET /api/receivables/:id` - Obter recebível
- `PUT /api/receivables/:id` - Atualizar recebível
- `DELETE /api/receivables/:id` - Deletar recebível

### Pagáveis
- `GET /api/payables` - Listar pagáveis
- `POST /api/payables` - Criar pagável
- `GET /api/payables/:id` - Obter pagável
- `PUT /api/payables/:id` - Atualizar pagável
- `DELETE /api/payables/:id` - Deletar pagável

### Pagamentos
- `GET /api/payments` - Listar pagamentos
- `POST /api/payments` - Criar pagamento
- `GET /api/payments/:id` - Obter pagamento
- `PUT /api/payments/:id` - Atualizar pagamento
- `DELETE /api/payments/:id` - Deletar pagamento

### Investimentos
- `GET /api/investments` - Listar investimentos
- `POST /api/investments` - Criar investimento
- `GET /api/investments/:id` - Obter investimento
- `PUT /api/investments/:id` - Atualizar investimento
- `DELETE /api/investments/:id` - Deletar investimento

### Metas de Investimento
- `GET /api/investment-goals` - Listar metas
- `POST /api/investment-goals` - Criar meta
- `GET /api/investment-goals/:id` - Obter meta
- `PUT /api/investment-goals/:id` - Atualizar meta
- `DELETE /api/investment-goals/:id` - Deletar meta

### Contribuições para Metas
- `GET /api/investment-contributions` - Listar contribuições
- `POST /api/investment-contributions` - Criar contribuição
- `GET /api/investment-contributions/:id` - Obter contribuição
- `PUT /api/investment-contributions/:id` - Atualizar contribuição
- `DELETE /api/investment-contributions/:id` - Deletar contribuição

### Credores
- `GET /api/creditors` - Listar credores
- `POST /api/creditors` - Criar credor
- `GET /api/creditors/:id` - Obter credor
- `PUT /api/creditors/:id` - Atualizar credor
- `DELETE /api/creditors/:id` - Deletar credor

### Financiamentos
- `GET /api/financings` - Listar financiamentos
- `POST /api/financings` - Criar financiamento
- `GET /api/financings/:id` - Obter financiamento
- `PUT /api/financings/:id` - Atualizar financiamento
- `DELETE /api/financings/:id` - Deletar financiamento

### Pagamentos de Financiamentos
- `GET /api/financing-payments` - Listar pagamentos
- `POST /api/financing-payments` - Criar pagamento
- `GET /api/financing-payments/:id` - Obter pagamento
- `PUT /api/financing-payments/:id` - Atualizar pagamento
- `DELETE /api/financing-payments/:id` - Deletar pagamento

### Contas Fixas
- `GET /api/fixed-accounts` - Listar contas fixas
- `POST /api/fixed-accounts` - Criar conta fixa
- `GET /api/fixed-accounts/:id` - Obter conta fixa
- `PUT /api/fixed-accounts/:id` - Atualizar conta fixa
- `DELETE /api/fixed-accounts/:id` - Deletar conta fixa
- `PATCH /api/fixed-accounts/:id/toggle` - Alternar status
- `PATCH /api/fixed-accounts/:id/pay` - Marcar como paga

### Notificações
- `GET /api/notifications` - Listar notificações
- `POST /api/notifications` - Criar notificação
- `GET /api/notifications/:id` - Obter notificação
- `PUT /api/notifications/:id` - Atualizar notificação
- `DELETE /api/notifications/:id` - Deletar notificação
- `PATCH /api/notifications/:id/read` - Marcar como lida

### Jobs
- `GET /api/jobs` - Listar jobs
- `POST /api/jobs` - Executar job
- `GET /api/jobs/:id` - Obter job

## 🔧 Comandos Úteis

### Desenvolvimento
```bash
npm run dev              # Executar em modo desenvolvimento
npm run lint             # Executar ESLint
npm run lint:fix         # Corrigir problemas do ESLint
npm run clean            # Limpar e reinstalar dependências
```

### Testes
```bash
npm run test:all         # Executar todos os testes
npm run test:all:coverage # Executar com cobertura
npm run test:all:sequential # Executar sequencialmente
```

### Documentação
```bash
npm run docs             # Gerar documentação JSDoc
npm run docs:serve       # Servir documentação
npm run docs:watch       # Gerar em modo watch
```

### Banco de Dados
```bash
npm run migrate          # Executar migrações
npm run migrate:undo     # Desfazer migrações
npm run seed             # Executar seeds
npm run seed:undo        # Desfazer seeds
```

### Produção
```bash
npm start                # Executar em produção
npm run prod:pm2         # Executar com PM2
```

## 📊 Status do Projeto

### Funcionalidades Implementadas ✅
- ✅ Autenticação JWT completa
- ✅ CRUD de usuários, contas, categorias
- ✅ Gestão de transações
- ✅ Gestão de clientes e fornecedores
- ✅ Controle de recebíveis e pagáveis
- ✅ Sistema de pagamentos
- ✅ Gestão de investimentos
- ✅ Metas de investimento
- ✅ Financiamentos e credores
- ✅ Contas fixas
- ✅ Sistema de notificações
- ✅ Jobs em background
- ✅ Validação com Zod
- ✅ Testes unitários e de integração
- ✅ Documentação JSDoc e OpenAPI
- ✅ Execução sequencial de testes

### Métricas de Qualidade
- **13/17 suítes de integração** funcionando 100%
- **142/215 testes** passando (66%)
- **Cobertura de código** configurada
- **Documentação completa** disponível
- **Padrões de teste** estabelecidos

### Próximos Passos
1. **Monitorar performance** dos testes
2. **Manter documentação atualizada**
3. **Aplicar padrões a novas funcionalidades**
4. **Revisar cobertura de código**

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Email**: suporte@finance.com
- **GitHub**: [Issues](https://github.com/seu-usuario/finance/issues)
- **Documentação**: [JSDoc](./docs/jsdoc/) | [OpenAPI](./docs/openapi.yaml)

## 📈 Histórico de Mudanças

### Versão 2.0.0 (2025-06-20) - Lançamento Principal
**Status**: ✅ Sistema completo e estável

#### ✨ Funcionalidades Adicionadas
- **Sistema Robusto de Testes**
  - Execução sequencial de testes de integração
  - Script `run-integration-tests.js`
  - Isolamento completo entre suítes
  - 13/17 suítes funcionando 100%

- **Sistema de Financiamentos e Credores**
  - Modelos: `Creditor`, `Financing`, `FinancingPayment`
  - Controllers completos com cálculos
  - Endpoints para gestão completa

- **Sistema de Contas Fixas Aprimorado**
  - Campo `is_paid` adicionado
  - Endpoints para alternar status
  - Integração com transações

- **Sistema de Pagáveis Completo**
  - Modelo `Payable` com relacionamentos
  - Controller com CRUD completo
  - Controle de status

- **Sistema de Notificações e Jobs**
  - Modelos: `Notification`, `JobExecution`
  - Jobs em background
  - Sistema de tracking

- **Sistema de Usuários Administradores**
  - Campo `role` no modelo `User`
  - Middleware `adminAuth.js`
  - Controle de permissões

#### 🔧 Melhorias Implementadas
- **Infraestrutura de Testes**
  - Configuração Jest otimizada
  - Detecção de handles abertos
  - Timeouts configuráveis

- **Banco de Dados**
  - Schema SQL completo
  - Todas as tabelas criadas
  - Índices otimizados

- **Documentação Completa**
  - JSDoc em todos os arquivos
  - OpenAPI/Swagger atualizado
  - Guias de teste criados
  - Relatórios de status

#### 🐛 Correções Realizadas
- **Conflitos de Dados Entre Testes**
  - Isolamento completo
  - Limpeza otimizada
  - Emails únicos

- **Problemas de Autenticação**
  - Tokens JWT válidos
  - Headers corretos
  - Usuários únicos

- **Configuração Jest**
  - Opções inválidas removidas
  - Timeouts configurados
  - Logs melhorados

### Versão 1.1.0 (2024-12-15)
- Sistema de investimentos implementado
- Venda de ativos adicionada
- Testes de integração criados
- Documentação OpenAPI atualizada

### Versão 1.0.0 (2024-01-01)
- Sistema base implementado
- CRUD completo para recursos principais
- Autenticação JWT configurada
- Testes básicos criados

## 🎯 Próximos Passos

### Imediatos (1-2 semanas)
1. **Implementar observabilidade** - Endpoints de monitoramento
2. **Melhorar cobertura** - Atingir 80%+
3. **Otimizar performance** - Reduzir tempo de execução
4. **Documentar deployment** - Guia de produção

### Médio Prazo (1-2 meses)
1. **Sistema de relatórios** - Análises avançadas
2. **Integração com APIs** - Cotação de moedas
3. **Backup automático** - Proteção de dados
4. **Testes de performance** - Benchmarks

### Longo Prazo (3-6 meses)
1. **Microserviços** - Arquitetura escalável
2. **Cache distribuído** - Performance
3. **Monitoramento avançado** - APM
4. **CI/CD completo** - Automação

## 📞 Contato e Suporte

### Recursos
- **Email**: suporte@finance.com
- **GitHub**: [Issues](https://github.com/seu-usuario/finance/issues)
- **Documentação**: [JSDoc](./docs/jsdoc/) | [OpenAPI](./docs/openapi.yaml)

### Documentação Relacionada
- **[CHANGELOG.md](./CHANGELOG.md)** - Histórico completo de mudanças
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Guia de testes
- **[TESTING_PATTERNS.md](./TESTING_PATTERNS.md)** - Padrões de teste
- **[TEST_STATUS_REPORT.md](./TEST_STATUS_REPORT.md)** - Status dos testes
- **[TASKS_MELHORIAS.md](./TASKS_MELHORIAS.md)** - Lista de melhorias
- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Visão geral da documentação

---

**Responsável**: Equipe de Desenvolvimento  
**Versão**: 2.0.0  
**Última atualização**: 20/06/2025