# Documentação da API

Esta documentação descreve todos os endpoints disponíveis na API do Sistema Financeiro.

## Como Visualizar a Documentação

1. Instale o Swagger UI:
```bash
npm install swagger-ui-express
```

2. Adicione o seguinte código ao seu arquivo `app.js`:
```javascript
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./docs/openapi.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

3. Acesse a documentação em `http://localhost:3001/api-docs`

## Autenticação

A API usa autenticação JWT (JSON Web Token). Para acessar os endpoints protegidos:

1. Faça login usando o endpoint `/auth/login`
2. Use o token retornado no header `Authorization` de todas as requisições:
```
Authorization: Bearer <seu_token>
```

## Endpoints Principais

### Autenticação
- `POST /auth/register` - Registra um novo usuário
- `POST /auth/login` - Realiza login

### Contas
- `GET /accounts` - Lista todas as contas
- `POST /accounts` - Cria uma nova conta

### Categorias
- `GET /categories` - Lista todas as categorias
- `POST /categories` - Cria uma nova categoria

### Clientes
- `GET /customers` - Lista todos os clientes
- `POST /customers` - Cria um novo cliente

### Contas a Receber
- `GET /receivables` - Lista todas as contas a receber
- `POST /receivables` - Cria uma nova conta a receber
- `POST /receivables/{id}/payments` - Registra um pagamento

### Transações
- `GET /transactions` - Lista todas as transações
- `POST /transactions` - Cria uma nova transação

## Modelos de Dados

### User
```json
{
  "id": "integer",
  "name": "string",
  "email": "string",
  "created_at": "date-time",
  "updated_at": "date-time"
}
```

### Account
```json
{
  "id": "integer",
  "user_id": "integer",
  "bank_name": "string",
  "account_type": "string",
  "balance": "float",
  "description": "string",
  "created_at": "date-time",
  "updated_at": "date-time"
}
```

### Category
```json
{
  "id": "integer",
  "user_id": "integer",
  "name": "string",
  "type": "income | expense",
  "created_at": "date-time",
  "updated_at": "date-time"
}
```

### Customer
```json
{
  "id": "integer",
  "user_id": "integer",
  "name": "string",
  "document_type": "CPF | CNPJ",
  "document_number": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "created_at": "date-time",
  "updated_at": "date-time"
}
```

### Receivable
```json
{
  "id": "integer",
  "user_id": "integer",
  "customer_id": "integer",
  "category_id": "integer",
  "amount": "float",
  "remaining_amount": "float",
  "due_date": "date",
  "description": "string",
  "status": "pending | partially_paid | paid",
  "invoice_number": "string",
  "payment_terms": "string",
  "created_at": "date-time",
  "updated_at": "date-time"
}
```

### Payment
```json
{
  "id": "integer",
  "receivable_id": "integer",
  "amount": "float",
  "payment_date": "date",
  "payment_method": "cash | pix | credit_card | debit_card | bank_transfer",
  "description": "string",
  "created_at": "date-time",
  "updated_at": "date-time"
}
```

### Transaction
```json
{
  "id": "integer",
  "user_id": "integer",
  "account_id": "integer",
  "category_id": "integer",
  "type": "income | expense",
  "amount": "float",
  "description": "string",
  "date": "date",
  "created_at": "date-time",
  "updated_at": "date-time"
}
```

## Códigos de Status

- `200` - Sucesso
- `201` - Criado
- `400` - Dados inválidos
- `401` - Não autorizado
- `404` - Não encontrado
- `500` - Erro interno do servidor

## Exemplos de Uso

### Criar uma Conta
```bash
curl -X POST http://localhost:3001/accounts \
  -H "Authorization: Bearer <seu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bank_name": "Banco do Brasil",
    "account_type": "Conta Corrente",
    "balance": 1000.00,
    "description": "Conta principal"
  }'
```

### Registrar um Pagamento
```bash
curl -X POST http://localhost:3001/receivables/1/payments \
  -H "Authorization: Bearer <seu_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500.00,
    "payment_date": "2024-03-21",
    "payment_method": "pix",
    "description": "Pagamento parcial",
    "account_id": 1
  }'
```

## Suporte

Para suporte, entre em contato através do email: suporte@finance.com 

## Novos Endpoints: Investimentos e Aportes

### 1. Investimentos

#### Criar um novo investimento
```bash
POST /investments
Authorization: Bearer <token>

{
  "account_id": 1,
  "category_id": 5,
  "name": "PETR4",
  "type": "stock",
  "amount": 1000.00,
  "quantity": 100,
  "unit_price": 10.00,
  "current_price": 12.50,
  "description": "Ações da Petrobras",
  "status": "active"
}
```

#### Listar investimentos
```bash
GET /investments?status=active&type=stock
Authorization: Bearer <token>
```

#### Obter investimento específico
```bash
GET /investments/1
Authorization: Bearer <token>
```

