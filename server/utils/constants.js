/**
 * Constantes do sistema.
 * @type {Object}
 */
const constants = {
  userTypes: {
    ADMIN: 'admin',
    USER: 'user'
  },
  
  customerTypes: {
    INDIVIDUAL: 'individual',
    COMPANY: 'company'
  },
  
  accountTypes: {
    CHECKING: 'checking',
    SAVINGS: 'savings',
    INVESTMENT: 'investment'
  },
  
  transactionTypes: {
    INCOME: 'income',
    EXPENSE: 'expense',
    TRANSFER: 'transfer'
  },
  
  transactionStatus: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  paymentMethods: {
    CASH: 'cash',
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    BANK_TRANSFER: 'bank_transfer',
    PIX: 'pix'
  },
  
  paymentStatus: {
    PENDING: 'pending',
    PAID: 'paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled'
  },
  
  documentTypes: {
    CPF: 'cpf',
    CNPJ: 'cnpj'
  },
  
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
  },
  
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: 'Credenciais inválidas',
    UNAUTHORIZED: 'Não autorizado',
    FORBIDDEN: 'Acesso negado',
    NOT_FOUND: 'Recurso não encontrado',
    VALIDATION_ERROR: 'Erro de validação',
    INTERNAL_ERROR: 'Erro interno do servidor',
    BAD_REQUEST: 'Requisição inválida',
    ALREADY_EXISTS: 'Recurso já existe'
  },
  
  SUCCESS_MESSAGES: {
    CREATED: 'Recurso criado com sucesso',
    UPDATED: 'Recurso atualizado com sucesso',
    DELETED: 'Recurso excluído com sucesso',
    LOGGED_IN: 'Login realizado com sucesso',
    LOGGED_OUT: 'Logout realizado com sucesso',
    FOUND: 'Recurso encontrado com sucesso'
  },
  
  validationRules: {
    PASSWORD_MIN_LENGTH: 6,
    NAME_MIN_LENGTH: 3,
    PHONE_LENGTH: 11,
    CPF_LENGTH: 11,
    CNPJ_LENGTH: 14
  }
};

module.exports = constants; 