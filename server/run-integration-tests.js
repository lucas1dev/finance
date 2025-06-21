#!/usr/bin/env node

/**
 * Script para executar testes de integração com isolamento melhorado
 * Resolve conflitos de dados entre suítes quando executadas em conjunto
 */

const { spawn } = require('child_process');
const path = require('path');

// Lista de suítes de teste em ordem de dependência
const testSuites = [
  'auth.test.js',
  'category.test.js',
  'account.test.js',
  'customer.test.js',
  'supplier.test.js',
  'creditor.test.js',
  'investment.test.js',
  'investmentGoal.test.js',
  'investmentContribution.test.js',
  'financingPayment.test.js',
  'fixedAccount.test.js',
  'receivable.test.js',
  'payable.test.js',
  'payment.test.js',
  'transaction.test.js',
  'transactionIntegration.test.js',
  'performance.test.js'
];

/**
 * Executa uma suíte de teste específica
 * @param {string} testSuite - Nome do arquivo de teste
 * @returns {Promise<boolean>} true se passou, false se falhou
 */
function runTestSuite(testSuite) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Executando: ${testSuite}`);
    console.log('='.repeat(50));
    
    const testPath = path.join(__dirname, '__tests__/integration', testSuite);
    const child = spawn('npx', ['jest', testPath, '--config=jest.integration.config.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testSuite} - PASSOU`);
        resolve(true);
      } else {
        console.log(`❌ ${testSuite} - FALHOU (código: ${code})`);
        resolve(false);
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ Erro ao executar ${testSuite}:`, error);
      resolve(false);
    });
  });
}

/**
 * Executa todas as suítes de teste sequencialmente
 */
async function runAllTestSuites() {
  console.log('🚀 Iniciando execução sequencial de testes de integração');
  console.log('📋 Total de suítes:', testSuites.length);
  
  const results = [];
  let passedCount = 0;
  let failedCount = 0;
  
  for (const testSuite of testSuites) {
    const passed = await runTestSuite(testSuite);
    results.push({ suite: testSuite, passed });
    
    if (passed) {
      passedCount++;
    } else {
      failedCount++;
    }
    
    // Pequena pausa entre suítes para garantir isolamento
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL');
  console.log('='.repeat(60));
  console.log(`✅ Suítes que passaram: ${passedCount}/${testSuites.length}`);
  console.log(`❌ Suítes que falharam: ${failedCount}/${testSuites.length}`);
  console.log(`📈 Taxa de sucesso: ${((passedCount / testSuites.length) * 100).toFixed(1)}%`);
  
  if (failedCount > 0) {
    console.log('\n❌ Suítes que falharam:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.suite}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Retornar código de saída apropriado
  process.exit(failedCount > 0 ? 1 : 0);
}

/**
 * Executa suítes específicas
 * @param {string[]} suites - Array com nomes das suítes
 */
async function runSpecificSuites(suites) {
  console.log('🎯 Executando suítes específicas:', suites.join(', '));
  
  const results = [];
  let passedCount = 0;
  let failedCount = 0;
  
  for (const suite of suites) {
    if (testSuites.includes(suite)) {
      const passed = await runTestSuite(suite);
      results.push({ suite, passed });
      
      if (passed) {
        passedCount++;
      } else {
        failedCount++;
      }
    } else {
      console.log(`⚠️  Suíte não encontrada: ${suite}`);
    }
  }
  
  console.log(`\n📊 Resultado: ${passedCount} passaram, ${failedCount} falharam`);
  process.exit(failedCount > 0 ? 1 : 0);
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length > 0) {
  if (args[0] === '--list') {
    console.log('📋 Suítes disponíveis:');
    testSuites.forEach((suite, index) => {
      console.log(`${index + 1}. ${suite}`);
    });
  } else if (args[0] === '--specific') {
    const specificSuites = args.slice(1);
    runSpecificSuites(specificSuites);
  } else {
    console.log('Uso:');
    console.log('  node run-integration-tests.js                    # Executar todas as suítes');
    console.log('  node run-integration-tests.js --list             # Listar suítes disponíveis');
    console.log('  node run-integration-tests.js --specific suite1 suite2  # Executar suítes específicas');
  }
} else {
  runAllTestSuites();
} 