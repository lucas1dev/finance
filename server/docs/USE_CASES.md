# 📋 Casos de Uso do Sistema Financeiro

## 📖 Visão Geral

Este documento descreve os principais casos de uso do sistema financeiro, detalhando cada etapa do processo, desde a entrada de dados até a resposta final, incluindo validações, middlewares e funcionalidades utilizadas.

---

## 🔐 Autenticação e Autorização

### 1. Login de Usuário

#### 📝 **Descrição**
Usuário faz login no sistema fornecendo credenciais válidas.

#### 🔄 **Fluxo Completo**

**1. Entrada de Dados**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**2. Validação de Entrada**
- **Middleware**: `rateLimiter` - Verifica limite de tentativas
- **Validador**: `Zod` - Valida formato de email e senha
- **Campos obrigatórios**: email, password
- **Formato**: email válido, senha mínima 6 caracteres

**3. Processamento no Controller**
- **Controller**: `authController.login()`
- **Validações**:
  - Verifica se usuário existe no banco
  - Verifica se senha está correta (bcrypt)
  - Verifica se usuário está ativo
  - Verifica se não há muitas tentativas de login

**4. Geração de Token**
- **Biblioteca**: `jsonwebtoken`
- **Payload**: `{ userId, email, role }`
- **Expiração**: 24 horas
- **Secret**: Variável de ambiente `JWT_SECRET`

**5. Criação de Sessão**
- **Model**: `UserSession`
- **Campos**: `user_id`, `token`, `ip_address`, `user_agent`, `expires_at`
- **Expiração**: 24 horas

**6. Resposta de Sucesso**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "usuario@exemplo.com",
      "name": "João Silva",
      "role": "user"
    }
  }
}
```

**7. Logs e Auditoria**
- **Log**: Login bem-sucedido
- **Auditoria**: Registro de sessão criada

---

### 2. Registro de Usuário

#### 📝 **Descrição**
Novo usuário se registra no sistema.

#### 🔄 **Fluxo Completo**

**1. Entrada de Dados**
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123",
  "confirmPassword": "senha123"
}
```

**2. Validação de Entrada**
- **Middleware**: `rateLimiter`
- **Validador**: `Zod`
- **Validações**:
  - Nome: mínimo 2 caracteres
  - Email: formato válido e único
  - Senha: mínimo 6 caracteres
  - Confirmação: deve ser igual à senha

**3. Processamento no Controller**
- **Controller**: `authController.register()`
- **Validações**:
  - Verifica se email já existe
  - Verifica força da senha
  - Criptografa senha com bcrypt

**4. Criação do Usuário**
- **Model**: `User`
- **Campos**: `name`, `email`, `password_hash`, `role` (default: "user")
- **Status**: ativo por padrão

**5. Geração de Token**
- Mesmo processo do login

**6. Resposta de Sucesso**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "João Silva",
      "email": "joao@exemplo.com",
      "role": "user"
    }
  }
}
```

---

### 3. Recuperação de Senha

#### 📝 **Descrição**
Usuário solicita recuperação de senha.

#### 🔄 **Fluxo Completo**

**1. Solicitação**
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "usuario@exemplo.com"
}
```

**2. Validação**
- **Validador**: Email válido
- **Verificação**: Usuário existe e está ativo

**3. Geração de Token**
- **Tipo**: Token de recuperação
- **Expiração**: 1 hora
- **Armazenamento**: Campo `reset_token` no usuário

**4. Envio de Email**
- **Serviço**: `emailService`
- **Template**: Email de recuperação
- **Link**: `/reset-password?token=...`

**5. Resposta**
```json
{
  "success": true,
  "message": "Email de recuperação enviado"
}
```

---

## 💰 Gestão de Transações

### 4. Criação de Transação

#### 📝 **Descrição**
Usuário cria uma nova transação financeira.

#### 🔄 **Fluxo Completo**

