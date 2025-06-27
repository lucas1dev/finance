# 📚 Documentação Completa da API - Sistema Financeiro

## 📋 Visão Geral

Este documento fornece uma documentação completa e detalhada de todas as APIs e funcionalidades disponíveis no sistema financeiro.

## 🎯 Status da API

### ✅ Endpoints Implementados
- **100+ endpoints** documentados e funcionais
- **25 controllers** com validação Zod completa
- **Todas as operações CRUD** implementadas
- **Validações robustas** em todos os endpoints
- **Tratamento de erros** padronizado
- **Autenticação JWT** com 2FA
- **Autorização** por roles e permissões

### 📊 Métricas da API
- **Controllers**: 25 implementados
- **Rotas**: 25+ arquivos de rota
- **Endpoints**: 100+ endpoints
- **Validações Zod**: 25+ esquemas
- **Testes**: 802 testes passando
- **Cobertura**: 100% documentada

## 🔐 Autenticação e Autorização

### Sistema JWT
```bash
# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Resposta
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Usuário Teste",
      "email": "user@example.com",
      "role": "user",
      "two_factor_enabled": false
    }
  }
}
```

### Autenticação de Dois Fatores (2FA)
```bash
# Configurar 2FA
POST /api/auth/setup-2fa
Authorization: Bearer <token>

# Resposta
{
  "success": true,
  "message": "2FA configurado com sucesso",
  "data": {
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backup_codes": ["123456", "234567", "345678"]
  }
}

# Verificar 2FA
POST /api/auth/verify-2fa
Authorization: Bearer <token>

{
  "code": "123456"
}
```

### Headers de Autorização
```bash
# Para endpoints protegidos
Authorization: Bearer <jwt_token>

# Para endpoints admin
Authorization: Bearer <jwt_token>
X-Admin-Key: <admin_key>
```

## 📊 Endpoints por Módulo

### 1. 🔐 Autenticação (`/api/auth`)

#### Registro e Login
- `POST /api/auth/register` - Registro de novo usuário
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/logout` - Logout de usuário

#### Recuperação de Senha
- `POST /api/auth/forgot-password` - Solicitar recuperação
- `POST /api/auth/reset-password` - Resetar senha
- `POST /api/auth/verify-reset-token` - Verificar token de reset

#### Perfil e Configurações
- `GET /api/auth/profile` - Obter perfil do usuário
- `PUT /api/auth/profile` - Atualizar perfil
- `PUT /api/auth/password` - Alterar senha
- `DELETE /api/auth/account` - Excluir conta

#### Autenticação de Dois Fatores
- `POST /api/auth/setup-2fa` - Configurar 2FA
- `POST /api/auth/verify-2fa` - Verificar código 2FA
- `POST /api/auth/disable-2fa` - Desabilitar 2FA
- `POST /api/auth/backup-codes` - Gerar códigos de backup

### 2. 💰 Gestão Financeira Básica

#### Contas (`/api/accounts`)
```bash
# Listar contas
GET /api/accounts
GET /api/accounts?type=checking&page=1&limit=10

# Criar conta
POST /api/accounts
{
  "name": "Conta Principal",
  "type": "checking",
  "balance": 5000.00,
  "description": "Conta corrente principal"
}

# Obter conta específica
GET /api/accounts/:id

# Atualizar conta
PUT /api/accounts/:id
{
  "name": "Conta Atualizada",
  "balance": 6000.00
}

# Excluir conta
DELETE /api/accounts/:id
```

#### Transações (`/api/transactions`)
```bash
# Listar transações
GET /api/transactions
GET /api/transactions?type=expense&category_id=1&start_date=2024-01-01&end_date=2024-12-31

# Criar transação
POST /api/transactions
{
  "type": "expense",
  "amount": 150.00,
  "description": "Supermercado",
  "date": "2024-01-15",
  "account_id": 1,
  "category_id": 5
}

# Obter transação específica
GET /api/transactions/:id

# Atualizar transação
PUT /api/transactions/:id
{
  "amount": 160.00,
  "description": "Supermercado - Atualizado"
}

