# 🏦 Sistema Financeiro - Backend

## 📋 Visão Geral

Sistema completo de gerenciamento financeiro pessoal e empresarial com API REST robusta, validações avançadas e autenticação segura.

## 🚀 Status do Projeto

### ✅ Funcionalidades Implementadas
- **43 suítes de teste**: Todas passando ✅
- **618 testes**: Todos passando ✅
- **Validações Zod**: Implementadas em todos os controllers
- **Autenticação JWT**: Sistema seguro
- **Autorização**: Middlewares de permissão
- **Documentação**: JSDoc e OpenAPI completos
- **Categorias Padrão**: Sistema de categorias padrão e personalizadas
- **Cores Personalizadas**: Suporte a cores hexadecimais para categorias
- **Proteção de Dados**: Categorias padrão protegidas contra edição/exclusão

## 🛠️ Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Sequelize** - ORM para MySQL
- **JWT** - Autenticação segura
- **Zod** - Validação de dados
- **Jest** - Framework de testes
- **Swagger** - Documentação da API
- **Helmet** - Segurança HTTP
- **Rate Limiting** - Proteção contra ataques

## 📁 Estrutura do Projeto

```
server/
├── controllers/          # Lógica de negócio
├── models/              # Modelos Sequelize
├── routes/              # Definição de rotas
├── middlewares/         # Middlewares (auth, validação)
├── services/            # Serviços externos
├── utils/               # Utilitários e helpers
├── docs/                # Documentação
├── __tests__/           # Testes unitários e integração
├── migrations/          # Migrações do banco
└── config/              # Configurações
```

## 🔧 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- MySQL 8.0+
- npm ou yarn

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

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
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
Test Suites: 43 passed, 43 total
Tests:       1 skipped, 618 passed, 619 total
Snapshots:   0 total
Time:        47.439 s
```

## 📚 Documentação

### API Documentation
- **Swagger UI**: http://localhost:3001/api-docs
- **OpenAPI Spec**: `docs/openapi.yaml`
- **JSDoc**: `docs/jsdoc/`

### Documentos Disponíveis
- [Guia de Testes](docs/TESTING_GUIDE.md)
- [Padrões de Teste](docs/TESTING_PATTERNS.md)
- [Status dos Testes](docs/TEST_STATUS_REPORT.md)
- [Tarefas e Melhorias](docs/TASKS_MELHORIAS.md)
- [Configuração de Email](docs/EMAIL_CONFIGURATION.md)
- [Guia de Produção](docs/PRODUCTION.md)

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
- `GET /api/investment-goals` - Listar metas
- `POST /api/investment-goals` - Criar meta

### Financiamentos
- `GET /api/financings` - Listar financiamentos
- `POST /api/financings` - Criar financiamento
- `GET /api/financing-payments` - Listar pagamentos
- `POST /api/financing-payments` - Criar pagamento

## 🔒 Validações Implementadas

### Controllers com Validação Zod
- ✅ **authController** - Login, registro, recuperação
- ✅ **transactionController** - CRUD de transações
- ✅ **accountController** - CRUD de contas
- ✅ **categoryController** - CRUD de categorias
- ✅ **customerController** - CRUD de clientes
- ✅ **supplierController** - CRUD de fornecedores
- ✅ **paymentController** - CRUD de pagamentos
- ✅ **receivableController** - CRUD de recebíveis
- ✅ **payableController** - CRUD de pagáveis
- ✅ **financingController** - CRUD de financiamentos
- ✅ **investmentController** - CRUD de investimentos

### Validações Específicas
- **Documentos**: CPF e CNPJ validados
- **Emails**: Formato e unicidade
- **Senhas**: Complexidade e confirmação
- **Valores**: Números positivos
- **Datas**: Formato e validade
- **Campos Obrigatórios**: Validação completa
- **Cores**: Formato hexadecimal válido para categorias
- **Categorias Padrão**: Proteção contra edição/exclusão

## 🛡️ Segurança

### Middlewares de Segurança
- **Helmet**: Headers de segurança HTTP
- **Rate Limiting**: Proteção contra ataques
- **CORS**: Configuração de origens permitidas
- **JWT**: Autenticação segura
- **Validação**: Entrada de dados validada

### Boas Práticas
- Senhas criptografadas com bcrypt
- Tokens JWT com expiração
- Validação de entrada com Zod
- Logs estruturados
- Tratamento de erros centralizado

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
**Última atualização**: Junho 2025  
**Status**: ✅ Produção Pronta  
**Licença**: MIT