**1. Entrada de Dados**
```
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Compra no supermercado",
  "amount": 150.50,
  "type": "expense",
  "category_id": 1,
  "account_id": 1,
  "date": "2024-01-15",
  "notes": "Compras da semana"
}
```

**2. Autenticação**
- **Middleware**: `auth` - Verifica token JWT
- **Extração**: `userId` do token

**3. Validação de Entrada**
- **Validador**: `transactionValidators.createTransaction`
- **Validações**:
  - Descrição: obrigatória, máximo 255 caracteres
  - Valor: obrigatório, positivo
  - Tipo: "income" ou "expense"
  - Categoria: deve existir
  - Conta: deve existir e pertencer ao usuário
  - Data: formato válido

**4. Processamento no Controller**
- **Controller**: `transactionController.createTransaction()`
- **Validações adicionais**:
  - Verifica se categoria existe
  - Verifica se conta pertence ao usuário
  - Verifica se data é válida

**5. Criação da Transação**
- **Model**: `Transaction`
- **Campos**: `user_id`, `description`, `amount`, `type`, `category_id`, `account_id`, `date`, `notes`
- **Relacionamentos**: User, Category, Account

**6. Atualização de Saldo**
- **Model**: `Account`
- **Cálculo**: 
  - Income: saldo + valor
  - Expense: saldo - valor

**7. Resposta de Sucesso**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "description": "Compra no supermercado",
    "amount": 150.50,
    "type": "expense",
    "category": {
      "id": 1,
      "name": "Alimentação"
    },
    "account": {
      "id": 1,
      "name": "Conta Principal"
    },
    "date": "2024-01-15",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**8. Logs e Auditoria**
- **Log**: Transação criada
- **Auditoria**: Registro de criação

---

### 5. Listagem de Transações

#### 📝 **Descrição**
Usuário visualiza lista de transações com filtros.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
GET /api/transactions?page=1&limit=10&type=expense&category_id=1&start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <token>
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Validação de Parâmetros**
- **Validador**: `transactionValidators.listTransactions`
- **Parâmetros opcionais**:
  - `page`: número da página (default: 1)
  - `limit`: itens por página (default: 10, max: 100)
  - `type`: "income" ou "expense"
  - `category_id`: ID da categoria
  - `account_id`: ID da conta
  - `start_date`: data inicial
  - `end_date`: data final

**4. Processamento no Controller**
- **Controller**: `transactionController.getTransactions()`
- **Queries**:
  - Filtro por usuário
  - Filtros opcionais
  - Ordenação por data (mais recente)
  - Paginação

**5. Consulta ao Banco**
- **Model**: `Transaction`
- **Includes**: Category, Account
- **Where**: user_id, filtros aplicados
- **Order**: date DESC
- **Limit/Offset**: paginação

**6. Resposta**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 1,
        "description": "Compra no supermercado",
        "amount": 150.50,
        "type": "expense",
        "category": {
          "id": 1,
          "name": "Alimentação"
        },
        "account": {
          "id": 1,
          "name": "Conta Principal"
        },
        "date": "2024-01-15"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

## 📊 Dashboard e Relatórios

### 6. Dashboard Principal

#### 📝 **Descrição**
Usuário acessa dashboard com métricas financeiras.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
GET /api/dashboard
Authorization: Bearer <token>
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Processamento no Controller**
- **Controller**: `dashboardController.getDashboard()`
- **Cálculos**:
  - Saldo total das contas
  - Receitas e despesas do mês
  - Receitas e despesas do ano
  - Transações recentes
  - Alertas e notificações

**4. Queries Complexas**
- **Saldo Total**: Soma de todos os saldos das contas do usuário
- **Métricas Mensais**: Transações do mês atual
- **Métricas Anuais**: Transações do ano atual
- **Transações Recentes**: Últimas 5 transações
- **Alertas**: Notificações não lidas

