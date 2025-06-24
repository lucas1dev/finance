# 📚 Documentação do Projeto Finance

## 📋 Visão Geral

Este documento centraliza todas as informações sobre a documentação do projeto Finance, incluindo guias, relatórios, especificações e recursos disponíveis.

## 🎯 Status Atual do Projeto

### ✅ Validações e Segurança
- **Validações Zod**: Implementadas em todos os controllers principais
- **Autenticação JWT**: Sistema seguro de autenticação
- **Autorização**: Middlewares de permissão e admin
- **Validação de Documentos**: CPF e CNPJ validados
- **Tratamento de Erros**: Middleware centralizado de erros

### 🧪 Status dos Testes
- **43 suítes de teste**: Todas passando ✅
- **618 testes**: Todos passando ✅
- **1 teste pulado**: Configuração específica
- **Cobertura**: Configurada e monitorada
- **Execução**: Sequencial para evitar conflitos

### 🔧 Controllers com Validação Zod
- ✅ **authController**: Login, registro, recuperação de senha
- ✅ **transactionController**: CRUD de transações
- ✅ **accountController**: CRUD de contas
- ✅ **categoryController**: CRUD de categorias
- ✅ **customerController**: CRUD de clientes
- ✅ **supplierController**: CRUD de fornecedores
- ✅ **paymentController**: CRUD de pagamentos
- ✅ **receivableController**: CRUD de contas a receber
- ✅ **payableController**: CRUD de contas a pagar
- ✅ **financingController**: CRUD de financiamentos
- ✅ **investmentController**: CRUD de investimentos

## 📁 Estrutura da Documentação

```
server/
├── docs/
│   ├── jsdoc/                    # Documentação JSDoc gerada
│   │   ├── index.html            # Página principal
│   │   ├── controllers/          # Documentação dos controllers
│   │   ├── models/               # Documentação dos models
│   │   ├── middlewares/          # Documentação dos middlewares
│   │   ├── routes/               # Documentação das rotas
│   │   ├── services/             # Documentação dos services
│   │   └── utils/                # Documentação dos utils
│   ├── openapi.yaml              # Especificação OpenAPI/Swagger
│   ├── README.md                 # README da documentação
│   ├── README.md                 # README principal do projeto
│   ├── TESTING_GUIDE.md          # Guia completo de testes
│   ├── TESTING_PATTERNS.md       # Padrões de teste estabelecidos
│   ├── TEST_STATUS_REPORT.md     # Relatório de status dos testes
│   ├── TASKS_MELHORIAS.md        # Lista de melhorias e tarefas
│   ├── CHANGELOG.md              # Histórico de mudanças
│   └── PRODUCTION.md             # Guia de produção
└── jsdoc.json                    # Configuração JSDoc
```

## 🔧 Como Gerar a Documentação

### Documentação JSDoc

```bash
# Gerar documentação JSDoc
npm run docs

# Servir documentação localmente
npm run docs:serve

# Gerar em modo watch (desenvolvimento)
npm run docs:watch
```

### Documentação OpenAPI

```bash
# A documentação OpenAPI está em docs/openapi.yaml
# Pode ser visualizada em:
# - Swagger UI: http://localhost:3001/api-docs
# - Editor online: https://editor.swagger.io/
```

## 📖 Documentos Principais

### 1. README.md
**Arquivo**: `server/docs/README.md`  
**Descrição**: Documentação principal do projeto com:
- Visão geral do sistema
- Tecnologias utilizadas
- Configuração do ambiente
- Modelos do banco de dados
- Endpoints da API
- Comandos úteis
- Status do projeto
- Histórico de mudanças

### 2. TESTING_GUIDE.md
**Arquivo**: `server/docs/TESTING_GUIDE.md`  
**Descrição**: Guia completo de testes incluindo:
- Configuração do ambiente de testes
- Tipos de teste (unitários e integração)
- Padrões e boas práticas
- Comandos de execução
- Solução de problemas
- Exemplos práticos

