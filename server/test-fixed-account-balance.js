/**
 * Teste simples para verificar se a correção da atualização do saldo da conta bancária
 * em contas fixas está funcionando
 */

const request = require('supertest');
const app = require('./app');
const { User, Account, FixedAccount, Category, Transaction } = require('./models');

async function testFixedAccountBalanceUpdate() {
  console.log('🧪 Iniciando teste de atualização de saldo em contas fixas...\n');

  try {
    // 1. Criar um usuário de teste
    console.log('1️⃣ Criando usuário de teste...');
    const uniqueEmail = `teste-conta-fixa-${Date.now()}@example.com`;
    const testPassword = '123456';
    const testUser = await User.create({
      name: 'Usuário Teste Conta Fixa',
      email: uniqueEmail,
      password: testPassword,
      is_admin: false
    });
    console.log('✅ Usuário criado:', testUser.id);

    // 1.1. Login para obter token JWT
    console.log('\n🔑 Realizando login para obter token JWT...');
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: uniqueEmail, password: testPassword });
    if (loginResponse.status !== 200 || !loginResponse.body.token) {
      throw new Error('Falha ao obter token JWT: ' + JSON.stringify(loginResponse.body));
    }
    const jwtToken = loginResponse.body.token;
    console.log('✅ Token JWT obtido');

    // 2. Criar uma conta bancária com saldo
    console.log('\n2️⃣ Criando conta bancária com saldo...');
    const testAccount = await Account.create({
      user_id: testUser.id,
      bank_name: 'Banco Teste',
      account_type: 'corrente',
      balance: 5000.00,
      description: 'Conta para teste de conta fixa'
    });
    console.log('✅ Conta bancária criada:', testAccount.id, 'Saldo:', testAccount.balance);

    // 3. Criar uma categoria
    console.log('\n3️⃣ Criando categoria...');
    const testCategory = await Category.create({
      name: 'Teste Conta Fixa',
      color: '#FF0000',
      type: 'expense',
      user_id: testUser.id,
      is_default: false
    });
    console.log('✅ Categoria criada:', testCategory.id);

    // 4. Criar uma conta fixa
    console.log('\n4️⃣ Criando conta fixa...');
    const testFixedAccount = await FixedAccount.create({
      user_id: testUser.id,
      description: 'Teste de Atualização de Saldo',
      amount: 1500.00,
      periodicity: 'monthly',
      start_date: new Date(),
      next_due_date: new Date(),
      category_id: testCategory.id,
      payment_method: 'automatic_debit',
      is_active: true,
      is_paid: false
    });
    console.log('✅ Conta fixa criada:', testFixedAccount.id, 'Valor:', testFixedAccount.amount);

    // 5. Verificar saldo inicial
    console.log('\n5️⃣ Verificando saldo inicial...');
    const initialAccount = await Account.findByPk(testAccount.id);
    console.log('💰 Saldo inicial:', initialAccount.balance);

    // 6. Marcar conta fixa como paga
    console.log('\n6️⃣ Marcando conta fixa como paga...');
    const response = await request(app)
      .post(`/api/fixed-accounts/${testFixedAccount.id}/pay`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ payment_date: new Date().toISOString().split('T')[0] });

    if (response.status === 201) {
      console.log('✅ Conta fixa marcada como paga com sucesso');
      console.log('📊 Resposta:', response.body);
    } else {
      console.log('❌ Erro ao marcar conta fixa como paga:', response.status, response.body);
    }

    // 7. Verificar saldo final
    console.log('\n7️⃣ Verificando saldo final...');
    const finalAccount = await Account.findByPk(testAccount.id);
    console.log('💰 Saldo final:', finalAccount.balance);

    // 8. Verificar se a transação foi criada
    console.log('\n8️⃣ Verificando transação criada...');
    const transaction = await Transaction.findOne({
      where: { fixed_account_id: testFixedAccount.id }
    });
    
    if (transaction) {
      console.log('✅ Transação criada:', transaction.id);
      console.log('📊 Detalhes da transação:', {
        amount: transaction.amount,
        type: transaction.type,
        account_id: transaction.account_id
      });
    } else {
      console.log('❌ Transação não encontrada');
    }

    // 9. Calcular diferença
    const balanceDifference = parseFloat(initialAccount.balance) - parseFloat(finalAccount.balance);
    console.log('\n9️⃣ Análise dos resultados:');
    console.log('💰 Diferença no saldo:', balanceDifference);
    console.log('💳 Valor da conta fixa:', testFixedAccount.amount);
    console.log('✅ Saldo foi atualizado corretamente?', balanceDifference === parseFloat(testFixedAccount.amount));

    // 10. Limpeza
    console.log('\n🔧 Limpando dados de teste...');
    await Transaction.destroy({ where: { user_id: testUser.id } });
    await FixedAccount.destroy({ where: { user_id: testUser.id } });
    await Account.destroy({ where: { user_id: testUser.id } });
    await Category.destroy({ where: { user_id: testUser.id } });
    await User.destroy({ where: { id: testUser.id } });
    console.log('✅ Dados de teste removidos');

    console.log('\n🎉 Teste concluído!');
    return balanceDifference === parseFloat(testFixedAccount.amount);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Executar o teste
if (require.main === module) {
  testFixedAccountBalanceUpdate()
    .then(success => {
      console.log('\n📋 Resultado do teste:', success ? '✅ SUCESSO' : '❌ FALHA');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { testFixedAccountBalanceUpdate }; 