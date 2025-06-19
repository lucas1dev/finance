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
  
  errorMessages: {
    INVALID_CREDENTIALS: 'Credenciais inválidas',
    UNAUTHORIZED: 'Não autorizado',
    FORBIDDEN: 'Acesso negado',
    NOT_FOUND: 'Recurso não encontrado',
    VALIDATION_ERROR: 'Erro de validação',
    INTERNAL_ERROR: 'Erro interno do servidor'
  },
  
  successMessages: {
    CREATED: 'Recurso criado com sucesso',
    UPDATED: 'Recurso atualizado com sucesso',
    DELETED: 'Recurso excluído com sucesso',
    LOGGED_IN: 'Login realizado com sucesso',
    LOGGED_OUT: 'Logout realizado com sucesso'
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