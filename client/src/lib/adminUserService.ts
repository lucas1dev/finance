import axios from './axios';

/**
 * Serviço para integração da gestão de usuários administrativos com a API backend.
 * Fornece métodos para buscar, criar, editar, ativar/desativar, excluir usuários, resetar senha e buscar histórico.
 * @module adminUserService
 */

/**
 * Busca a lista de usuários administrativos.
 * @param {Object} params - Parâmetros de busca, filtro e paginação.
 * @param {string} [params.search] - Termo de busca (nome ou email).
 * @param {string} [params.status] - Filtro de status ('active', 'inactive', 'pending').
 * @param {string} [params.role] - Filtro de role ('user', 'admin', 'manager').
 * @param {number} [params.page] - Página atual.
 * @param {number} [params.pageSize] - Tamanho da página.
 * @returns {Promise<{users: Array, total: number}>} Lista paginada de usuários e total.
 * @example
 * const { users, total } = await adminUserService.getUsers({ search: 'joao', page: 1 });
 */
export async function getUsers(params: Record<string, any> = {}) {
  const { data } = await axios.get('/admin/users', { params });
  return data;
}

/**
 * Cria um novo usuário administrativo.
 * @param {Object} userData - Dados do usuário.
 * @returns {Promise<Object>} Usuário criado.
 * @example
 * const user = await adminUserService.createUser({ name, email, role });
 */
export async function createUser(userData: Record<string, any>) {
  const { data } = await axios.post('/admin/users', userData);
  return data;
}

/**
 * Edita um usuário administrativo existente.
 * @param {string} userId - ID do usuário.
 * @param {Object} userData - Dados a serem atualizados.
 * @returns {Promise<Object>} Usuário atualizado.
 * @example
 * const user = await adminUserService.updateUser('1', { name: 'Novo Nome' });
 */
export async function updateUser(userId: string, userData: Record<string, any>) {
  const { data } = await axios.put(`/admin/users/${userId}`, userData);
  return data;
}

/**
 * Ativa ou desativa um usuário.
 * @param {string} userId - ID do usuário.
 * @param {string} status - Novo status ('active' ou 'inactive').
 * @returns {Promise<Object>} Usuário atualizado.
 * @example
 * await adminUserService.toggleUserStatus('1', 'inactive');
 */
export async function toggleUserStatus(userId: string, status: string) {
  const { data } = await axios.patch(`/admin/users/${userId}/status`, { status });
  return data;
}

/**
 * Exclui um usuário administrativo.
 * @param {string} userId - ID do usuário.
 * @returns {Promise<void>} Sem retorno.
 * @example
 * await adminUserService.deleteUser('1');
 */
export async function deleteUser(userId: string) {
  await axios.delete(`/admin/users/${userId}`);
}

/**
 * Reseta a senha de um usuário administrativo.
 * @param {string} userId - ID do usuário.
 * @returns {Promise<void>} Sem retorno.
 * @example
 * await adminUserService.resetPassword('1');
 */
export async function resetPassword(userId: string) {
  await axios.post(`/admin/users/${userId}/reset-password`);
}

/**
 * Busca o histórico de atividades de um usuário.
 * @param {string} userId - ID do usuário.
 * @returns {Promise<Array>} Lista de atividades.
 * @example
 * const logs = await adminUserService.getUserActivity('1');
 */
export async function getUserActivity(userId: string) {
  const { data } = await axios.get(`/admin/users/${userId}/activity`);
  return data;
}

const adminUserService = {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  resetPassword,
  getUserActivity,
};

export default adminUserService; 