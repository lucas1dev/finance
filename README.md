# 🏦 Sistema Financeiro - Backend

Sistema completo de gestão financeira com API RESTful desenvolvido em Node.js, Express e Sequelize.

## 🚀 Funcionalidades

### 📊 Módulos Principais

- **👤 Autenticação**: Sistema de login/registro com JWT
- **💰 Contas**: Gestão de contas bancárias
- **📂 Categorias**: Organização de transações por categorias
- **👥 Clientes**: Cadastro e gestão de clientes
- **📈 Transações**: Registro de receitas e despesas
- **📋 Contas a Receber**: Gestão de recebíveis
- **💳 Contas a Pagar**: Gestão de pagamentos
- **🏢 Fornecedores**: Cadastro de fornecedores
- **🔄 Contas Fixas**: Gestão de despesas recorrentes
- **💸 Pagamentos**: Sistema de pagamentos

### 🆕 Funcionalidade: Contas Fixas

Sistema completo de gestão de contas fixas (despesas recorrentes) com as seguintes funcionalidades:

- ✅ Criação e gestão de contas fixas
- ✅ Diferentes periodicidades (diária, semanal, mensal, trimestral, anual)
- ✅ Sistema de ativação/desativação
- ✅ Cálculo automático de próximos vencimentos
- ✅ Integração com sistema de transações
- ✅ Associação com categorias e fornecedores
- ✅ Sistema de lembretes configurável
- ✅ API RESTful completa

### 🎨 Funcionalidade: Categorias Padrão e Personalizadas

Sistema inteligente de categorização com categorias pré-definidas e personalização:

- ✅ **Categorias Padrão**: 12 categorias pré-definidas (receitas e despesas)
- ✅ **Proteção de Dados**: Categorias padrão não podem ser editadas/excluídas
- ✅ **Cores Personalizadas**: Suporte a cores hexadecimais para categorias
- ✅ **Categorias Personalizadas**: Usuários podem criar suas próprias categorias
- ✅ **Atribuição Automática**: Cores são atribuídas automaticamente se não informadas

**Categorias Padrão Incluídas:**
- **Receitas**: Salário, Freelance, Investimentos, Outros
- **Despesas**: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Vestuário, Outros

## 🛠️ Tecnologias

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Sequelize** - ORM para MySQL
- **MySQL** - Banco de dados
- **JWT** - Autenticação
- **Zod** - Validação de dados
- **Jest** - Testes unitários e integração
- **Supertest** - Testes de API

### Frontend
- **React** - Framework frontend
- **Vite** - Build tool
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Estilização
- **Shadcn/UI** - Componentes

## 📦 Instalação

### Pré-requisitos
- Node.js (v16 ou superior)
- MySQL (v8.0 ou superior)
- npm ou yarn

### Backend

```bash
# Navegar para o diretório do servidor
cd server

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar o arquivo .env com suas configurações

# Executar migrations
npm run migrate

# Iniciar servidor de desenvolvimento
npm run dev

# Executar testes
npm test
```

### Configuração Inicial

Após executar as migrações, execute o seeder para criar as categorias padrão:

```bash
# Executar seeder de categorias padrão
npm run seed
```

**O que o seeder faz:**
- Cria 12 categorias padrão (4 receitas + 8 despesas)
- Atribui cores automáticas para cada categoria
- Define `is_default: true` para proteção
- Disponibiliza categorias para todos os usuários

**Categorias Criadas:**
```javascript
// Receitas (verde/amarelo)
{ name: 'Salário', type: 'income', color: '#4CAF50', is_default: true }
{ name: 'Freelance', type: 'income', color: '#8BC34A', is_default: true }
{ name: 'Investimentos', type: 'income', color: '#FFC107', is_default: true }
{ name: 'Outros', type: 'income', color: '#9E9E9E', is_default: true }

// Despesas (vermelho/azul/roxo)
{ name: 'Alimentação', type: 'expense', color: '#FF5722', is_default: true }
{ name: 'Transporte', type: 'expense', color: '#2196F3', is_default: true }
{ name: 'Moradia', type: 'expense', color: '#673AB7', is_default: true }
{ name: 'Saúde', type: 'expense', color: '#E91E63', is_default: true }
{ name: 'Educação', type: 'expense', color: '#3F51B5', is_default: true }
{ name: 'Lazer', type: 'expense', color: '#FF9800', is_default: true }
{ name: 'Vestuário', type: 'expense', color: '#795548', is_default: true }
{ name: 'Outros', type: 'expense', color: '#607D8B', is_default: true }
```

