# Documentação JSDoc - API Finance

Esta é a documentação automática gerada pelo JSDoc para o sistema financeiro.

## Como acessar

### Opção 1: Servidor Local
```bash
# Na pasta server/
npm run docs:serve
```
A documentação será aberta automaticamente no navegador em `http://localhost:8080`

### Opção 2: Abrir arquivo diretamente
Abra o arquivo `index.html` em qualquer navegador web.

### Opção 3: Servidor de desenvolvimento
```bash
# Na pasta server/
npm run docs:watch
```
Isso irá gerar a documentação automaticamente quando houver mudanças nos arquivos.

## Estrutura da Documentação

### Controllers
- **AccountController**: Gerenciamento de contas bancárias
- **AuthController**: Autenticação e autorização de usuários
- **CategoryController**: Gerenciamento de categorias
- **CustomerController**: Gerenciamento de clientes
- **PayableController**: Gerenciamento de contas a pagar
- **PaymentController**: Gerenciamento de pagamentos
- **ReceivableController**: Gerenciamento de contas a receber
- **SupplierController**: Gerenciamento de fornecedores

### Models
- **Account**: Modelo de conta bancária
- **Category**: Modelo de categoria
- **Customer**: Modelo de cliente
- **Payable**: Modelo de conta a pagar
- **Payment**: Modelo de pagamento
- **Receivable**: Modelo de conta a receber
- **Supplier**: Modelo de fornecedor
- **Transaction**: Modelo de transação
- **User**: Modelo de usuário

### Middlewares
- **Auth**: Middleware de autenticação JWT
- **ErrorMiddleware**: Tratamento de erros

### Utils
- **Config**: Configurações do sistema
- **Constants**: Constantes utilizadas no sistema
- **Database**: Configuração do banco de dados
- **Errors**: Classes de erro customizadas
- **Helpers**: Funções auxiliares
- **Response**: Utilitários para respostas HTTP
- **Validators**: Validações com Zod

## Como usar a documentação

1. **Navegação**: Use o menu lateral para navegar entre os módulos
2. **Busca**: Use a barra de pesquisa para encontrar funções específicas
3. **Exemplos**: Cada função possui exemplos de uso
4. **Parâmetros**: Todos os parâmetros e tipos são documentados
5. **Retornos**: Valores de retorno e tipos são especificados

## Atualizando a documentação

Para atualizar a documentação após mudanças no código:

```bash
npm run docs
```

Para desenvolvimento com atualização automática:

```bash
npm run docs:watch
```

## Comandos úteis

```bash
# Gerar documentação
npm run docs

# Servir documentação localmente
npm run docs:serve

# Gerar documentação em modo watch
npm run docs:watch
``` 