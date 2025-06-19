# Backend - Sistema Financeiro

## Estrutura do Projeto

```
server/
├── config/             # Configurações do projeto
├── controllers/        # Controladores da aplicação
├── middlewares/        # Middlewares (autenticação, etc)
├── migrations/         # Migrações do banco de dados
├── models/            # Modelos do Sequelize
├── routes/            # Rotas da API
└── .env              # Variáveis de ambiente
```

## Tecnologias Utilizadas

- Node.js
- Express
- Sequelize (ORM)
- MySQL
- JWT (Autenticação)
- Zod (Validação)
- Jest (Testes)

## Configuração do Ambiente

1. Instale as dependências:
```bash
npm install
```

2. Configure o arquivo `.env`:
```env
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=finance
DB_HOST=localhost
DB_PORT=3306
JWT_SECRET=seu_secret_jwt
```

3. Execute as migrações:
```bash
npx sequelize-cli db:migrate
```

## Modelos

### User
- `id`: ID do usuário
- `name`: Nome do usuário
- `email`: Email do usuário
- `password`: Senha (hash)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Customer
- `id`: ID do cliente
- `user_id`: ID do usuário
- `name`: Nome do cliente
- `document_type`: Tipo de documento (CPF/CNPJ)
- `document_number`: Número do documento
- `email`: Email do cliente
- `phone`: Telefone
- `address`: Endereço
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### CustomerType
- `id`: ID do tipo
- `customer_id`: ID do cliente
- `type`: Tipo (customer/supplier)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Account
- `id`: ID da conta
- `user_id`: ID do usuário
- `name`: Nome da conta
- `type`: Tipo da conta
- `balance`: Saldo
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Category
- `id`: ID da categoria
- `user_id`: ID do usuário
- `name`: Nome da categoria
- `type`: Tipo (income/expense)
- `color`: Cor da categoria
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Transaction
- `id`: ID da transação
- `user_id`: ID do usuário
- `account_id`: ID da conta
- `category_id`: ID da categoria
- `type`: Tipo (income/expense)
- `amount`: Valor
- `description`: Descrição
- `date`: Data
- `payment_id`: ID do pagamento (opcional)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Receivable
- `id`: ID da conta a receber
- `user_id`: ID do usuário
- `customer_id`: ID do cliente
- `description`: Descrição
- `amount`: Valor
- `due_date`: Data de vencimento
- `status`: Status (pending/paid/overdue/cancelled)
- `payment_date`: Data do pagamento
- `payment_method`: Método de pagamento
- `notes`: Observações
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Payable
- `id`: ID da conta a pagar
- `user_id`: ID do usuário
- `customer_id`: ID do cliente
- `description`: Descrição
- `amount`: Valor
- `due_date`: Data de vencimento
- `status`: Status (pending/paid/overdue/cancelled)
- `payment_date`: Data do pagamento
- `payment_method`: Método de pagamento
- `notes`: Observações
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Payment
- `id`: ID do pagamento
- `receivable_id`: ID da conta a receber (opcional)
- `payable_id`: ID da conta a pagar (opcional)
- `amount`: Valor
- `payment_date`: Data do pagamento
- `payment_method`: Método de pagamento
- `description`: Descrição
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Investment
- `id`: ID do investimento
- `user_id`: ID do usuário
- `account_id`: ID da conta
- `category_id`: ID da categoria
- `investment_type`: Tipo de investimento (acoes, fiis, renda_fixa, etc.)
- `asset_name`: Nome do ativo
- `ticker`: Código do ativo (opcional)
- `invested_amount`: Valor total investido
- `quantity`: Quantidade de ativos
- `unit_price`: Preço unitário
- `operation_date`: Data da operação
- `operation_type`: Tipo de operação (compra/venda)
- `broker`: Corretora
- `observations`: Observações
- `status`: Status (ativo/inativo)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

