/**
 * Migration para adicionar campo backup_codes à tabela users.
 * Este campo armazena códigos de backup para autenticação de dois fatores.
 * 
 * @module migrations/add-backup-codes-to-users
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'backup_codes', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON string com códigos de backup para 2FA'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'backup_codes');
  }
}; 