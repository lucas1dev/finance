const { Sequelize } = require('sequelize');
const config = require('./config/database');

const sequelize = new Sequelize(config.test);

async function checkTables() {
  try {
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.');
    
    // Verificar várias tabelas importantes
    const tables = ['payables', 'suppliers', 'users', 'categories', 'creditors', 'financings'];
    
    for (const table of tables) {
      try {
        const [results] = await sequelize.query(`SHOW TABLES LIKE '${table}'`);
        const exists = results.length > 0;
        console.log(`Tabela ${table} existe: ${exists}`);
      } catch (error) {
        console.log(`Erro ao verificar tabela ${table}:`, error.message);
      }
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Erro:', error);
  }
}

checkTables(); 