**5. Resposta**
```json
{
  "success": true,
  "data": {
    "balance": {
      "total": 5000.00,
      "accounts": [
        {
          "id": 1,
          "name": "Conta Principal",
          "balance": 3000.00
        }
      ]
    },
    "monthly": {
      "income": 3000.00,
      "expenses": 1500.00,
      "net": 1500.00
    },
    "yearly": {
      "income": 36000.00,
      "expenses": 18000.00,
      "net": 18000.00
    },
    "recent_transactions": [...],
    "alerts": [...]
  }
}
```

---

### 7. Estatísticas de Transações

#### 📝 **Descrição**
Usuário visualiza estatísticas detalhadas de transações.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
GET /api/transactions/stats?period=month&start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <token>
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Validação**
- **Validador**: `transactionValidators.getStats`
- **Parâmetros**:
  - `period`: "day", "week", "month", "year"
  - `start_date`: data inicial
  - `end_date`: data final

**4. Processamento**
- **Controller**: `transactionController.getTransactionStats()`
- **Cálculos**:
  - Total de receitas e despesas
  - Média diária/semanal/mensal
  - Categorias mais utilizadas
  - Tendências de gastos

**5. Queries Agregadas**
- **SUM**: Total por tipo
- **AVG**: Média por período
- **GROUP BY**: Categoria, data
- **ORDER BY**: Valor, data

**6. Resposta**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_income": 3000.00,
      "total_expenses": 1500.00,
      "net": 1500.00
    },
    "by_category": [
      {
        "category": "Alimentação",
        "amount": 500.00,
        "percentage": 33.33
      }
    ],
    "trends": {
      "daily_average": 50.00,
      "growth_rate": 5.2
    }
  }
}
```

---

## 🏦 Gestão de Contas

### 8. Criação de Conta

#### 📝 **Descrição**
Usuário cria uma nova conta bancária.

#### 🔄 **Fluxo Completo**

**1. Entrada de Dados**
```
POST /api/accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Conta Corrente",
  "type": "checking",
  "initial_balance": 1000.00,
  "color": "#3B82F6",
  "is_default": false
}
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Validação**
- **Validador**: `accountValidators.createAccount`
- **Validações**:
  - Nome: obrigatório, único para o usuário
  - Tipo: "checking", "savings", "investment"
  - Saldo inicial: número positivo
  - Cor: formato hexadecimal válido

**4. Processamento**
- **Controller**: `accountController.createAccount()`
- **Validações**:
  - Verifica se nome já existe para o usuário
  - Se for conta padrão, remove padrão das outras

**5. Criação da Conta**
- **Model**: `Account`
- **Campos**: `user_id`, `name`, `type`, `balance`, `color`, `is_default`

**6. Resposta**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Conta Corrente",
    "type": "checking",
    "balance": 1000.00,
    "color": "#3B82F6",
    "is_default": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🏷️ Gestão de Categorias

### 9. Criação de Categoria

#### 📝 **Descrição**
Usuário cria uma nova categoria para transações.

#### 🔄 **Fluxo Completo**

