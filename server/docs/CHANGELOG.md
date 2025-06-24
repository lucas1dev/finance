# 📝 Changelog - Sistema Financeiro

## [2.1.0] - 2025-06-21

### ✅ Adicionado
- **Validações Zod Completas**: Implementação de validações robustas em todos os controllers principais
- **Documentação Atualizada**: README, OpenAPI e relatórios atualizados com informações mais recentes
- **Tratamento de Erros Melhorado**: Mensagens específicas para validações Zod
- **Status de Testes Atualizado**: 618 testes passando, 43 suítes funcionando

### 🔧 Melhorado
- **Controllers com Validação**: authController, transactionController, accountController, categoryController, customerController, supplierController, paymentController, receivableController, payableController, financingController, investmentController
- **Mensagens de Erro**: Tratamento customizado de erros ZodError com mensagens específicas
- **Documentação JSDoc**: Regenerada com informações atualizadas
- **Especificação OpenAPI**: Atualizada com validações Zod e status dos testes

### 🐛 Corrigido
- **Mensagens de Validação**: Ajustadas para corresponder aos testes
- **Campos Opcionais**: Suporte adequado a campos nulos/vazios
- **Documentos**: Validação correta de CPF e CNPJ
- **Logging**: Correção de logs assíncronos após término dos testes

### 📚 Documentação
- **README.md**: Atualizado com status atual e funcionalidades
- **DOCUMENTATION.md**: Informações sobre validações Zod e testes
- **TEST_STATUS_REPORT.md**: Relatório atualizado com 618 testes passando
- **openapi.yaml**: Especificação atualizada com validações implementadas

### 🧪 Testes
- **Status Final**: 43 suítes passando, 618 testes passando, 1 pulado
- **Validações Testadas**: Todos os esquemas Zod validados
- **Cobertura**: 100% dos endpoints principais testados
- **Performance**: Execução em ~47 segundos

---

## [2.0.0] - 2025-06-20

### ✅ Adicionado
- **Sistema Robusto de Testes**: Execução sequencial de testes de integração
- **Sistema de Financiamentos**: Modelos, controllers e endpoints completos
- **Sistema de Contas Fixas**: Campo is_paid e endpoints de toggle
- **Sistema de Pagáveis**: CRUD completo com relacionamentos
- **Sistema de Notificações**: Jobs em background e tracking
- **Sistema de Usuários Administradores**: Controle de permissões

### 🔧 Melhorado
- **Infraestrutura de Testes**: Configuração Jest otimizada
- **Banco de Dados**: Schema SQL completo
- **Documentação**: JSDoc, OpenAPI e guias completos

### 🐛 Corrigido
- **Conflitos de Dados**: Isolamento completo entre testes
- **Problemas de Autenticação**: Tokens JWT válidos
- **Configuração Jest**: Opções inválidas removidas

---

## [1.1.0] - 2024-12-15

### ✅ Adicionado
- Sistema de investimentos implementado
- Venda de ativos adicionada
- Testes de integração criados
- Documentação OpenAPI atualizada

---

## [1.0.0] - 2024-01-01

### ✅ Adicionado
- Sistema base implementado
- CRUD completo para recursos principais
- Autenticação JWT configurada
- Testes básicos criados

---

## [Nova] Categorias padrão do sistema
- Adicionado campo `is_default` ao modelo e tabela de categorias.
- Implementado seeder para inserir categorias padrão de receitas e despesas para todos os usuários.
- Usuários podem criar, editar e excluir apenas categorias personalizadas (`is_default: false`).
- Categorias padrão (`is_default: true`) não podem ser editadas ou excluídas.
- Todos os endpoints de categoria agora retornam os campos `color` e `is_default`.
- Documentação Swagger e arquivos de documentação atualizados para refletir as mudanças.

**Formato**: [Semantic Versioning](https://semver.org/)  
**Convenção**: [Conventional Commits](https://www.conventionalcommits.org/) 