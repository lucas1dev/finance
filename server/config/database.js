require('dotenv').config();

const config = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'docker',
    database: process.env.DB_NAME || 'finance',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true
    },
    dialectOptions: {
      connectTimeout: 60000,
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: 'root',
    password: 'docker',
    database: 'finance_test',
    host: '127.0.0.1',
    port: 3306,
    dialect: 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true
    },
    dialectOptions: {
      connectTimeout: 60000,
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'docker',
    database: process.env.DB_NAME || 'finance',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true
    },
    dialectOptions: {
      connectTimeout: 60000,
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};

module.exports = config; 