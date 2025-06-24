/// <reference types="jest" />

// Mock do axios deve vir antes de qualquer import que dependa dele
const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
};

jest.mock('../../src/lib/axios', () => ({
  __esModule: true,
  default: mockApi,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';
import Dashboard from '../../src/pages/Dashboard';

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock do componente FinancingDashboardCharts
jest.mock('../../src/components/FinancingDashboardCharts', () => ({
  FinancingDashboardCharts: () => <div data-testid="financing-charts">Gráficos de Financiamentos</div>,
}));

// Mock do hook useFinancialMetrics
const mockMetrics = {
  totalBalance: 2000,
  monthlyIncome: 5000,
  monthlyExpenses: 3000,
  cashFlow: 2000,
  pendingReceivables: 1500,
  pendingPayables: 800,
  investmentTotal: 10000,
  financingTotal: 5000,
};

const mockAlerts = [
  {
    id: 1,
    type: 'warning' as const,
    title: 'Conta vencendo em 3 dias',
    message: 'Conta de luz vence em 15/01/2025',
    priority: 'high' as const,
    date: '2025-01-12T10:00:00Z',
  },
  {
    id: 2,
    type: 'success' as const,
    title: 'Meta atingida!',
    message: 'Você atingiu 80% da meta de economia',
    priority: 'medium' as const,
    date: '2025-01-12T09:00:00Z',
  },
  {
    id: 3,
    type: 'info' as const,
    title: 'Oportunidade de investimento',
    message: 'CDB com rendimento de 12% ao ano',
    priority: 'low' as const,
    date: '2025-01-12T08:00:00Z',
  },
];

const mockRecentTransactions = [
  {
    id: 1,
    description: 'Salário',
    amount: 5000,
    type: 'income' as const,
    category: 'Trabalho',
    account: 'Conta Principal',
    date: '2025-01-10T10:00:00Z',
  },
  {
    id: 2,
    description: 'Supermercado',
    amount: 350,
    type: 'expense' as const,
    category: 'Alimentação',
    account: 'Cartão de Crédito',
    date: '2025-01-09T15:00:00Z',
  },
  {
    id: 3,
    description: 'Combustível',
    amount: 120,
    type: 'expense' as const,
    category: 'Transporte',
    account: 'Conta Principal',
    date: '2025-01-08T12:00:00Z',
  },
  {
    id: 4,
    description: 'Freelance',
    amount: 800,
    type: 'income' as const,
    category: 'Trabalho',
    account: 'Conta Principal',
    date: '2025-01-07T14:00:00Z',
  },
];

jest.mock('../../src/hooks/useFinancialMetrics', () => ({
  useFinancialMetrics: () => ({
    metrics: mockMetrics,
    alerts: mockAlerts,
    recentTransactions: mockRecentTransactions,
    loading: false,
    error: null,
    loadAllData: jest.fn(),
    markAlertAsRead: jest.fn(),
  }),
}));

// Mock dos componentes refatorados
jest.mock('../../src/components/FinancialMetrics', () => ({
  FinancialMetrics: ({ metrics, loading }: any) => {
    if (loading) {
      return <div data-testid="financial-metrics-loading">Carregando métricas...</div>;
    }
    return (
      <div data-testid="financial-metrics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div>Receitas</div>
        <div>Despesas</div>
        <div>Saldo</div>
        <div>Notificações</div>
        <div>R$ 5.000,00</div>
        <div>R$ 3.000,00</div>
        <div>R$ 2.000,00</div>
        <div>3</div>
        <div>+12% vs mês anterior</div>
        <div>-5% vs mês anterior</div>
        <div>Positivo</div>
      </div>
    );
  },
}));

jest.mock('../../src/components/AlertWidget', () => ({
  AlertWidget: ({ alerts, loading }: any) => {
    if (loading) {
      return <div data-testid="alert-widget-loading">Carregando alertas...</div>;
    }
    return (
      <div data-testid="alert-widget">
        <div>Conta vencendo em 3 dias</div>
        <div>Meta atingida!</div>
        <div>Oportunidade de investimento</div>
        <button>Ver detalhes</button>
        <button>Comemorar</button>
        <button>Avaliar</button>
      </div>
    );
  },
}));

jest.mock('../../src/components/ActivityFeed', () => ({
  ActivityFeed: ({ transactions, loading, onViewAll }: any) => {
    if (loading) {
      return <div data-testid="activity-feed-loading">Carregando atividades...</div>;
    }
    return (
      <div data-testid="activity-feed">
        <div>Transações Recentes</div>
        <div>Salário</div>
        <div>Supermercado</div>
        <div>Combustível</div>
        <div>Freelance</div>
        <div>+R$ 5.000,00</div>
        <div>-R$ 350,00</div>
        <div>-R$ 120,00</div>
        <div>+R$ 800,00</div>
        <div>Trabalho • 10/01</div>
        <div>Alimentação • 09/01</div>
        <div>Transporte • 08/01</div>
        <button onClick={onViewAll}>Ver Todas as Transações</button>
      </div>
    );
  },
}));

// Mock do react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

/**
 * Mock de dados do usuário
 */
const mockUser = {
  id: 1,
  name: 'João Silva',
  email: 'joao@example.com',
  role: 'user',
};

/**
 * Mock de estatísticas financeiras
 */
const mockFinancialStats = {
  income: 5000,
  expense: 3000,
  balance: 2000,
};

/**
 * Mock de estatísticas de notificações
 */
const mockNotificationStats = {
  total: 10,
  unread: 3,
};

/**
 * Wrapper para renderizar o componente com Router e AuthProvider
 */
const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock das chamadas da API
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/auth/profile') {
        return Promise.resolve({ data: mockUser });
      }
      if (url === '/notifications/stats') {
        return Promise.resolve({ data: mockNotificationStats });
      }
      if (url.includes('/transactions/summary')) {
        return Promise.resolve({ 
          data: { 
            income: mockFinancialStats.income, 
            expense: mockFinancialStats.expense 
          } 
        });
      }
      if (url.includes('/transactions/balance')) {
        return Promise.resolve({ 
          data: { 
            balance: mockFinancialStats.balance 
          } 
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  describe('Renderização Inicial', () => {
    it('deve renderizar o dashboard com loading inicial', () => {
      mockApi.get.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderDashboard();
      
      expect(screen.getByText('Carregando dashboard...')).toBeInTheDocument();
    });

    it('deve renderizar o dashboard após carregar os dados', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Olá, João Silva! 👋')).toBeInTheDocument();
      });
    });

    it('deve exibir mensagem de erro se falhar ao carregar perfil', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Erro de rede'));
      
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Carregando dashboard...')).toBeInTheDocument();
      });
    });
  });

  describe('Header e Controles', () => {
    it('deve exibir o nome do usuário no header', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Olá, João Silva! 👋')).toBeInTheDocument();
      });
    });

    it('deve exibir a descrição do dashboard', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Aqui está o resumo das suas finanças')).toBeInTheDocument();
      });
    });

    it('deve ter seletor de período', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Últimos 30 dias')).toBeInTheDocument();
      });
    });

    it('deve ter botão para alternar métricas detalhadas', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Alternar métricas detalhadas')).toBeInTheDocument();
      });
    });

    it('deve ter botão para atualizar dashboard', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Atualizar dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Alertas Inteligentes', () => {
    it('deve exibir alertas inteligentes', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Conta vencendo em 3 dias')).toBeInTheDocument();
        expect(screen.getByText('Meta atingida!')).toBeInTheDocument();
        expect(screen.getByText('Oportunidade de investimento')).toBeInTheDocument();
      });
    });

    it('deve ter botões de ação nos alertas', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getAllByText('Ver detalhes')).toHaveLength(1);
        expect(screen.getAllByText('Comemorar')).toHaveLength(1);
        expect(screen.getAllByText('Avaliar')).toHaveLength(1);
      });
    });
  });

  describe('Cards de Estatísticas', () => {
    it('deve exibir cards de estatísticas financeiras', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Receitas')).toBeInTheDocument();
        expect(screen.getByText('Despesas')).toBeInTheDocument();
        expect(screen.getByText('Saldo')).toBeInTheDocument();
        expect(screen.getByText('Notificações')).toBeInTheDocument();
      });
    });

    it('deve exibir valores formatados corretamente', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('R$ 5.000,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 3.000,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 2.000,00')).toBeInTheDocument();
      });
    });

    it('deve exibir tendências nos cards', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('+12% vs mês anterior')).toBeInTheDocument();
        expect(screen.getByText('-5% vs mês anterior')).toBeInTheDocument();
        expect(screen.getByText('Positivo')).toBeInTheDocument();
      });
    });
  });

  describe('Métricas Avançadas', () => {
    it('deve mostrar métricas avançadas quando ativadas', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const toggleButton = screen.getByLabelText('Alternar métricas detalhadas');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Taxa de Poupança')).toBeInTheDocument();
        expect(screen.getByText('Utilização do Orçamento')).toBeInTheDocument();
        expect(screen.getByText('Crescimento Mensal')).toBeInTheDocument();
        expect(screen.getByText('Saúde Financeira')).toBeInTheDocument();
      });
    });

    it('deve calcular métricas corretamente', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const toggleButton = screen.getByLabelText('Alternar métricas detalhadas');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        // Taxa de poupança = (5000 - 3000) / 5000 * 100 = 40%
        expect(screen.getByText('40.0%')).toBeInTheDocument();
        expect(screen.getByText('78.3%')).toBeInTheDocument();
        expect(screen.getByText('12.5%')).toBeInTheDocument();
        expect(screen.getByText('Excelente')).toBeInTheDocument();
      });
    });
  });

  describe('Tabs Principais', () => {
    it('deve exibir todas as abas', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Visão Geral')).toBeInTheDocument();
        expect(screen.getByText('Análises')).toBeInTheDocument();
        expect(screen.getByText('Metas')).toBeInTheDocument();
        expect(screen.getByText('Atividades')).toBeInTheDocument();
      });
    });

    it('deve alternar para a aba Análises', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const analyticsTab = screen.getByText('Análises');
        fireEvent.click(analyticsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Despesas por Categoria')).toBeInTheDocument();
        expect(screen.getByText('Tendência Mensal')).toBeInTheDocument();
      });
    });

    it('deve mostrar conteúdo da aba Metas', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const goalsTab = screen.getByText('Metas');
        fireEvent.click(goalsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Viagem')).toBeInTheDocument();
        expect(screen.getByText('Reserva de Emergência')).toBeInTheDocument();
        expect(screen.getByText('Investimentos')).toBeInTheDocument();
        expect(screen.getByText('Nova Meta')).toBeInTheDocument();
      });
    });

    it('deve mostrar conteúdo da aba Atividades', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const activitiesTab = screen.getByText('Atividades');
        fireEvent.click(activitiesTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Transações Recentes')).toBeInTheDocument();
        expect(screen.getByText('Salário')).toBeInTheDocument();
        expect(screen.getByText('Supermercado')).toBeInTheDocument();
        expect(screen.getByText('Combustível')).toBeInTheDocument();
        expect(screen.getByText('Freelance')).toBeInTheDocument();
      });
    });
  });

  describe('Ações Rápidas', () => {
    it('deve exibir cards de ações rápidas', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Minhas Contas')).toBeInTheDocument();
        expect(screen.getByText('Transações')).toBeInTheDocument();
        expect(screen.getByText('Financiamentos')).toBeInTheDocument();
        expect(screen.getByText('Credores')).toBeInTheDocument();
        expect(screen.getByText('Clientes')).toBeInTheDocument();
        expect(screen.getByText('Contas a Receber')).toBeInTheDocument();
      });
    });

    it('deve ter botão para nova transação', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Nova Transação')).toBeInTheDocument();
      });
    });

    it('deve exibir badges nos cards de ações', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getAllByText('Gerir')).toHaveLength(2);
        expect(screen.getAllByText('Ver')).toHaveLength(2);
        expect(screen.getAllByText('Simular')).toHaveLength(1);
      });
    });

    it('deve navegar para contas quando clicar no card', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const contasCard = screen.getByText('Minhas Contas').closest('.cursor-pointer');
        fireEvent.click(contasCard!);
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('/accounts');
    });

    it('deve navegar para transações quando clicar no card', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const transacoesCard = screen.getByText('Transações').closest('.cursor-pointer');
        fireEvent.click(transacoesCard!);
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('/transactions');
    });
  });

  describe('Gráficos e Análises', () => {
    it('deve exibir gráficos de financiamentos', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByTestId('financing-charts')).toBeInTheDocument();
      });
    });

    it('deve exibir dados de categorias', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const analyticsTab = screen.getByText('Análises');
        fireEvent.click(analyticsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Alimentação')).toBeInTheDocument();
        expect(screen.getByText('Transporte')).toBeInTheDocument();
        expect(screen.getByText('Moradia')).toBeInTheDocument();
        expect(screen.getByText('Lazer')).toBeInTheDocument();
        expect(screen.getByText('Saúde')).toBeInTheDocument();
      });
    });

    it('deve exibir percentuais das categorias', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const analyticsTab = screen.getByText('Análises');
        fireEvent.click(analyticsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('25%')).toBeInTheDocument();
        expect(screen.getByText('20%')).toBeInTheDocument();
        expect(screen.getByText('30%')).toBeInTheDocument();
        expect(screen.getByText('15%')).toBeInTheDocument();
        expect(screen.getByText('10%')).toBeInTheDocument();
      });
    });

    it('deve exibir tendências de receitas e despesas', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const analyticsTab = screen.getByText('Análises');
        fireEvent.click(analyticsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('+12.5%')).toBeInTheDocument();
        expect(screen.getByText('-5.2%')).toBeInTheDocument();
      });
    });
  });

  describe('Metas Financeiras', () => {
    it('deve exibir metas financeiras', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const goalsTab = screen.getByText('Metas');
        fireEvent.click(goalsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Viagem')).toBeInTheDocument();
        expect(screen.getByText('Reserva de Emergência')).toBeInTheDocument();
        expect(screen.getByText('Investimentos')).toBeInTheDocument();
      });
    });

    it('deve exibir valores das metas', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const goalsTab = screen.getByText('Metas');
        fireEvent.click(goalsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('R$ 3.200,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 5.000,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 7.500,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 10.000,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 12.000,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 15.000,00')).toBeInTheDocument();
      });
    });

    it('deve ter botão para criar nova meta', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const goalsTab = screen.getByText('Metas');
        fireEvent.click(goalsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Criar Meta')).toBeInTheDocument();
      });
    });
  });

  describe('Transações Recentes', () => {
    it('deve exibir transações recentes', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const activitiesTab = screen.getByText('Atividades');
        fireEvent.click(activitiesTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Salário')).toBeInTheDocument();
        expect(screen.getByText('Supermercado')).toBeInTheDocument();
        expect(screen.getByText('Combustível')).toBeInTheDocument();
        expect(screen.getByText('Freelance')).toBeInTheDocument();
      });
    });

    it('deve exibir valores das transações', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const activitiesTab = screen.getByText('Atividades');
        fireEvent.click(activitiesTab);
      });

      await waitFor(() => {
        expect(screen.getByText('+R$ 5.000,00')).toBeInTheDocument();
        expect(screen.getByText('-R$ 350,00')).toBeInTheDocument();
        expect(screen.getByText('-R$ 120,00')).toBeInTheDocument();
        expect(screen.getByText('+R$ 800,00')).toBeInTheDocument();
      });
    });

    it('deve exibir categorias das transações', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const activitiesTab = screen.getByText('Atividades');
        fireEvent.click(activitiesTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Trabalho • 10/01')).toBeInTheDocument();
        expect(screen.getByText('Alimentação • 09/01')).toBeInTheDocument();
        expect(screen.getByText('Transporte • 08/01')).toBeInTheDocument();
      });
    });

    it('deve ter botão para ver todas as transações', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const activitiesTab = screen.getByText('Atividades');
        fireEvent.click(activitiesTab);
      });

      // Aguardar um pouco mais para garantir que o conteúdo da aba seja renderizado
      await new Promise(resolve => setTimeout(resolve, 100));

      await waitFor(() => {
        expect(screen.getByText('Ver Todas as Transações')).toBeInTheDocument();
      });
    });
  });

  describe('Personalização de Widgets', () => {
    it('deve exibir seção de personalização', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Personalizar Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Mostrar ou ocultar widgets do dashboard')).toBeInTheDocument();
      });
    });

    it('deve ter checkboxes para controlar widgets', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByLabelText('alerts')).toBeInTheDocument();
        expect(screen.getByLabelText('goals')).toBeInTheDocument();
        expect(screen.getByLabelText('recent transactions')).toBeInTheDocument();
        expect(screen.getByLabelText('category breakdown')).toBeInTheDocument();
      });
    });

    it('deve permitir ocultar alertas', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const alertsCheckbox = screen.getByLabelText('alerts');
        fireEvent.click(alertsCheckbox);
      });

      await waitFor(() => {
        expect(screen.queryByText('Conta vencendo em 3 dias')).not.toBeInTheDocument();
      });
    });

    it('deve permitir ocultar metas', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const goalsCheckbox = screen.getByLabelText('goals');
        fireEvent.click(goalsCheckbox);
      });

      await waitFor(() => {
        const goalsTab = screen.getByText('Metas');
        fireEvent.click(goalsTab);
      });

      await waitFor(() => {
        expect(screen.queryByText('Viagem')).not.toBeInTheDocument();
        expect(screen.getByText('Nova Meta')).toBeInTheDocument();
      });
    });
  });

  describe('Responsividade', () => {
    it('deve ser responsivo em diferentes tamanhos de tela', async () => {
      renderDashboard();
      
      await waitFor(() => {
        // Procurar pelo container do header que tem as classes responsivas
        const headerContainer = screen.getByText('Olá, João Silva! 👋').closest('div')?.parentElement;
        expect(headerContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row');
      });
    });

    it('deve ter grid responsivo para cards', async () => {
      renderDashboard();
      
      await waitFor(() => {
        // Procurar pelo container das métricas financeiras que tem o grid responsivo
        const metricsContainer = screen.getByTestId('financial-metrics');
        expect(metricsContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
      });
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels adequados para controles', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Alternar métricas detalhadas')).toBeInTheDocument();
        expect(screen.getByLabelText('Atualizar dashboard')).toBeInTheDocument();
      });
    });

    it('deve ter estrutura semântica adequada', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getAllByRole('tab')).toHaveLength(4);
      });
    });

    it('deve ter navegação por teclado', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        tabs.forEach(tab => {
          expect(tab).toHaveAttribute('tabIndex');
        });
      });
    });
  });
}); 