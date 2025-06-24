'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];
const db = {};

let sequelize;
try {
  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }
} catch (error) {
  console.error('Erro ao criar instância do Sequelize:', error);
  throw error;
}

// Carrega todos os modelos
try {
  fs
    .readdirSync(__dirname)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1
      );
    })
    .forEach(file => {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    });
} catch (error) {
  console.error('Erro ao carregar modelos:', error);
  throw error;
}

// Define as associações
try {
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });
} catch (error) {
  console.error('Erro ao definir associações:', error);
  throw error;
}

// Adiciona associações específicas para os novos modelos de usuário
if (db.User && db.UserSession) {
  db.User.hasMany(db.UserSession, {
    foreignKey: 'user_id',
    as: 'sessions'
  });
}

if (db.User && db.UserSetting) {
  db.User.hasMany(db.UserSetting, {
    foreignKey: 'user_id',
    as: 'settings'
  });
}

// Adiciona relacionamentos específicos para os novos modelos
// Removido: todas as associações duplicadas já definidas nos métodos associate dos modelos
// Caso precise de alguma associação extra, adicione aqui, mas evite duplicidade de alias.

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
