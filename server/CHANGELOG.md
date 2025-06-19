# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado
- **Sistema completo de Investimentos e Aportes**
  - Modelos Sequelize: `Investment`, `InvestmentGoal`, `InvestmentContribution`
  - Migrations para criação das tabelas e relacionamentos
  - Esquemas de validação Zod para cada entidade
  - Controllers com CRUD completo, estatísticas e cálculos
  - Rotas Express protegidas por JWT para investimentos, metas e aportes
  - Testes de integração com Jest e Supertest
  - Documentação JSDoc em todos os controllers, modelos e middlewares
  - Atualização da documentação OpenAPI/Swagger (`server/docs/openapi.yaml`)

### Corrigido
- Conflitos de rotas entre `/investment/:investmentId` e `/:id`
- Parâmetros de rota e validação de IDs
- Substituição do helper de resposta por respostas Express padrão
- Ajuste de tipos para campos DECIMAL do Sequelize

### Testes
- Testes de integração para investimentos e aportes cobrindo:
  - Criação, listagem, atualização, exclusão e estatísticas
  - Autenticação JWT e validação de dados

### Documentação
- OpenAPI/Swagger atualizado com todos os endpoints, parâmetros, exemplos e respostas
- JSDoc presente em todos os controllers, modelos, middlewares e validações

## [1.0.0] - 2024-01-01

### Adicionado
- Sistema de autenticação com JWT
- CRUD de usuários
- CRUD de contas bancárias
- CRUD de categorias
- CRUD de clientes
- CRUD de contas a receber
- CRUD de contas a pagar
- CRUD de transações
- CRUD de fornecedores
- CRUD de contas fixas
- Sistema de validação com Zod
- Middleware de autenticação
- Middleware de tratamento de erros
- Documentação OpenAPI/Swagger
- Testes unitários e de integração
- Configuração de banco de dados MySQL
- Migrations e seeders
- Logs estruturados
- Configuração de produção com PM2

### Segurança
- Autenticação JWT obrigatória para rotas protegidas
- Validação de entrada com Zod
- Sanitização de dados
- Rate limiting
- Headers de segurança com Helmet

### Performance
- Conexão pool com banco de dados
- Índices otimizados
- Paginação em listagens
- Cache de consultas frequentes

---

## Tipos de Mudanças

- **Adicionado** para novas funcionalidades
- **Alterado** para mudanças em funcionalidades existentes
- **Descontinuado** para funcionalidades que serão removidas em breve
- **Removido** para funcionalidades removidas
- **Corrigido** para correções de bugs
- **Segurança** para vulnerabilidades corrigidas 