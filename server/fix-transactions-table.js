const { sequelize } = require('./models');

async function fixTransactionsTable() {
  try {
    console.log('🔧 Corrigindo tabela transactions...');
    
    // Adiciona supplier_id
    await sequelize.query(`
      ALTER TABLE transactions 
      ADD COLUMN supplier_id INT NULL,
      ADD INDEX idx_supplier_id (supplier_id)
    `);
    console.log('✅ Coluna supplier_id adicionada');
    
    // Adiciona fixed_account_id
    await sequelize.query(`
      ALTER TABLE transactions 
      ADD COLUMN fixed_account_id INT NULL,
      ADD INDEX idx_fixed_account_id (fixed_account_id)
    `);
    console.log('✅ Coluna fixed_account_id adicionada');
    
    // Adiciona payment_method
    await sequelize.query(`
      ALTER TABLE transactions 
      ADD COLUMN payment_method ENUM('card', 'boleto', 'automatic_debit', 'pix', 'transfer') NULL,
      ADD INDEX idx_payment_method (payment_method)
    `);
    console.log('✅ Coluna payment_method adicionada');
    
    // Adiciona payment_date
    await sequelize.query(`
      ALTER TABLE transactions 
      ADD COLUMN payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ADD INDEX idx_payment_date (payment_date)
    `);
    console.log('✅ Coluna payment_date adicionada');
    
    console.log('✅ Tabela transactions corrigida com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir tabela:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

fixTransactionsTable(); 