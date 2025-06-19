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
- **Venda de ativos de investimentos**
  - Endpoint `POST /investments/positions/{assetName}/sell` para venda de ativos
  - Validação de posição disponível antes da venda
  - Geração automática de transação de entrada (`income`) na conta selecionada
  - Seleção de carteira para recebimento do valor da venda
  - Cálculo automático de lucro/prejuízo da operação
  - Garantia de `category_id` válido para transações (usa categoria do usuário)
  - Endpoint `GET /investments/positions` para listar posições ativas
  - Endpoint `GET /investments/positions/{assetName}` para posição específica
  - Documentação JSDoc detalhada no controller com exemplos de uso
  - Atualização completa do README com exemplos de request/response
  - Documentação OpenAPI atualizada com parâmetros, validações e exemplos
  - Testes de integração para venda de ativos cobrindo casos de sucesso e erro

### Corrigido
- Conflitos de rotas entre `/investment/:investmentId` e `/:id`
- Parâmetros de rota e validação de IDs
- Substituição do helper de resposta por respostas Express padrão
- Ajuste de tipos para campos DECIMAL do Sequelize
- Migração para permitir `category_id` nulo em transações
- Escopo de variáveis no controller de venda de ativos
- Remoção de logs de debug após correção de bugs

### Testes
- Testes de integração para investimentos e aportes cobrindo:
  - Criação, listagem, atualização, exclusão e estatísticas
  - Autenticação JWT e validação de dados
- Testes específicos para venda de ativos:
  - Venda com quantidade disponível
  - Validação de quantidade insuficiente
  - Geração automática de transação
  - Validação de conta e parâmetros obrigatórios

### Documentação
- OpenAPI/Swagger atualizado com todos os endpoints, parâmetros, exemplos e respostas
- JSDoc presente em todos os controllers, modelos, middlewares e validações
- README atualizado com funcionalidades de venda de ativos e exemplos práticos
- Documentação detalhada das validações e fluxo de venda de ativos

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