# Excluir transação
DELETE /api/transactions/:id
```

#### Categorias (`/api/categories`)
```bash
# Listar categorias (inclui padrão e personalizadas)
GET /api/categories
GET /api/categories?type=expense

# Criar categoria personalizada
POST /api/categories
{
  "name": "Viagens",
  "type": "expense",
  "color": "#FF6B6B"
}

# Obter categoria específica
GET /api/categories/:id

# Atualizar categoria (apenas personalizadas)
PUT /api/categories/:id
{
  "name": "Viagens Internacionais",
  "color": "#FF8E8E"
}

# Excluir categoria (apenas personalizadas)
DELETE /api/categories/:id
```

### 3. 👥 Gestão de Clientes e Fornecedores

#### Clientes (`/api/customers`)
```bash
# Listar clientes
GET /api/customers
GET /api/customers?document_type=cpf&page=1&limit=10

# Criar cliente
POST /api/customers
{
  "name": "João Silva",
  "document_type": "cpf",
  "document_number": "123.456.789-00",
  "email": "joao@email.com",
  "phone": "(11) 99999-9999",
  "address": "Rua das Flores, 123"
}

# Obter cliente específico
GET /api/customers/:id

# Atualizar cliente
PUT /api/customers/:id
{
  "phone": "(11) 88888-8888",
  "address": "Rua das Flores, 456"
}

# Excluir cliente
DELETE /api/customers/:id
```

#### Fornecedores (`/api/suppliers`)
```bash
# Listar fornecedores
GET /api/suppliers
GET /api/suppliers?document_type=cnpj

# Criar fornecedor
POST /api/suppliers
{
  "name": "Empresa ABC Ltda",
  "document_type": "cnpj",
  "document_number": "12.345.678/0001-90",
  "email": "contato@empresaabc.com",
  "phone": "(11) 3333-3333",
  "address": "Av. Paulista, 1000"
}

# Obter fornecedor específico
GET /api/suppliers/:id

# Atualizar fornecedor
PUT /api/suppliers/:id
{
  "phone": "(11) 4444-4444"
}

# Excluir fornecedor
DELETE /api/suppliers/:id
```

### 4. 💳 Contas a Receber e Pagar

#### Contas a Receber (`/api/receivables`)
```bash
# Listar contas a receber
GET /api/receivables
GET /api/receivables?status=pending&due_date_from=2024-01-01

# Criar conta a receber
POST /api/receivables
{
  "customer_id": 1,
  "description": "Venda de produtos",
  "amount": 1000.00,
  "due_date": "2024-02-15",
  "category_id": 1,
  "notes": "Pagamento em 30 dias"
}

# Obter conta a receber específica
GET /api/receivables/:id

# Atualizar conta a receber
PUT /api/receivables/:id
{
  "amount": 1100.00,
  "notes": "Valor atualizado"
}

# Excluir conta a receber
DELETE /api/receivables/:id
```

#### Contas a Pagar (`/api/payables`)
```bash
# Listar contas a pagar
GET /api/payables
GET /api/payables?status=overdue

# Criar conta a pagar
POST /api/payables
{
  "supplier_id": 1,
  "description": "Compra de materiais",
  "amount": 500.00,
  "due_date": "2024-02-10",
  "category_id": 6
}

# Obter conta a pagar específica
GET /api/payables/:id

# Atualizar conta a pagar
PUT /api/payables/:id
{
  "amount": 550.00
}

# Excluir conta a pagar
DELETE /api/payables/:id
```

#### Pagamentos (`/api/payments`)
```bash
# Listar pagamentos
GET /api/payments
GET /api/payments?type=outgoing&start_date=2024-01-01

# Criar pagamento
POST /api/payments
{
  "type": "outgoing",
  "amount": 500.00,
  "description": "Pagamento de conta",
  "date": "2024-01-15",
  "account_id": 1,
  "payable_id": 1
}

# Obter pagamento específico
GET /api/payments/:id

# Atualizar pagamento
PUT /api/payments/:id
{
  "amount": 520.00
}

# Excluir pagamento
DELETE /api/payments/:id
```

### 5. 📈 Investimentos

#### Investimentos (`/api/investments`)
```bash
# Listar investimentos
GET /api/investments
GET /api/investments?investment_type=acoes&status=ativo