**1. Entrada de Dados**
```
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Transporte",
  "type": "expense",
  "color": "#EF4444",
  "icon": "car"
}
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Validação**
- **Validador**: `categoryValidators.createCategory`
- **Validações**:
  - Nome: obrigatório, único para o usuário
  - Tipo: "income" ou "expense"
  - Cor: formato hexadecimal válido
  - Ícone: opcional

**4. Processamento**
- **Controller**: `categoryController.createCategory()`
- **Validações**:
  - Verifica se nome já existe para o usuário

**5. Criação da Categoria**
- **Model**: `Category`
- **Campos**: `user_id`, `name`, `type`, `color`, `icon`

**6. Resposta**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Transporte",
    "type": "expense",
    "color": "#EF4444",
    "icon": "car",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🔔 Sistema de Notificações

### 10. Criação de Notificação

#### 📝 **Descrição**
Sistema cria notificação automática para o usuário.

#### 🔄 **Fluxo Completo**

**1. Trigger Automático**
- **Origem**: Jobs automáticos, eventos do sistema
- **Exemplos**: Conta fixa vencida, saldo baixo, transação suspeita

**2. Processamento**
- **Controller**: `notificationController.createNotification()`
- **Dados**:
  - `user_id`: ID do usuário
  - `title`: Título da notificação
  - `message`: Mensagem detalhada
  - `type`: "info", "warning", "error"
  - `related_type`: "transaction", "account", "payment"
  - `related_id`: ID do item relacionado

**3. Criação da Notificação**
- **Model**: `Notification`
- **Campos**: `user_id`, `title`, `message`, `type`, `related_type`, `related_id`, `is_read`

**4. Envio de Email (Opcional)**
- **Serviço**: `emailService`
- **Template**: Baseado no tipo de notificação
- **Configuração**: Baseada nas preferências do usuário

**5. Resposta**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Conta Fixa Vencida",
    "message": "A conta 'Netflix' venceu hoje",
    "type": "warning",
    "is_read": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## ⚙️ Jobs Automáticos

### 11. Processamento de Contas Fixas

#### 📝 **Descrição**
Job automático processa contas fixas vencidas.

#### 🔄 **Fluxo Completo**

**1. Agendamento**
- **Cron**: `0 6 * * *` (6h da manhã)
- **Serviço**: `fixedAccountJobs`

**2. Execução**
- **Controller**: `fixedAccountJobController.processFixedAccounts()`
- **Processo**:
  - Busca contas fixas vencidas
  - Verifica saldo das contas
  - Cria transações automáticas
  - Gera notificações
  - Atualiza próximas datas de vencimento

**3. Validações**
- **Saldo**: Verifica se há saldo suficiente
- **Duplicação**: Evita transações duplicadas
- **Configuração**: Verifica se job está habilitado

**4. Criação de Transações**
- **Model**: `Transaction`
- **Tipo**: "expense"
- **Descrição**: "Pagamento automático - [Nome da conta]"
- **Valor**: Valor da conta fixa

**5. Criação de Notificações**
- **Model**: `Notification`
- **Tipo**: "warning"
- **Mensagem**: "Conta fixa processada automaticamente"

**6. Atualização de Contas Fixas**
- **Model**: `FixedAccount`
- **Campo**: `next_due_date` - Próxima data de vencimento

**7. Logs**
- **Model**: `JobExecution`
- **Campos**: `job_type`, `status`, `started_at`, `finished_at`, `result`

**8. Resposta**
```json
{
  "success": true,
  "data": {
    "processed": 5,
    "transactions_created": 5,
    "notifications_sent": 5,
    "errors": 0
  }
}
```

---

## 🔍 Auditoria e Logs

### 12. Registro de Ação Administrativa

#### 📝 **Descrição**
Sistema registra ação administrativa para auditoria.

#### 🔄 **Fluxo Completo**

**1. Trigger**
- **Origem**: Ações administrativas (deletar usuário, alterar permissões)
- **Middleware**: `auditMiddleware`

**2. Autenticação**
- **Middleware**: `adminAuth` ou `permissionAuth`
- **Verificação**: Permissões específicas

**3. Processamento**
- **Controller**: Qualquer controller administrativo
- **Middleware**: `auditMiddleware` captura automaticamente

**4. Criação do Log**
- **Model**: `AuditLog`
- **Campos**:
  - `user_id`: ID do administrador
  - `action`: "create", "update", "delete"
  - `resource`: "user", "transaction", "account"
  - `resource_id`: ID do recurso afetado
  - `details`: JSON com detalhes da ação
  - `ip_address`: IP do administrador
  - `user_agent`: Navegador/dispositivo

**5. Exemplo de Log**
```json
{
  "id": 1,
  "user_id": 1,
  "action": "delete",
  "resource": "user",
  "resource_id": 5,
  "details": {
    "reason": "Violação de termos",
    "admin_note": "Usuário banido por spam"
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## 🛡️ Segurança e Permissões

### 13. Verificação de Permissões

#### 📝 **Descrição**
Sistema verifica permissões do usuário para acessar recursos.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
GET /api/admin/users
Authorization: Bearer <token>
```

**2. Autenticação**
- **Middleware**: `auth` - Verifica token

**3. Verificação de Permissões**
- **Middleware**: `permissionAuth`
- **Permissão**: "users:read"
- **Verificação**:
  - Role do usuário (admin, user)
  - Permissões específicas
  - Recursos permitidos

**4. Processamento**
- **Controller**: `userController.getUsers()`
- **Filtros**: Baseados nas permissões
- **Dados**: Limitados ao que o usuário pode ver

**5. Resposta**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "João Silva",
        "email": "joao@exemplo.com",
        "role": "user",
        "status": "active"
      }
    ]
  }
}
```

---

## 📈 Relatórios e Exportação

### 14. Geração de Relatório

#### 📝 **Descrição**
Usuário gera relatório de transações.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
POST /api/transactions/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "format": "csv",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "filters": {
    "type": "expense",
    "category_id": 1
  }
}
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Validação**
- **Validador**: `transactionValidators.exportTransactions`
- **Formatos**: "csv", "json", "pdf"
- **Limites**: Máximo 1000 registros

**4. Processamento**
- **Controller**: `transactionController.exportTransactions()`
- **Queries**: Filtros aplicados
- **Formatação**: Baseada no formato solicitado

**5. Geração do Arquivo**
- **CSV**: Biblioteca `csv-writer`
- **JSON**: Resposta direta
- **PDF**: Biblioteca `puppeteer`

**6. Resposta**
```json
{
  "success": true,
  "data": {
    "download_url": "/api/transactions/export/download/abc123",
    "expires_at": "2024-01-15T11:30:00Z",
    "record_count": 150
  }
}
```

---

## 🔧 Configurações do Sistema

### 15. Atualização de Configurações

#### 📝 **Descrição**
Usuário atualiza configurações pessoais.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
PUT /api/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "language": "pt-BR",
  "currency": "BRL",
  "timezone": "America/Sao_Paulo",
  "notifications": {
    "email": true,
    "push": false,
    "low_balance": true
  }
}
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Validação**
- **Validador**: `settingsValidators.updateSettings`
- **Validações**:
  - Idioma: lista de idiomas suportados
  - Moeda: códigos de moeda válidos
  - Timezone: timezone válido
  - Notificações: objeto com configurações