#### Atualizar investimento
```bash
PUT /investments/1
Authorization: Bearer <token>

{
  "current_price": 13.00,
  "description": "Ações da Petrobras - Atualizado"
}
```

#### Remover investimento
```bash
DELETE /investments/1
Authorization: Bearer <token>
```

### 2. Metas de Investimento

#### Criar uma nova meta
```bash
POST /investment-goals
Authorization: Bearer <token>

{
  "name": "Reserva de Emergência",
  "target_amount": 50000.00,
  "current_amount": 15000.00,
  "target_date": "2024-12-31",
  "description": "Reserva para emergências",
  "priority": "high",
  "status": "active"
}
```

#### Listar metas
```bash
GET /investment-goals?status=active&priority=high
Authorization: Bearer <token>
```

#### Atualizar meta
```bash
PUT /investment-goals/1
Authorization: Bearer <token>

{
  "current_amount": 20000.00
}
```

### 3. Aportes de Investimento

#### Criar um novo aporte
```bash
POST /investments/1/contributions
Authorization: Bearer <token>

{
  "amount": 500.00,
  "quantity": 40,
  "unit_price": 12.50,
  "contribution_date": "2024-01-15",
  "description": "Aporte mensal PETR4"
}
```

#### Listar aportes de um investimento
```bash
GET /investments/1/contributions?start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer <token>
```

#### Obter estatísticas dos aportes
```bash
GET /investments/1/contributions/stats?start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer <token>
```

Resposta esperada:
```json
{
  "total_contributions": 12,
  "total_amount": 15000.00,
  "total_quantity": 1200,
  "average_unit_price": 12.50,
  "first_contribution_date": "2024-01-15",
  "last_contribution_date": "2024-12-15",
  "monthly_contributions": [
    {
      "month": "2024-01",
      "total_amount": 1250.00,
      "total_quantity": 100
    },
    {
      "month": "2024-02",
      "total_amount": 1250.00,
      "total_quantity": 100
    }
  ]
}
```

#### Atualizar aporte
```bash
PUT /investments/1/contributions/5
Authorization: Bearer <token>

{
  "amount": 600.00,
  "quantity": 48,
  "unit_price": 12.50,
  "description": "Aporte mensal PETR4 - Corrigido"
}
```

#### Remover aporte
```bash
DELETE /investments/1/contributions/5
Authorization: Bearer <token>
```

## Fluxo Completo de Exemplo

### 1. Criar uma conta
```bash
POST /accounts
{
  "bank_name": "Banco do Brasil",
  "account_type": "checking",
  "balance": 10000.00,
  "description": "Conta principal"
}
```

### 2. Criar uma categoria
```bash
POST /categories
{
  "name": "Investimentos",
  "type": "expense"
}
```

### 3. Criar um investimento
```bash
POST /investments
{
  "account_id": 1,
  "category_id": 5,
  "name": "PETR4",
  "type": "stock",
  "amount": 1000.00,
  "quantity": 100,
  "unit_price": 10.00,
  "description": "Ações da Petrobras"
}
```

### 4. Fazer aportes mensais
```bash
# Janeiro
POST /investments/1/contributions
{
  "amount": 500.00,
  "quantity": 40,
  "unit_price": 12.50,
  "contribution_date": "2024-01-15",
  "description": "Aporte janeiro"
}

# Fevereiro
POST /investments/1/contributions
{
  "amount": 500.00,
  "quantity": 38,
  "unit_price": 13.15,
  "contribution_date": "2024-02-15",
  "description": "Aporte fevereiro"
}
```

### 5. Verificar estatísticas
```bash
GET /investments/1/contributions/stats
```

### 6. Atualizar preço atual
```bash
PUT /investments/1
{
  "current_price": 14.00
}
```

## Códigos de Status HTTP

- `200` - Sucesso (GET, PUT)
- `201` - Criado com sucesso (POST)
- `204` - Removido com sucesso (DELETE)
- `400` - Dados inválidos
- `401` - Não autorizado
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

## Validações

### Investimentos
- `account_id` e `category_id` devem existir
- `amount`, `quantity`, `unit_price` devem ser números positivos
- `type` deve ser um dos valores permitidos
- `status` deve ser um dos valores permitidos

### Metas de Investimento
- `target_amount` deve ser maior que zero
- `target_date` deve ser uma data futura
- `priority` deve ser um dos valores permitidos

### Aportes
- `investment_id` deve existir
- `amount`, `quantity`, `unit_price` devem ser números positivos
- `contribution_date` deve ser uma data válida
- O valor total (`amount`) deve ser igual a `quantity * unit_price`

## Funcionalidades Automáticas

1. **Cálculo de Totais**: O sistema calcula automaticamente `total_invested`, `total_quantity` e `average_price` baseado nos aportes
2. **Transações**: Cada aporte cria automaticamente uma transação de saída na conta
3. **Progresso de Metas**: O sistema calcula automaticamente o `progress_percentage` das metas
4. **Validações**: Todas as operações são validadas antes de serem executadas 