#### Funcionalidades Avançadas
- **Venda de ativos de investimentos**: Permite registrar a venda de ativos já adquiridos, gerando automaticamente uma transação de entrada na conta selecionada.
- **Seleção de carteira**: Ao comprar, selecione a conta de onde sai o valor; ao vender, selecione a conta que recebe o valor.
- **Transação automática**: Toda venda gera uma transação do tipo `income` vinculada ao investimento e à conta.
- **Validação de posição**: Não é possível vender mais do que a quantidade disponível.
- **Garantia de category_id**: Sempre é usada uma categoria válida do usuário para a transação.
- **Documentação JSDoc**: Todos os controllers de investimento possuem documentação detalhada.

### InvestmentGoal
- `id`: ID da meta
- `user_id`: ID do usuário
- `investment_id`: ID do investimento
- `name`: Nome da meta
- `target_amount`: Valor alvo
- `target_date`: Data alvo
- `current_amount`: Valor atual
- `description`: Descrição
- `status`: Status (ativa/concluida/cancelada)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### InvestmentContribution
- `id`: ID do aporte
- `user_id`: ID do usuário
- `investment_id`: ID do investimento
- `contribution_date`: Data do aporte
- `amount`: Valor total do aporte
- `quantity`: Quantidade de ativos
- `unit_price`: Preço unitário
- `broker`: Corretora (opcional)
- `observations`: Observações (opcional)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

## Endpoints da API

### Autenticação

#### POST /auth/register
Registra um novo usuário.
```json
{
  "name": "Nome do Usuário",
  "email": "email@exemplo.com",
  "password": "senha123"
}
```

#### POST /auth/login
Autentica um usuário.
```json
{
  "email": "email@exemplo.com",
  "password": "senha123"
}
```

### Usuários

#### GET /users/profile
Retorna o perfil do usuário logado.

#### PUT /users/profile
Atualiza o perfil do usuário.
```json
{
  "name": "Novo Nome",
  "email": "novo@email.com"
}
```

### Clientes

#### GET /customers
Lista todos os clientes do usuário.

#### POST /customers
Cria um novo cliente.
```json
{
  "name": "Nome do Cliente",
  "document_type": "CPF",
  "document_number": "123.456.789-00",
  "email": "cliente@email.com",
  "phone": "(11) 99999-9999",
  "address": "Endereço do Cliente",
  "types": ["customer", "supplier"]
}
```

#### GET /customers/:id
Retorna detalhes de um cliente específico.

#### PUT /customers/:id
Atualiza um cliente.
```json
{
  "name": "Novo Nome",
  "email": "novo@email.com"
}
```

#### DELETE /customers/:id
Remove um cliente.

### Contas

#### GET /accounts
Lista todas as contas do usuário.

#### POST /accounts
Cria uma nova conta.
```json
{
  "name": "Conta Principal",
  "type": "checking",
  "balance": 1000.00
}
```

#### GET /accounts/:id
Retorna detalhes de uma conta específica.

#### PUT /accounts/:id
Atualiza uma conta.
```json
{
  "name": "Novo Nome",
  "balance": 2000.00
}
```

#### DELETE /accounts/:id
Remove uma conta.

### Categorias

#### GET /categories
Lista todas as categorias do usuário.

#### POST /categories
Cria uma nova categoria.
```json
{
  "name": "Alimentação",
  "type": "expense",
  "color": "#FF0000"
}
```

#### GET /categories/:id
Retorna detalhes de uma categoria específica.

#### PUT /categories/:id
Atualiza uma categoria.
```json
{
  "name": "Novo Nome",
  "color": "#00FF00"
}
```

#### DELETE /categories/:id
Remove uma categoria.

### Transações

#### GET /transactions
Lista todas as transações do usuário.

#### POST /transactions
Cria uma nova transação.
```json
{
  "account_id": 1,
  "category_id": 1,
  "type": "expense",
  "amount": 100.00,
  "description": "Compra no supermercado",
  "date": "2024-03-20"
}
```

#### GET /transactions/:id
Retorna detalhes de uma transação específica.

#### PUT /transactions/:id
Atualiza uma transação.
```json
{
  "amount": 150.00,
  "description": "Nova descrição"
}
```

#### DELETE /transactions/:id
Remove uma transação.

### Contas a Receber

#### GET /receivables
Lista todas as contas a receber do usuário.