**4. Processamento**
- **Controller**: `settingsController.updateSettings()`
- **Atualização**: `UserSetting` model
- **Validação**: Configurações compatíveis

**5. Atualização**
- **Model**: `UserSetting`
- **Campos**: `user_id`, `language`, `currency`, `timezone`, `notifications`

**6. Resposta**
```json
{
  "success": true,
  "data": {
    "language": "pt-BR",
    "currency": "BRL",
    "timezone": "America/Sao_Paulo",
    "notifications": {
      "email": true,
      "push": false,
      "low_balance": true
    },
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## 📱 Integração com Frontend

### 16. Sincronização de Dados

#### 📝 **Descrição**
Frontend sincroniza dados com o backend.

#### 🔄 **Fluxo Completo**

**1. Requisição de Sincronização**
```
GET /api/sync?last_sync=2024-01-15T10:00:00Z
Authorization: Bearer <token>
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Processamento**
- **Controller**: `syncController.getSyncData()`
- **Lógica**:
  - Compara timestamp da última sincronização
  - Retorna apenas dados modificados
  - Inclui metadados de versão

**4. Queries Otimizadas**
- **Transações**: Modificadas desde last_sync
- **Contas**: Saldos atualizados
- **Categorias**: Novas/modificadas
- **Notificações**: Não lidas