### Frontend

```bash
# Navegar para o diretório do cliente
cd client

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na pasta `server/` com as seguintes variáveis:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=finance
DB_USER=root
DB_PASSWORD=sua_senha

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📚 API Documentation

### Endpoints de Contas Fixas

#### Criar Conta Fixa
```http
POST /api/fixed-accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Aluguel",
  "amount": 1500.00,
  "periodicity": "monthly",
  "start_date": "2024-01-01",
  "category_id": 1,
  "supplier_id": 1,
  "payment_method": "boleto",
  "reminder_days": 3,
  "observations": "Aluguel do escritório"
}
```

#### Listar Contas Fixas
```http
GET /api/fixed-accounts
Authorization: Bearer <token>
```

#### Obter Conta Fixa
```http
GET /api/fixed-accounts/:id
Authorization: Bearer <token>
```

#### Atualizar Conta Fixa
```http
PUT /api/fixed-accounts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1600.00,
  "observations": "Aumento do aluguel"
}
```

#### Ativar/Desativar Conta Fixa
```http
PATCH /api/fixed-accounts/:id/toggle
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_active": false
}
```

#### Pagar Conta Fixa
```http
POST /api/fixed-accounts/:id/pay
Authorization: Bearer <token>
Content-Type: application/json

{
  "payment_date": "2024-01-15"
}
```

#### Remover Conta Fixa
```http
DELETE /api/fixed-accounts/:id
Authorization: Bearer <token>
```

### Endpoints de Categorias

#### Listar Categorias (Padrão + Personalizadas)
```http
GET /api/categories
Authorization: Bearer <token>
```

**Resposta:**
```json
[
  {
    "id": 1,
    "name": "Salário",
    "type": "income",
    "color": "#4CAF50",
    "is_default": true,
    "user_id": null
  },
  {
    "id": 13,
    "name": "Viagens",
    "type": "expense",
    "color": "#FF6B6B",
    "is_default": false,
    "user_id": 1
  }
]
```

#### Criar Categoria Personalizada
```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Viagens",
  "type": "expense",
  "color": "#FF6B6B"
}
```

#### Atualizar Categoria Personalizada
```http
PUT /api/categories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Viagens Internacionais",
  "color": "#FF8E53"
}
```

**⚠️ Restrição:** Não é possível editar categorias padrão (`is_default: true`)

#### Excluir Categoria Personalizada
```http
DELETE /api/categories/:id
Authorization: Bearer <token>
```

**⚠️ Restrição:** Não é possível excluir categorias padrão (`is_default: true`)

## 🧪 Testes

### Executar Todos os Testes
```bash
npm test
```

### Testes Unitários
```bash
npm run test:unit
```

### Testes de Integração
```bash
npm run test:integration
```

### Cobertura de Código
```bash
npm run test:coverage
```

## 📊 Estrutura do Projeto

```
finance/
├── server/                 # Backend
│   ├── controllers/        # Controladores da API
│   ├── models/            # Modelos Sequelize
│   ├── routes/            # Rotas da API
│   ├── middlewares/       # Middlewares
│   ├── migrations/        # Migrações do banco
│   ├── utils/             # Utilitários
│   ├── __tests__/         # Testes
│   └── docs/              # Documentação
├── client/                # Frontend
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   ├── hooks/         # Hooks customizados
│   │   └── lib/           # Utilitários
│   └── public/            # Arquivos públicos
└── README.md
```

## 🔒 Segurança

- Autenticação JWT
- Rate limiting
- Validação de dados com Zod
- Sanitização de inputs
- Headers de segurança com Helmet
- CORS configurado

## 📈 Performance

- Compressão gzip
- Rate limiting
- Índices otimizados no banco
- Queries otimizadas com Sequelize

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido com ❤️ para gestão financeira eficiente.

---

**Status do Projeto**: ✅ Funcional e pronto para produção  
**Versão**: 2.1.0  
**Última Atualização**: Junho 2025  
**Funcionalidades**: 
- ✅ Sistema completo de autenticação
- ✅ Gestão de contas e transações
- ✅ Categorias padrão e personalizadas
- ✅ Contas fixas e recorrentes
- ✅ Sistema de investimentos
- ✅ Financiamentos e parcelamentos
- ✅ API RESTful documentada
- ✅ Testes automatizados (618 testes)
- ✅ Validações robustas com Zod
- ✅ Documentação completa (JSDoc + OpenAPI) 