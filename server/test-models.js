const { Transaction, Payable, Payment, Category, Account, Supplier } = require('./models');

async function testModels() {
  try {
    console.log('🔍 Testando carregamento dos modelos...');
    
    // Testa se os modelos foram carregados
    console.log('✅ Transaction model:', !!Transaction);
    console.log('✅ Payable model:', !!Payable);
    console.log('✅ Payment model:', !!Payment);
    console.log('✅ Category model:', !!Category);
    console.log('✅ Account model:', !!Account);
    console.log('✅ Supplier model:', !!Supplier);
    
    // Testa as associações
    console.log('\n🔍 Testando associações...');
    console.log('✅ Transaction.associate:', typeof Transaction.associate);
    console.log('✅ Payable.associate:', typeof Payable.associate);
    console.log('✅ Payment.associate:', typeof Payment.associate);
    
    // Testa uma query simples
    console.log('\n🔍 Testando query simples...');
    const categories = await Category.findAll({ limit: 1 });
    console.log('✅ Categories query:', categories.length, 'registros');
    
    const suppliers = await Supplier.findAll({ limit: 1 });
    console.log('✅ Suppliers query:', suppliers.length, 'registros');
    
    const accounts = await Account.findAll({ limit: 1 });
    console.log('✅ Accounts query:', accounts.length, 'registros');
    
    // Testa query com associações (que está falhando)
    console.log('\n🔍 Testando query com associações...');
    try {
      const transactions = await Transaction.findAll({
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['bank_name', 'account_type']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['name']
          }
        ],
        limit: 1
      });
      console.log('✅ Transactions query com associações:', transactions.length, 'registros');
    } catch (error) {
      console.error('❌ Erro na query de transactions:', error.message);
    }
    
    // Testa query de payables
    try {
      const payables = await Payable.findAll({
        include: [
          {
            model: Supplier,
            as: 'supplier'
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'color']
          },
          {
            model: Payment,
            as: 'payments'
          }
        ],
        limit: 1
      });
      console.log('✅ Payables query com associações:', payables.length, 'registros');
    } catch (error) {
      console.error('❌ Erro na query de payables:', error.message);
    }
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    process.exit(0);
  }
}

testModels(); 