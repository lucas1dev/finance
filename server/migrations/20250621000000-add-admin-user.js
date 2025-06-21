/**
 * Migration para criar usuário administrador padrão.
 * Cria um usuário admin com credenciais padrão que devem ser alteradas.
 * 
 * @module migrations/add-admin-user
 */

'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar se o campo role já existe na tabela users
    const tableInfo = await queryInterface.describeTable('users');
    
    if (!tableInfo.role) {
      // Adicionar campo role se não existir
      await queryInterface.addColumn('users', 'role', {
        type: Sequelize.ENUM('admin', 'user'),
        allowNull: false,
        defaultValue: 'user'
      });
    }

    // Criar usuário administrador padrão
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        name: 'Administrador',
        email: 'admin@finance.com',
        password: hashedPassword,
        role: 'admin',
        two_factor_enabled: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Remover usuário administrador
    await queryInterface.bulkDelete('users', {
      email: 'admin@finance.com'
    }, {});

    // Remover campo role (opcional - pode quebrar outras funcionalidades)
    // await queryInterface.removeColumn('users', 'role');
  }
}; 