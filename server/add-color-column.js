const { sequelize } = require('./models');

async function addColorColumn() {
  try {
    console.log('🔧 Adicionando coluna color à tabela categories...');
    
    await sequelize.query(`
      ALTER TABLE categories 
      ADD COLUMN color VARCHAR(7) DEFAULT '#4CAF50'
    `);
    
    console.log('✅ Coluna color adicionada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addColorColumn(); 