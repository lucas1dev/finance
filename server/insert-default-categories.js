const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

/**
 * Script para inserir categorias padrão globais do sistema.
 * Este script cria categorias padrão que ficam disponíveis para todos os usuários.
 * As categorias são criadas com user_id: null e is_default: true.
 */
async function insertDefaultCategories() {
  const sequelize = new Sequelize(config.development);
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    const defaultCategories = [
      // RECEITAS
      { name: 'Rendimentos PF não Assalariado', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Rendimentos PJ não Assalariado', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Rendimentos PJ Assalariado', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Receitas de aluguéis', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Lucros na Venda de bens patrimoniais', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Rendas Extraordinárias', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Serviços Prestados no Estado', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Serviços Prestados em outro Estado', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Serviços Prestados no Exterior', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Mercadorias Vendidas no Estado', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Mercadorias Vendidas para outro Estado', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Mercadorias Vendidas para o Exterior', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Produtos fabricados/Vendas no Estado', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Produtos fabricados/Vendas para outro Estado', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Produtos fabricados/Vendas para o Exterior', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Aluguéis ativos', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Multas e Juros Recebidos', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Descontos Obtidos', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Rendimentos s/ aplicações financeiras', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Variações Cambiais', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Superveniências Ativas', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Valorização de bens', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Recuperação de FGTS', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Recuperação de materiais', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Recuperação de despesas', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Reversão de provisões', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Lucros em partic. em outras companhias', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Perdas recuperadas', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Variações monetárias ativas', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Ganhos em transações do ativo perm.', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Dividendos', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Aumento do valor ações outras empresas', type: 'income', is_default: true, color: '#4CAF50' },
      { name: 'Ações bonificadas', type: 'income', is_default: true, color: '#4CAF50' },

      // DESPESAS
      { name: 'Compras de mercadorias', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Fretes e Seguros sobre compras', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Compras anuladas', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Bonificações a compradores', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Devedores duvidosos', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Despesas diversas com vendas', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Água e esgoto', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Energia Elétrica', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Telefones', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Provedor - Internet', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Material de Limpeza', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Material de Expediente', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Material de Embalagem', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Lanches e Refeições', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Condução e Transportes', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Combustível', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Peças e Material de Reposição', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Manutenção de Computadores e Impressoras', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Aluguel', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Depreciação', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Amortização', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Exaustão', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Prêmios de Seguro', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Gratificações', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Viagens e estadias', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Publicidade propaganda', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Correios e Telégrafos', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Despesas legais e Jurídicas', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Despesas com Cartórios', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Despesas com cobranças', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Jornais e Revistas', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Pró-labore', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Honorários de Diretoria', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Salários', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'INSS', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'IRRF', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'FGTS', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Férias', type: 'expense', is_default: true, color: '#F44336' },
      { name: '13º Salário', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Indenizações', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Multa de Natureza contratual', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Vale-Transporte', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Refeições e Lanches', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Assistência Médica', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Contribuição Sindical Anual', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Contribuição Confederativa', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Contribuição Assistêncial', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Seguros de Acidentes do Trabalho', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Outras Despesas com pessoal', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Contribuições a Órgãos de Classe', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Contribuição Sindical Patronal', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Serv.Prestados p/ Pessoa Física', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Serv.Prestados p/ Pessoa Jurídica', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Serviços Contábeis', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Serviços Advocatícios', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Tributos Federais', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'SIMPLES', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'IRRF s/ Salários', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'IRRF s/ Serviços de Terceiros', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'IRRF s/ Aluguéis', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'IRPJ', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'CSSL', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'COFINS', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'PIS/PASEP/ Faturamento', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'PIS - Folha de Pagamento', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'IPI', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Tributos Estaduais', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'ICMS', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'IPVA', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Tributos Municipais', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'ISSQN a Recolher', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'TLIF a Recolher', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'IPTU a Recolher', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Taxa de propaganda a Recolher (CADAM)', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Contribuição de Melhoria', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Descontos Concedidos', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Despesas Bancárias', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Multas e Juros Pagos', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Despesas c/ Créditos de liquidação Duv.', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Brindes e Presentes', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Despesas Eventuais', type: 'expense', is_default: true, color: '#F44336' },
      { name: 'Outros Gastos com Conservação', type: 'expense', is_default: true, color: '#F44336' }
    ];

    // Verificar se já existem categorias padrão globais
    const existingCategories = await sequelize.query(
      'SELECT COUNT(*) as count FROM categories WHERE is_default = true AND user_id IS NULL',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingCategories[0].count > 0) {
      console.log('⚠️  Categorias padrão globais já existem no sistema');
      console.log(`📊 Total de ${existingCategories[0].count} categorias padrão globais encontradas`);
      return;
    }

    console.log('🔄 Inserindo categorias padrão globais...');
    
    // Preparar categorias com user_id: null (globais)
    const categoriesWithNullUserId = defaultCategories.map(category => ({
      ...category,
      user_id: null, // Categorias globais não vinculadas a usuários específicos
      created_at: new Date(),
      updated_at: new Date()
    }));

    await sequelize.query(
      'INSERT INTO categories (name, type, color, is_default, user_id, created_at, updated_at) VALUES ?',
      {
        replacements: [categoriesWithNullUserId.map(cat => [
          cat.name,
          cat.type,
          cat.color,
          cat.is_default,
          cat.user_id,
          cat.created_at,
          cat.updated_at
        ])],
        type: Sequelize.QueryTypes.INSERT
      }
    );

    console.log(`✅ Categorias padrão globais inseridas com sucesso`);
    console.log(`📊 Total de ${defaultCategories.length} categorias padrão globais criadas`);
    console.log('🌍 Estas categorias estarão disponíveis para todos os usuários do sistema');
    
  } catch (error) {
    console.error('❌ Erro ao inserir categorias padrão globais:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Executar o script
insertDefaultCategories(); 