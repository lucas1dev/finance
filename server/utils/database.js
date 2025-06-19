const { Sequelize } = require('sequelize');
const config = require('./config');

/**
 * Instância do Sequelize para conexão com o banco de dados.
 * @type {Sequelize}
 */
const sequelize = new Sequelize(
  config.database.name,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging ? console.log : false,
    pool: {
      max: config.database.pool.max,
      min: config.database.pool.min,
      acquire: config.database.pool.acquire,
      idle: config.database.pool.idle
    },
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true
    }
  }
);

/**
 * Testa a conexão com o banco de dados.
 * @returns {Promise<void>}
 * @throws {Error} Se houver erro na conexão.
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
    throw error;
  }
};

/**
 * Sincroniza os modelos com o banco de dados.
 * @param {boolean} [force=false] - Se true, recria as tabelas.
 * @returns {Promise<void>}
 * @throws {Error} Se houver erro na sincronização.
 */
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('Banco de dados sincronizado com sucesso.');
  } catch (error) {
    console.error('Erro ao sincronizar banco de dados:', error);
    throw error;
  }
};

/**
 * Fecha a conexão com o banco de dados.
 * @returns {Promise<void>}
 * @throws {Error} Se houver erro ao fechar a conexão.
 */
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('Conexão com o banco de dados fechada com sucesso.');
  } catch (error) {
    console.error('Erro ao fechar conexão com o banco de dados:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  closeConnection
}; 