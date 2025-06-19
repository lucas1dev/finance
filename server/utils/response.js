/**
 * Funções para padronizar as respostas da API.
 */

const { SUCCESS_MESSAGES, ERROR_MESSAGES, HTTP_STATUS } = require('./constants');

/**
 * Resposta de sucesso.
 * @param {Object} res - Objeto de resposta do Express.
 * @param {Object} data - Dados a serem retornados.
 * @param {string} message - Mensagem de sucesso.
 * @param {number} statusCode - Código de status HTTP.
 * @returns {Object} Resposta formatada.
 */
const successResponse = (res, data = null, message = SUCCESS_MESSAGES.FOUND, status = HTTP_STATUS.OK) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

/**
 * Resposta de erro.
 * @param {Object} res - Objeto de resposta do Express.
 * @param {string} message - Mensagem de erro.
 * @param {number} statusCode - Código de status HTTP.
 * @param {Object} errors - Detalhes do erro.
 * @returns {Object} Resposta formatada.
 */
const errorResponse = (res, message = ERROR_MESSAGES.INTERNAL_ERROR, status = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) => {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
};

/**
 * Resposta de não autorizado.
 * @param {Object} res - Objeto de resposta do Express.
 * @param {string} message - Mensagem de erro.
 * @returns {Object} Resposta formatada.
 */
const unauthorizedResponse = (res, message = ERROR_MESSAGES.UNAUTHORIZED) => {
  return errorResponse(res, message, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Resposta de acesso negado.
 * @param {Object} res - Objeto de resposta do Express.
 * @param {string} message - Mensagem de erro.
 * @returns {Object} Resposta formatada.
 */
const forbiddenResponse = (res, message = ERROR_MESSAGES.FORBIDDEN) => {
  return errorResponse(res, message, HTTP_STATUS.FORBIDDEN);
};

/**
 * Resposta de não encontrado.
 * @param {Object} res - Objeto de resposta do Express.
 * @param {string} message - Mensagem de erro.
 * @returns {Object} Resposta formatada.
 */
const notFoundResponse = (res, message = ERROR_MESSAGES.NOT_FOUND) => {
  return errorResponse(res, message, HTTP_STATUS.NOT_FOUND);
};

/**
 * Resposta de erro de validação.
 * @param {Object} res - Objeto de resposta do Express.
 * @param {Object} errors - Detalhes dos erros de validação.
 * @param {string} message - Mensagem de erro.
 * @returns {Object} Resposta formatada.
 */
const validationErrorResponse = (res, message = ERROR_MESSAGES.VALIDATION_ERROR, errors = null) => {
  return errorResponse(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
};

const createdResponse = (res, data = null, message = SUCCESS_MESSAGES.CREATED) => {
  return successResponse(res, data, message, HTTP_STATUS.CREATED);
};

const updatedResponse = (res, data = null, message = SUCCESS_MESSAGES.UPDATED) => {
  return successResponse(res, data, message);
};

const deletedResponse = (res, message = SUCCESS_MESSAGES.DELETED) => {
  return successResponse(res, null, message);
};

const badRequestResponse = (res, message = ERROR_MESSAGES.BAD_REQUEST, errors = null) => {
  return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST, errors);
};

const conflictResponse = (res, message = ERROR_MESSAGES.ALREADY_EXISTS) => {
  return errorResponse(res, message, HTTP_STATUS.CONFLICT);
};

module.exports = {
  successResponse,
  errorResponse,
  createdResponse,
  updatedResponse,
  deletedResponse,
  notFoundResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  conflictResponse
}; 