**5. Resposta**
```json
{
  "success": true,
  "data": {
    "sync_timestamp": "2024-01-15T10:30:00Z",
    "transactions": [...],
    "accounts": [...],
    "categories": [...],
    "notifications": [...],
    "deleted": {
      "transactions": [1, 2, 3],
      "categories": []
    }
  }
}
```

---

## 🚀 Performance e Cache

### 17. Cache de Dados Frequentes

#### 📝 **Descrição**
Sistema utiliza cache para otimizar performance.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
GET /api/dashboard
Authorization: Bearer <token>
```

**2. Verificação de Cache**
- **Chave**: `dashboard:user:1`
- **TTL**: 5 minutos
- **Verificação**: Cache hit/miss

**3. Cache Miss**
- **Processamento**: Controller normal
- **Cálculos**: Métricas do dashboard
- **Armazenamento**: Cache com TTL

**4. Cache Hit**
- **Resposta**: Dados do cache
- **Performance**: ~10ms vs ~500ms

**5. Invalidação**
- **Triggers**: Nova transação, alteração de conta
- **Chaves**: `dashboard:user:*`
- **Método**: Cache invalidation

---

## 🔄 Tratamento de Erros

### 18. Erro de Validação

#### 📝 **Descrição**
Sistema retorna erro de validação formatado.

#### 🔄 **Fluxo Completo**

**1. Requisição Inválida**
```
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": "invalid"
}
```

**2. Validação Falha**
- **Validador**: `Zod` detecta erro
- **Middleware**: `errorMiddleware` captura

**3. Formatação do Erro**
- **Tipo**: `ValidationError`
- **Campos**: Lista de campos com erro
- **Mensagens**: Mensagens específicas

**4. Resposta de Erro**
```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Dados inválidos",
    "details": [
      {
        "field": "amount",
        "message": "Deve ser um número positivo"
      }
    ]
  }
}
```

---

## 📊 Monitoramento e Métricas

### 19. Coleta de Métricas

#### 📝 **Descrição**
Sistema coleta métricas de performance.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
GET /api/transactions
Authorization: Bearer <token>
```

**2. Middleware de Métricas**
- **Início**: Timestamp da requisição
- **Processamento**: Tempo de execução
- **Fim**: Timestamp de resposta

**3. Coleta de Dados**
- **Endpoint**: `/api/transactions`
- **Método**: GET
- **Tempo**: 150ms
- **Status**: 200
- **Usuário**: ID 1

**4. Armazenamento**
- **Model**: `RequestMetrics`
- **Campos**: `endpoint`, `method`, `duration`, `status_code`, `user_id`

**5. Análise**
- **Dashboard**: Métricas de performance
- **Alertas**: Tempo de resposta alto
- **Otimização**: Identificação de gargalos

---

## 🔐 Segurança Avançada

### 20. Rate Limiting

#### 📝 **Descrição**
Sistema aplica rate limiting para prevenir abuso.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "wrong"
}
```

**2. Verificação de Rate Limit**
- **Middleware**: `rateLimiter`
- **Chave**: `login:ip:192.168.1.100`
- **Limite**: 5 tentativas por 15 minutos

**3. Contagem**
- **Redis**: Incrementa contador
- **TTL**: 15 minutos
- **Verificação**: Se excedeu limite

**4. Bloqueio**
- **Status**: 429 Too Many Requests
- **Headers**: `Retry-After: 900`
- **Log**: Tentativa bloqueada

**5. Resposta de Erro**
```json
{
  "success": false,
  "error": {
    "type": "RateLimitExceeded",
    "message": "Muitas tentativas de login. Tente novamente em 15 minutos.",
    "retry_after": 900
  }
}
```

---

## 💡 Gestão de Contas Fixas

### 12. Criação de Conta Fixa

#### 📝 **Descrição**
Usuário cadastra uma nova conta fixa (despesa ou receita recorrente).

#### 🔄 **Fluxo Completo**

**1. Entrada de Dados**
```
POST /api/fixed-accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Aluguel",
  "amount": 1500.00,
  "periodicity": "monthly",
  "start_date": "2024-01-01",
  "category_id": 1,
  "supplier_id": 2,
  "account_id": 1,
  "payment_method": "automatic_debit",
  "observations": "Vencimento todo dia 5",
  "reminder_days": 3
}
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Validação de Entrada**
- **Validador**: `fixedAccountValidators.createFixedAccount`
- **Validações**:
  - Descrição: obrigatória, máximo 255 caracteres
  - Valor: obrigatório, positivo
  - Periodicidade: daily, weekly, monthly, quarterly, yearly
  - Data de início: formato válido
  - Categoria: deve existir
  - Conta, fornecedor: opcionais, se informados devem existir
  - Dias de lembrete: 0 a 30

