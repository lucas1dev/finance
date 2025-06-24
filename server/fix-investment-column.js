const { sequelize } = require('./models');

async function fixInvestmentColumn() {
  try {
    console.log('🔧 Adicionando coluna investment_id à tabela transactions...');
    
    await sequelize.query(`
      ALTER TABLE transactions 
      ADD COLUMN investment_id INT NULL,
      ADD INDEX idx_investment_id (investment_id)
    `);
    
    console.log('✅ Coluna investment_id adicionada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

fixInvestmentColumn(); 