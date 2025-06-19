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