### 3. TESTING_PATTERNS.md
**Arquivo**: `server/docs/TESTING_PATTERNS.md`  
**Descrição**: Padrões estabelecidos para testes:
- Estrutura de testes unitários
- Estrutura de testes de integração
- Padrões de criação de dados
- Boas práticas
- Solução de problemas comuns
- Exemplos práticos

### 4. TEST_STATUS_REPORT.md
**Arquivo**: `server/docs/TEST_STATUS_REPORT.md`  
**Descrição**: Relatório detalhado do status dos testes:
- Status de cada suíte de teste
- Métricas de sucesso
- Problemas conhecidos
- Melhorias implementadas
- Próximos passos

### 5. TASKS_MELHORIAS.md
**Arquivo**: `server/docs/TASKS_MELHORIAS.md`  
**Descrição**: Lista de melhorias e tarefas:
- Status geral do projeto
- Melhorias implementadas
- Tarefas em progresso
- Priorização de tarefas
- Próximos passos

### 6. CHANGELOG.md
**Arquivo**: `server/docs/CHANGELOG.md`  
**Descrição**: Histórico completo de mudanças:
- Todas as versões do projeto
- Funcionalidades adicionadas
- Correções realizadas
- Melhorias implementadas
- Mudanças de breaking

## 🎯 Documentação da API

### Especificação OpenAPI
**Arquivo**: `server/docs/openapi.yaml`  
**Descrição**: Especificação completa da API REST:
- Todos os endpoints documentados
- Schemas de dados detalhados
- Exemplos de requisição/resposta
- Códigos de erro
- Autenticação JWT
- Validações Zod implementadas

### Documentação JSDoc
**Localização**: `server/docs/jsdoc/`  
**Descrição**: Documentação detalhada do código:
- Controllers com JSDoc completo
- Models com associações
- Middlewares documentados
- Utils e helpers
- Services e rotas
- Validações Zod documentadas

## 🧪 Documentação de Testes

### Configuração de Testes
- **Jest Unit**: `jest.unit.config.js`
- **Jest Integration**: `jest.integration.config.js`
- **Jest Principal**: `jest.config.js`

### Scripts de Teste
```bash
# Testes unitários
npm run test:unit
npm run test:unit:watch
npm run test:unit:coverage

# Testes de integração
npm run test:integration
npm run test:integration:watch
npm run test:integration:coverage

# Execução sequencial
npm run test:integration:sequential
node run-integration-tests.js

# Todos os testes
npm test
```

### Status Atual dos Testes
```bash
Test Suites: 43 passed, 43 total
Tests:       1 skipped, 618 passed, 619 total
Snapshots:   0 total
Time:        47.439 s
```

## 📊 Status da Documentação

### ✅ Documentação Completa
- [x] **JSDoc**: Todos os arquivos documentados
- [x] **OpenAPI**: Especificação completa
- [x] **Guias de teste**: Padrões estabelecidos
- [x] **README**: Documentação principal
- [x] **Relatórios**: Status atualizado
- [x] **CHANGELOG**: Histórico completo
- [x] **Validações Zod**: Documentadas e implementadas

### 📈 Métricas
- **Cobertura JSDoc**: 100%
- **Endpoints documentados**: 100%
- **Guias criados**: 4/4
- **Relatórios atualizados**: 3/3
- **Controllers com validação**: 11/11
- **Testes passando**: 618/618

## 🔄 Manutenção da Documentação

### Atualizações Automáticas
- **JSDoc**: Gerado automaticamente via `npm run docs`
- **OpenAPI**: Atualizado manualmente quando necessário
- **Relatórios**: Atualizados após mudanças nos testes

### Atualizações Manuais
- **README.md**: Atualizado quando há mudanças estruturais
- **Guias**: Atualizados quando há mudanças nos padrões
- **Tarefas**: Revisadas semanalmente
- **CHANGELOG.md**: Atualizado a cada release

## 🚀 Como Usar a Documentação

### Para Desenvolvedores
1. **Leia o README.md** para entender o projeto
2. **Consulte TESTING_GUIDE.md** para padrões de teste
3. **Use TESTING_PATTERNS.md** como referência
4. **Verifique TEST_STATUS_REPORT.md** para status atual