#### POST /receivables
Cria uma nova conta a receber.
```json
{
  "customer_id": 1,
  "description": "Venda de produto",
  "amount": 1000.00,
  "due_date": "2024-04-20",
  "payment_terms": "À vista"
}
```

#### GET /receivables/:id
Retorna detalhes de uma conta a receber específica.

#### PUT /receivables/:id
Atualiza uma conta a receber.
```json
{
  "amount": 1200.00,
  "due_date": "2024-05-20"
}
```

#### DELETE /receivables/:id
Remove uma conta a receber.

#### GET /receivables/:id/payments
Lista todos os pagamentos de uma conta a receber.

#### POST /receivables/:id/payments
Registra um novo pagamento.
```json
{
  "amount": 500.00,
  "payment_date": "2024-03-20",
  "payment_method": "pix",
  "description": "Pagamento parcial",
  "account_id": 1
}
```

### Contas a Pagar

#### GET /payables
Lista todas as contas a pagar do usuário.

#### POST /payables
Cria uma nova conta a pagar.
```json
{
  "customer_id": 1,
  "description": "Compra de insumos",
  "amount": 1000.00,
  "due_date": "2024-04-20",
  "payment_terms": "30 dias"
}
```

#### GET /payables/:id
Retorna detalhes de uma conta a pagar específica.

#### PUT /payables/:id
Atualiza uma conta a pagar.
```json
{
  "amount": 1200.00,
  "due_date": "2024-05-20"
}
```

#### DELETE /payables/:id
Remove uma conta a pagar.

#### GET /payables/:id/payments
Lista todos os pagamentos de uma conta a pagar.

#### POST /payables/:id/payments
Registra um novo pagamento.
```json
{
  "amount": 500.00,
  "payment_date": "2024-03-20",
  "payment_method": "pix",
  "description": "Pagamento parcial",
  "account_id": 1
}
```

### Investimentos

#### GET /investments
Lista todos os investimentos do usuário com filtros e estatísticas.

#### POST /investments
Cria um novo investimento.
```json
{
  "investment_type": "acoes",
  "asset_name": "Petrobras",
  "ticker": "PETR4",
  "invested_amount": 1000.00,
  "quantity": 100,
  "unit_price": 10.00,
  "operation_date": "2024-03-20",
  "operation_type": "compra",
  "broker": "xp_investimentos",
  "account_id": 1,
  "category_id": 1,
  "observations": "Primeira compra"
}
```

#### GET /investments/:id
Retorna detalhes de um investimento específico.

#### PUT /investments/:id
Atualiza um investimento.
```json
{
  "invested_amount": 1500.00,
  "quantity": 150,
  "observations": "Atualização"
}
```

#### DELETE /investments/:id
Remove um investimento.

#### GET /investments/statistics
Retorna estatísticas gerais dos investimentos.

#### GET /investments/positions
Lista as posições atuais de todos os ativos do usuário.

**Response:**
```json
[
  {
    "asset_name": "Petrobras",
    "ticker": "PETR4",
    "total_quantity": 150,
    "average_price": 12.50,
    "total_invested": 1875.00,
    "current_value": 2250.00,
    "profit_loss": 375.00,
    "profit_loss_percentage": 20.00
  }
]
```

#### POST /investments/positions/{assetName}/sell
Registra a venda de um ativo de investimento.

**Parâmetros da URL:**
- `assetName`: Nome do ativo a ser vendido (ex: "Petrobras")

**Request:**
```json
{
  "quantity": 10,
  "unit_price": 30.00,
  "operation_date": "2024-03-25",
  "account_id": 1,
  "broker": "xp_investimentos",
  "observations": "Venda parcial para realização de lucro"
}
```

