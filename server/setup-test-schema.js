const fs = require('fs');
const path = require('path');
const { sequelize } = require('./models');

async function setupTestSchema() {
  try {
    console.log('🔧 Configurando schema do banco de teste...');
    
    // Ler o arquivo schema.sql
    const schemaPath = path.join(__dirname, 'config', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Remover a linha CREATE DATABASE e USE finance
    const cleanSchema = schema
      .replace(/CREATE DATABASE IF NOT EXISTS finance;?\n?/g, '')
      .replace(/USE finance;?\n?/g, '');
    
    // Executar o schema
    await sequelize.query(cleanSchema);
    
    console.log('✅ Schema do banco de teste configurado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao configurar schema do banco de teste:', error);
    throw error;
  }
}

setupTestSchema()
  .then(() => {
    console.log('Schema configurado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro:', error);
    process.exit(1);
  }); 