### Para Testes
1. **Siga TESTING_PATTERNS.md** para estrutura
2. **Use TESTING_GUIDE.md** para configuração
3. **Execute com comandos sequenciais**
4. **Verifique relatório de status**

### Para API
1. **Consulte docs/openapi.yaml** para especificação
2. **Use docs/jsdoc/** para detalhes do código
3. **Teste endpoints via Swagger UI**
4. **Verifique exemplos nos controllers**

## 📝 Padrões de Documentação

### JSDoc
```javascript
/**
 * Descrição da função
 * @param {string} param1 - Descrição do parâmetro
 * @param {number} param2 - Descrição do parâmetro
 * @returns {Object} Descrição do retorno
 * @throws {Error} Descrição do erro
 * @example
 * // Exemplo de uso
 * const result = functionName('test', 123);
 */
```

### OpenAPI
```yaml
paths:
  /api/resource:
    get:
      summary: Descrição do endpoint
      description: Descrição detalhada
      parameters:
        - name: param
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Resource'
```

### Validação Zod
```javascript
/**
 * Esquema de validação para criação de recurso
 */
const createResourceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  type: z.enum(['type1', 'type2'])
});
```

## 🔧 Troubleshooting

### Problemas Comuns

#### Testes Falhando
```bash
# Verificar configuração do banco de teste
npm run test:setup

# Executar testes sequencialmente
node run-integration-tests.js

# Verificar logs de erro
npm test -- --verbose
```

#### Documentação JSDoc
```bash
# Limpar cache e regenerar
rm -rf docs/jsdoc
npm run docs

# Verificar configuração
cat jsdoc.json
```

#### Validações Zod
```bash
# Verificar esquemas de validação
cat utils/validators.js

# Testar validações específicas
npm test -- --testNamePattern="validation"
```

## 🎉 Melhorias Recentes

### Validações Implementadas
- ✅ **Zod Schema**: Validação robusta em todos os controllers
- ✅ **Tratamento de Erros**: Mensagens específicas para testes
- ✅ **Documentos**: Validação de CPF e CNPJ
- ✅ **Campos Opcionais**: Suporte a campos nulos/vazios

### Segurança Aprimorada
- ✅ **Autenticação JWT**: Tokens seguros
- ✅ **Autorização**: Middlewares de permissão
- ✅ **Rate Limiting**: Proteção contra ataques
- ✅ **Helmet**: Headers de segurança

### Testes Otimizados
- ✅ **Execução Sequencial**: Evita conflitos
- ✅ **Cobertura Completa**: Todos os endpoints testados
- ✅ **Mocks Configurados**: Dependências externas
- ✅ **Relatórios Detalhados**: Status em tempo real

## Categorias Padrão e Personalizadas

O sistema possui dois tipos de categorias:

- **Categorias padrão**: pré-cadastradas pelo sistema, disponíveis para todos os usuários. São identificadas pelo campo `is_default: true` e **não podem ser editadas ou excluídas**.
- **Categorias personalizadas**: criadas pelo próprio usuário, identificadas por `is_default: false`. Podem ser editadas e removidas livremente.

### Campos importantes
- `color`: Cor da categoria em hexadecimal (ex: `#4CAF50`). Opcional na criação, o sistema atribui uma cor padrão conforme o tipo.
- `is_default`: Booleano. Indica se a categoria é padrão do sistema.

### Exemplo de resposta de categoria
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Salário",
  "type": "income",
  "color": "#4CAF50",
  "is_default": true,
  "created_at": "2024-06-22T12:00:00Z",
  "updated_at": "2024-06-22T12:00:00Z"
}
```

### Restrições
- **Categorias padrão** (`is_default: true`) não podem ser editadas ou excluídas via API.
- O usuário pode criar quantas categorias personalizadas desejar.

### Como rodar as migrations e o seeder de categorias padrão
```bash
npx sequelize-cli db:migrate
node insert-default-categories.js
```

Esses comandos garantem que todas as categorias padrão estejam disponíveis para todos os usuários.

---

**Última atualização**: Junho 2025  
**Versão**: 2.0.0  
**Status**: ✅ Produção Pronta 