const { sequelize } = require('./models');

async function migrate() {
  try {
    // Adiciona a coluna role se ela não existir
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role ENUM('admin', 'user') NOT NULL DEFAULT 'user'
    `);
    
    console.log('Migrações executadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao executar migrações:', error);
    process.exit(1);
  }
}

migrate(); 