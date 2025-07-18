'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const defaultCategories = [
      // RECEITAS
      { name: 'Rendimentos PF não Assalariado', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Rendimentos PJ não Assalariado', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Rendimentos PJ Assalariado', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Receitas de aluguéis', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Lucros na Venda de bens patrimoniais', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Rendas Extraordinárias', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Serviços Prestados no Estado', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Serviços Prestados em outro Estado', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Serviços Prestados no Exterior', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Mercadorias Vendidas no Estado', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Mercadorias Vendidas para outro Estado', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Mercadorias Vendidas para o Exterior', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Produtos fabricados/Vendas no Estado', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Produtos fabricados/Vendas para outro Estado', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Produtos fabricados/Vendas para o Exterior', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Aluguéis ativos', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Multas e Juros Recebidos', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Descontos Obtidos', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Rendimentos s/ aplicações financeiras', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Variações Cambiais', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Superveniências Ativas', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Valorização de bens', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Recuperação de FGTS', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Recuperação de materiais', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Recuperação de despesas', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Reversão de provisões', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Lucros em partic. em outras companhias', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Perdas recuperadas', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Variações monetárias ativas', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Ganhos em transações do ativo perm.', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Dividendos', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Aumento do valor ações outras empresas', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },
      { name: 'Ações bonificadas', type: 'income', is_default: true, color: '#4CAF50', created_at: now, updated_at: now },

      // DESPESAS
      { name: 'Compras de mercadorias', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Fretes e Seguros sobre compras', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Compras anuladas', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Bonificações a compradores', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Devedores duvidosos', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Despesas diversas com vendas', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Água e esgoto', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Energia Elétrica', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Telefones', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Provedor - Internet', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Material de Limpeza', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Material de Expediente', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Material de Embalagem', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Lanches e Refeições', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Condução e Transportes', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Combustível', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Peças e Material de Reposição', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Manutenção de Computadores e Impressoras', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Aluguel', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Depreciação', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Amortização', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Exaustão', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Prêmios de Seguro', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Gratificações', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Viagens e estadias', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Publicidade propaganda', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Correios e Telégrafos', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Despesas legais e Jurídicas', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Despesas com Cartórios', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Despesas com cobranças', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Jornais e Revistas', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Pró-labore', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Honorários de Diretoria', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Salários', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'INSS', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'IRRF', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'FGTS', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Férias', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: '13º Salário', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Indenizações', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Multa de Natureza contratual', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Vale-Transporte', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Refeições e Lanches', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Assistência Médica', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Contribuição Sindical Anual', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Contribuição Confederativa', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Contribuição Assistêncial', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Seguros de Acidentes do Trabalho', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Outras Despesas com pessoal', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Contribuições a Órgãos de Classe', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Contribuição Sindical Patronal', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Serv.Prestados p/ Pessoa Física', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Serv.Prestados p/ Pessoa Jurídica', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Serviços Contábeis', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Serviços Advocatícios', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Tributos Federais', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'SIMPLES', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'IRRF s/ Salários', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'IRRF s/ Serviços de Terceiros', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'IRRF s/ Aluguéis', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'IRPJ', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'CSSL', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'COFINS', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'PIS/PASEP/ Faturamento', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'PIS - Folha de Pagamento', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'IPI', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Tributos Estaduais', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'ICMS', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'IPVA', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Tributos Municipais', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'ISSQN a Recolher', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'TLIF a Recolher', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'IPTU a Recolher', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Taxa de propaganda a Recolher (CADAM)', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Contribuição de Melhoria', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Descontos Concedidos', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Despesas Bancárias', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Multas e Juros Pagos', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Despesas c/ Créditos de liquidação Duv.', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Brindes e Presentes', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Despesas Eventuais', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now },
      { name: 'Outros Gastos com Conservação', type: 'expense', is_default: true, color: '#F44336', created_at: now, updated_at: now }
    ];

    await queryInterface.bulkInsert('categories', defaultCategories);

    console.log(`✅ ${defaultCategories.length} categorias padrão inseridas com sucesso`);
  },

  down: async (queryInterface, Sequelize) => {
    // Remover todas as categorias padrão
    await queryInterface.bulkDelete('categories', {
      is_default: true
    });
  }
}; 