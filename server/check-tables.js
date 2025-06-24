const { sequelize } = require('./models');

async function checkTables() {
  try {
    console.log('🔍 Verificando estrutura das tabelas...');
    
    // Verifica tabela transactions
    const [transactionsColumns] = await sequelize.query(`
      DESCRIBE transactions
    `);
    console.log('\n📋 Tabela transactions:');
    transactionsColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verifica tabela payables
    const [payablesColumns] = await sequelize.query(`
      DESCRIBE payables
    `);
    console.log('\n📋 Tabela payables:');
    payablesColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verifica tabela categories
    const [categoriesColumns] = await sequelize.query(`
      DESCRIBE categories
    `);
    console.log('\n📋 Tabela categories:');
    categoriesColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkTables(); 