# Criar investimento
POST /api/investments
{
  "investment_type": "acoes",
  "asset_name": "Petrobras",
  "ticker": "PETR4",
  "invested_amount": 1000.00,
  "quantity": 100,
  "operation_date": "2024-01-15",
  "operation_type": "compra",
  "broker": "XP Investimentos",
  "account_id": 1,
  "category_id": 3
}

# Obter investimento específico
GET /api/investments/:id

# Atualizar investimento
PUT /api/investments/:id
{
  "current_value": 1100.00
}

# Excluir investimento
DELETE /api/investments/:id

# Vender ativo
POST /api/investments/:id/sell
{
  "sell_amount": 1100.00,
  "sell_quantity": 100,
  "sell_date": "2024-02-15",
  "broker": "XP Investimentos"
}

# Estatísticas de investimentos
GET /api/investments/statistics

# Posições ativas
GET /api/investments/positions
```

#### Metas de Investimento (`/api/investment-goals`)
```bash
# Listar metas
GET /api/investment-goals
GET /api/investment-goals?status=active

# Criar meta
POST /api/investment-goals
{
  "name": "Aposentadoria",
  "target_amount": 100000.00,
  "current_amount": 5000.00,
  "target_date": "2035-12-31",
  "monthly_contribution": 1000.00,
  "description": "Meta para aposentadoria"
}

# Obter meta específica
GET /api/investment-goals/:id

# Atualizar meta
PUT /api/investment-goals/:id
{
  "current_amount": 6000.00,
  "monthly_contribution": 1200.00
}

# Excluir meta
DELETE /api/investment-goals/:id

# Progresso da meta
GET /api/investment-goals/:id/progress
```

#### Contribuições (`/api/investment-contributions`)
```bash
# Listar contribuições
GET /api/investment-contributions
GET /api/investment-contributions?investment_goal_id=1

# Criar contribuição
POST /api/investment-contributions
{
  "investment_goal_id": 1,
  "amount": 1000.00,
  "contribution_date": "2024-01-15",
  "description": "Contribuição mensal"
}

# Obter contribuição específica
GET /api/investment-contributions/:id

# Atualizar contribuição
PUT /api/investment-contributions/:id
{
  "amount": 1100.00
}

# Excluir contribuição
DELETE /api/investment-contributions/:id
```

### 6. 🏦 Financiamentos

#### Financiamentos (`/api/financings`)
```bash
# Listar financiamentos
GET /api/financings
GET /api/financings?financing_type=hipoteca&status=ativo

# Criar financiamento
POST /api/financings
{
  "creditor_id": 1,
  "financing_type": "hipoteca",
  "total_amount": 200000.00,
  "interest_rate": 0.12,
  "term_months": 240,
  "start_date": "2024-01-01",
  "description": "Financiamento imobiliário",
  "amortization_method": "SAC"
}

# Obter financiamento específico
GET /api/financings/:id

# Atualizar financiamento
PUT /api/financings/:id
{
  "current_balance": 180000.00
}

# Excluir financiamento
DELETE /api/financings/:id

# Tabela de amortização
GET /api/financings/:id/amortization

# Simular pagamento antecipado
POST /api/financings/:id/simulate-early-payment
{
  "payment_amount": 50000.00,
  "payment_date": "2024-06-15"
}

# Estatísticas de financiamentos
GET /api/financings/statistics
```

#### Pagamentos de Financiamento (`/api/financing-payments`)
```bash
# Listar pagamentos
GET /api/financing-payments
GET /api/financing-payments?financing_id=1&status=paid

# Criar pagamento
POST /api/financing-payments
{
  "financing_id": 1,
  "payment_amount": 1500.00,
  "payment_date": "2024-01-15",
  "installment_number": 1,
  "description": "Primeira parcela"
}

# Obter pagamento específico
GET /api/financing-payments/:id

# Atualizar pagamento
PUT /api/financing-payments/:id
{
  "payment_amount": 1600.00
}