**4. Processamento no Controller**
- **Controller**: `fixedAccountController.createFixedAccount()`
- **Validações adicionais**:
  - Verifica se categoria, conta e fornecedor pertencem ao usuário

**5. Criação da Conta Fixa**
- **Model**: `FixedAccount`
- **Campos**: `user_id`, `description`, `amount`, `periodicity`, `start_date`, `category_id`, `supplier_id`, `account_id`, `payment_method`, `observations`, `reminder_days`, `is_active`, `is_paid`, `next_due_date`

**6. Resposta de Sucesso**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "description": "Aluguel",
    "amount": 1500.00,
    "periodicity": "monthly",
    "start_date": "2024-01-01",
    "category": { "id": 1, "name": "Moradia" },
    "supplier": { "id": 2, "name": "Imobiliária" },
    "account": { "id": 1, "name": "Conta Principal" },
    "payment_method": "automatic_debit",
    "observations": "Vencimento todo dia 5",
    "reminder_days": 3,
    "is_active": true,
    "is_paid": false,
    "next_due_date": "2024-02-05",
    "created_at": "2024-01-01T10:30:00Z"
  }
}
```

---

### 13. Listagem de Contas Fixas

#### 📝 **Descrição**
Usuário visualiza todas as suas contas fixas cadastradas.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
GET /api/fixed-accounts?status=active&is_paid=false
Authorization: Bearer <token>
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Filtros Opcionais**
- status: active/inactive
- is_paid: true/false
- periodicity, category_id, supplier_id

**4. Processamento no Controller**
- **Controller**: `fixedAccountController.getFixedAccounts()`
- **Query**: Busca todas as contas fixas do usuário, aplica filtros

**5. Resposta**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "description": "Aluguel",
      "amount": 1500.00,
      "periodicity": "monthly",
      "is_active": true,
      "is_paid": false,
      "next_due_date": "2024-02-05"
    },
    {
      "id": 2,
      "description": "Netflix",
      "amount": 39.90,
      "periodicity": "monthly",
      "is_active": true,
      "is_paid": true,
      "next_due_date": "2024-03-01"
    }
  ]
}
```

---

### 14. Consulta de Conta Fixa por ID

#### 📝 **Descrição**
Usuário consulta detalhes de uma conta fixa específica.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
GET /api/fixed-accounts/1
Authorization: Bearer <token>
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Processamento no Controller**
- **Controller**: `fixedAccountController.getFixedAccountById()`
- Busca conta fixa pelo ID e usuário

**4. Resposta**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "description": "Aluguel",
    "amount": 1500.00,
    "periodicity": "monthly",
    "is_active": true,
    "is_paid": false,
    "next_due_date": "2024-02-05",
    "category": { "id": 1, "name": "Moradia" },
    "supplier": { "id": 2, "name": "Imobiliária" },
    "account": { "id": 1, "name": "Conta Principal" }
  }
}
```

---

### 15. Atualização de Conta Fixa

#### 📝 **Descrição**
Usuário edita os dados de uma conta fixa existente.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
PUT /api/fixed-accounts/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1600.00,
  "observations": "Ajuste anual do aluguel"
}
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Validação**
- **Validador**: `fixedAccountValidators.updateFixedAccount`
- Apenas campos enviados são atualizados

**4. Processamento no Controller**
- **Controller**: `fixedAccountController.updateFixedAccount()`
- Busca conta fixa pelo ID e usuário, aplica atualizações

**5. Resposta**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "amount": 1600.00,
    "observations": "Ajuste anual do aluguel"
  }
}
```