**Response:**
```json
{
  "message": "Venda registrada com sucesso",
  "investment": {
    "id": 2,
    "user_id": 1,
    "account_id": 1,
    "category_id": 1,
    "investment_type": "acoes",
    "asset_name": "Petrobras",
    "ticker": "PETR4",
    "invested_amount": 300.00,
    "quantity": 10,
    "unit_price": 30.00,
    "operation_date": "2024-03-25",
    "operation_type": "venda",
    "broker": "xp_investimentos",
    "observations": "Venda parcial para realização de lucro",
    "status": "ativo"
  },
  "transaction": {
    "id": 15,
    "user_id": 1,
    "account_id": 1,
    "category_id": 1,
    "type": "income",
    "amount": 300.00,
    "description": "Venda de 10 PETR4 a R$ 30,00",
    "date": "2024-03-25"
  }
}
```

**Funcionalidades da Venda de Ativos:**
- **Validação de Posição**: Verifica se há quantidade suficiente do ativo para venda
- **Seleção de Carteira**: Permite escolher a conta que receberá o valor da venda
- **Transação Automática**: Gera automaticamente uma transação de entrada (`income`) na conta selecionada
- **Categoria Automática**: Utiliza uma categoria válida do usuário para a transação
- **Cálculo de Lucro/Prejuízo**: Calcula automaticamente o resultado da operação
- **Histórico Completo**: Mantém registro de todas as operações de compra e venda

**Validações:**
- Quantidade disponível para venda
- Conta válida do usuário
- Preço unitário positivo
- Data de operação válida

### Metas de Investimento

#### GET /investment-goals
Lista todas as metas de investimento do usuário.

#### POST /investment-goals
Cria uma nova meta de investimento.
```json
{
  "investment_id": 1,
  "name": "Meta Petrobras",
  "target_amount": 5000.00,
  "target_date": "2024-12-31",
  "description": "Acumular 5000 reais em Petrobras"
}
```

#### GET /investment-goals/:id
Retorna detalhes de uma meta específica.

#### PUT /investment-goals/:id
Atualiza uma meta.
```json
{
  "target_amount": 6000.00,
  "target_date": "2024-11-30"
}
```

#### DELETE /investment-goals/:id
Remove uma meta.

### Aportes de Investimento

#### GET /investment-contributions
Lista todos os aportes do usuário com filtros e paginação.

#### POST /investment-contributions
Cria um novo aporte.
```json
{
  "investment_id": 1,
  "contribution_date": "2024-03-20",
  "amount": 500.00,
  "quantity": 50,
  "unit_price": 10.00,
  "broker": "xp_investimentos",
  "observations": "Aporte mensal"
}
```

#### GET /investment-contributions/:id
Retorna detalhes de um aporte específico.

#### PUT /investment-contributions/:id
Atualiza um aporte.
```json
{
  "amount": 600.00,
  "quantity": 60,
  "observations": "Aporte atualizado"
}
```

#### DELETE /investment-contributions/:id
Remove um aporte.

#### GET /investment-contributions/investment/:investmentId
Lista todos os aportes de um investimento específico.

#### GET /investment-contributions/statistics
Retorna estatísticas gerais dos aportes.

## Middlewares

### AuthMiddleware
Verifica se o usuário está autenticado através do token JWT.

### ErrorHandler
Trata erros da aplicação e retorna respostas apropriadas.

## Configurações

### Database
Configuração do banco de dados MySQL usando Sequelize.

### JWT
Configuração do JWT para autenticação.

## Scripts Disponíveis

- `npm start`: Inicia o servidor
- `npm run dev`: Inicia o servidor em modo desenvolvimento
- `npm run migrate`: Executa as migrações do banco de dados
- `npm run seed`: Popula o banco com dados iniciais
- `npm test`: Executa os testes
- `npm run test:coverage`: Executa os testes com cobertura

## Testes

O projeto inclui testes unitários e de integração para todas as funcionalidades:

```bash
# Executar todos os testes
npm test

# Executar testes com cobertura
npm run test:coverage

# Executar testes específicos
npm test -- __tests__/integration/investmentContribution.test.js
```

## Documentação da API

A documentação completa da API está disponível via Swagger UI:

```
http://localhost:3001/api-docs
```

## Segurança

- Autenticação via JWT
- Senhas criptografadas com bcrypt
- Validação de dados com Zod
- Proteção contra SQL Injection (Sequelize)
- CORS configurado
- Rate limiting
- Sanitização de inputs 