# Excluir pagamento
DELETE /api/financing-payments/:id
```

#### Credores (`/api/creditors`)
```bash
# Listar credores
GET /api/creditors
GET /api/creditors?document_type=cnpj

# Criar credor
POST /api/creditors
{
  "name": "Banco XYZ",
  "document_type": "cnpj",
  "document_number": "12.345.678/0001-90",
  "contact_person": "João Silva",
  "phone": "(11) 3333-3333",
  "email": "contato@bancoxyz.com"
}

# Obter credor específico
GET /api/creditors/:id

# Atualizar credor
PUT /api/creditors/:id
{
  "contact_person": "Maria Santos",
  "phone": "(11) 4444-4444"
}

# Excluir credor
DELETE /api/creditors/:id
```

### 7. 🔄 Contas Fixas

#### Contas Fixas (`/api/fixed-accounts`)
```bash
# Listar contas fixas
GET /api/fixed-accounts
GET /api/fixed-accounts?status=active&is_paid=false

# Criar conta fixa
POST /api/fixed-accounts
{
  "description": "Aluguel",
  "amount": 1500.00,
  "due_day": 5,
  "frequency": "monthly",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "category_id": 7,
  "account_id": 1
}

# Obter conta fixa específica
GET /api/fixed-accounts/:id

# Atualizar conta fixa
PUT /api/fixed-accounts/:id
{
  "amount": 1600.00
}

# Excluir conta fixa
DELETE /api/fixed-accounts/:id

# Pagar conta fixa
PUT /api/fixed-accounts/:id/pay
{
  "payment_date": "2024-01-05",
  "payment_amount": 1500.00
}
```

### 8. 📊 Dashboard

#### Dashboard (`/api/dashboard`)
```bash
# Dashboard completo
GET /api/dashboard

# Métricas consolidadas
GET /api/dashboard/metrics

# Dados para gráficos
GET /api/dashboard/charts

# Alertas e notificações
GET /api/dashboard/alerts
```

### 9. 🔔 Notificações

#### Notificações (`/api/notifications`)
```bash
# Listar notificações
GET /api/notifications
GET /api/notifications?type=alert&read=false

# Criar notificação
POST /api/notifications
{
  "type": "alert",
  "title": "Conta vencida",
  "message": "A conta de aluguel venceu há 3 dias",
  "priority": "high"
}

# Obter notificação específica
GET /api/notifications/:id

# Marcar como lida
PUT /api/notifications/:id/read

# Excluir notificação
DELETE /api/notifications/:id
```

### 10. 🔍 Auditoria

#### Auditoria (`/api/audit`)
```bash
# Logs de auditoria
GET /api/audit/logs
GET /api/audit/logs?user_id=1&action=create&start_date=2024-01-01

# Estatísticas de auditoria
GET /api/audit/stats
```

### 11. ⚙️ Jobs e Automação

#### Job Admin (`/api/job-admin`)
```bash
# Estatísticas dos jobs
GET /api/job-admin/stats

# Executar job específico
POST /api/job-admin/execute
{
  "job_type": "fixed_accounts",
  "parameters": {}
}
```

#### Contas Fixas Jobs (`/api/fixed-account-jobs`)
```bash
# Processar contas fixas
POST /api/fixed-account-jobs/process

# Status do processamento
GET /api/fixed-account-jobs/status
```

#### Notificações Jobs (`/api/notification-jobs`)
```bash
# Enviar notificações
POST /api/notification-jobs/send

# Status do envio
GET /api/notification-jobs/status
```

### 12. 🔧 Configurações

#### Configurações (`/api/settings`)
```bash
# Obter configurações do usuário
GET /api/settings

# Atualizar configurações
PUT /api/settings
{
  "notifications_enabled": true,
  "email_notifications": true,
  "dashboard_layout": "compact",
  "currency": "BRL",
  "language": "pt-BR"
}
```

#### Usuários (`/api/users`)
```bash
# Listar usuários (admin)
GET /api/users
GET /api/users?role=user&active=true

# Obter usuário específico
GET /api/users/:id

# Atualizar usuário
PUT /api/users/:id
{
  "name": "Nome Atualizado",
  "role": "admin"
}