---

### 16. Exclusão de Conta Fixa

#### 📝 **Descrição**
Usuário remove uma conta fixa do sistema.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
DELETE /api/fixed-accounts/1
Authorization: Bearer <token>
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Processamento no Controller**
- **Controller**: `fixedAccountController.deleteFixedAccount()`
- Busca conta fixa pelo ID e usuário, remove registro

**4. Resposta**
```json
{
  "success": true,
  "message": "Conta fixa removida com sucesso"
}
```

---

### 17. Ativação/Desativação de Conta Fixa

#### 📝 **Descrição**
Usuário ativa ou desativa uma conta fixa (sem excluir do sistema).

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
PATCH /api/fixed-accounts/1/toggle
Authorization: Bearer <token>
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Processamento no Controller**
- **Controller**: `fixedAccountController.toggleFixedAccount()`
- Alterna o campo `is_active` da conta fixa

**4. Resposta**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "is_active": false
  }
}
```

---

### 18. Pagamento Manual de Conta Fixa

#### 📝 **Descrição**
Usuário marca uma conta fixa como paga manualmente, gerando uma transação.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
POST /api/fixed-accounts/1/pay
Authorization: Bearer <token>
Content-Type: application/json

{
  "payment_date": "2024-02-05"
}
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Validação**
- Verifica se conta está ativa e não paga
- Verifica saldo suficiente na conta bancária

**4. Processamento no Controller**
- **Controller**: `fixedAccountController.payFixedAccount()`
- Cria transação vinculada, atualiza saldo, marca como paga, calcula próxima data

**5. Resposta**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "amount": 1500.00,
    "type": "expense",
    "description": "Aluguel",
    "payment_date": "2024-02-05",
    "fixed_account_id": 1
  },
  "message": "Conta fixa paga com sucesso"
}
```

---

### 19. Estatísticas de Contas Fixas

#### 📝 **Descrição**
Usuário visualiza estatísticas consolidadas das suas contas fixas.

#### 🔄 **Fluxo Completo**

**1. Requisição**
```
GET /api/fixed-accounts/statistics
Authorization: Bearer <token>
```

**2. Autenticação**
- **Middleware**: `auth`

**3. Processamento no Controller**
- **Controller**: `fixedAccountController.getFixedAccountStatistics()`
- Calcula totais, valores mensais/anuais, vencidas, pagas, por categoria, etc.

**4. Resposta**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "totalAmount": 3500.00,
    "active": 4,
    "inactive": 1,
    "paid": 2,
    "unpaid": 3,
    "overdue": 1,
    "dueThisMonth": 2,
    "dueNextMonth": 1,
    "byPeriodicity": { "monthly": 3, "yearly": 2 },
    "byCategory": { "Moradia": { "count": 2, "totalAmount": 2000.00 } },
    "totalMonthlyValue": 2500.00,
    "totalYearlyValue": 30000.00
  }
}
```

---

## 📝 Conclusão

Este documento detalha os principais casos de uso do sistema financeiro, mostrando o fluxo completo de cada funcionalidade, desde a entrada de dados até a resposta final. Cada caso de uso inclui:

- **Entrada de dados** e validações
- **Processamento** no controller
- **Interação** com modelos e banco de dados
- **Middlewares** aplicados
- **Resposta** formatada
- **Logs** e auditoria

O sistema implementa boas práticas de segurança, performance e usabilidade, garantindo uma experiência robusta e confiável para os usuários.