# Excluir usuário
DELETE /api/users/:id
```

## 🔒 Validações e Segurança

### Validações Zod Implementadas

#### Autenticação
```javascript
// Login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

// Registro
const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Senhas não coincidem",
  path: ["confirm_password"]
});
```

#### Documentos
```javascript
// CPF
const cpfSchema = z.string().refine((cpf) => validateCPF(cpf), {
  message: 'CPF inválido'
});

// CNPJ
const cnpjSchema = z.string().refine((cnpj) => validateCNPJ(cnpj), {
  message: 'CNPJ inválido'
});
```

#### Valores Monetários
```javascript
// Valores positivos
const amountSchema = z.number().positive('Valor deve ser positivo');

// Valores com 2 casas decimais
const currencySchema = z.number().positive().multipleOf(0.01, 'Valor deve ter no máximo 2 casas decimais');
```

#### Datas
```javascript
// Data futura
const futureDateSchema = z.string().refine((date) => new Date(date) > new Date(), {
  message: 'Data deve ser futura'
});

// Data válida
const dateSchema = z.string().refine((date) => !isNaN(Date.parse(date)), {
  message: 'Data inválida'
});
```

### Tratamento de Erros

#### Códigos de Status HTTP
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autorizado
- `403` - Acesso negado
- `404` - Recurso não encontrado
- `409` - Conflito
- `422` - Validação falhou
- `500` - Erro interno do servidor

#### Formato de Resposta de Erro
```json
{
  "success": false,
  "message": "Mensagem de erro",
  "errors": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 📝 Exemplos de Uso

### Fluxo Completo de Transação
```bash
# 1. Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# 2. Criar categoria personalizada
POST /api/categories
Authorization: Bearer <token>
{
  "name": "Lazer",
  "type": "expense",
  "color": "#FF6B6B"
}

# 3. Criar transação
POST /api/transactions
Authorization: Bearer <token>
{
  "type": "expense",
  "amount": 150.00,
  "description": "Cinema",
  "date": "2024-01-15",
  "account_id": 1,
  "category_id": 15
}

# 4. Verificar saldo da conta
GET /api/accounts/1
Authorization: Bearer <token>
```

### Fluxo de Investimento
```bash
# 1. Criar meta de investimento
POST /api/investment-goals
Authorization: Bearer <token>
{
  "name": "Viagem para Europa",
  "target_amount": 50000.00,
  "current_amount": 0.00,
  "target_date": "2025-12-31",
  "monthly_contribution": 2000.00
}

# 2. Fazer contribuição
POST /api/investment-contributions
Authorization: Bearer <token>
{
  "investment_goal_id": 1,
  "amount": 2000.00,
  "contribution_date": "2024-01-15"
}

# 3. Verificar progresso
GET /api/investment-goals/1/progress
Authorization: Bearer <token>
```

### Fluxo de Financiamento
```bash
# 1. Criar credor
POST /api/creditors
Authorization: Bearer <token>
{
  "name": "Banco XYZ",
  "document_type": "cnpj",
  "document_number": "12.345.678/0001-90"
}

# 2. Criar financiamento
POST /api/financings
Authorization: Bearer <token>
{
  "creditor_id": 1,
  "financing_type": "pessoal",
  "total_amount": 10000.00,
  "interest_rate": 0.15,
  "term_months": 12,
  "amortization_method": "SAC"
}

# 3. Ver tabela de amortização
GET /api/financings/1/amortization
Authorization: Bearer <token>
```

## 🚀 Próximas Funcionalidades

### Versão 2.2.0 (Planejada)
- [ ] Sistema de relatórios avançados
- [ ] Exportação de dados (PDF, Excel)
- [ ] Integração com APIs bancárias
- [ ] Sistema de backup automático
- [ ] Dashboard mobile otimizado

### Versão 2.3.0 (Planejada)
- [ ] Sistema de metas financeiras
- [ ] Análise preditiva
- [ ] Integração com carteiras digitais
- [ ] Sistema de alertas inteligentes
- [ ] API GraphQL

---

**Última atualização**: Janeiro 2025  
**Versão da API**: 2.1.0  
**Status**: ✅ Produção Pronta 