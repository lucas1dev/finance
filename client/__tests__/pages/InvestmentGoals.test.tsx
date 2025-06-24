/**
 * Testes para a página de Metas de Investimento
 * @author Lucas
 */

/// <reference types="jest" />

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { ThemeProvider } from '../../src/contexts/ThemeContext';
import InvestmentGoals from '../../src/pages/InvestmentGoals';
import investmentGoalService from '../../src/lib/investmentGoalService';

// Mock do serviço de metas de investimento
jest.mock('../../src/lib/investmentGoalService');
const mockInvestmentGoalService = investmentGoalService as jest.Mocked<typeof investmentGoalService>;

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock do contexto de autenticação
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
};

const mockAuthContext = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Dados mockados
const mockGoals = [
  {
    id: 1,
    user_id: 1,
    title: 'Comprar Carro',
    description: 'Meta para comprar um carro novo',
    target_amount: 50000,
    current_amount: 25000,
    target_date: '2024-12-31',
    status: 'ativa' as const,
    color: '#3B82F6',
    progress_percentage: 50,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    title: 'Viagem para Europa',
    description: 'Meta para viajar para Europa',
    target_amount: 30000,
    current_amount: 30000,
    target_date: '2024-06-30',
    status: 'concluida' as const,
    color: '#10B981',
    progress_percentage: 100,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockStats = {
  total_goals: 2,
  active_goals: 1,
  completed_goals: 1,
  cancelled_goals: 0,
  total_target_amount: 80000,
  total_current_amount: 55000,
  average_progress: 75,
  goals_by_status: {
    ativa: 1,
    concluida: 1,
    cancelada: 0,
  },
  goals_by_category: [],
};

// Componente wrapper para testes
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {component}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('InvestmentGoals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock das funções do serviço
    mockInvestmentGoalService.getGoals.mockResolvedValue({
      goals: mockGoals,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      },
    });
    
    mockInvestmentGoalService.getStats.mockResolvedValue(mockStats);
    mockInvestmentGoalService.createGoal.mockResolvedValue(mockGoals[0]);
    mockInvestmentGoalService.validateGoal.mockReturnValue([]);
    mockInvestmentGoalService.formatCurrency.mockImplementation((value) => `R$ ${value.toFixed(2)}`);
    mockInvestmentGoalService.formatPercentage.mockImplementation((value) => `${value.toFixed(1)}%`);
    mockInvestmentGoalService.formatDate.mockImplementation((date) => new Date(date).toLocaleDateString('pt-BR'));
    mockInvestmentGoalService.getGoalStatus.mockReturnValue({
      status: 'on_track',
      message: 'No caminho certo',
    });
    mockInvestmentGoalService.getDaysRemaining.mockReturnValue(30);
    mockInvestmentGoalService.getProgressColor.mockReturnValue('#3B82F6');
  });

  describe('Renderização', () => {
    it('deve renderizar a página corretamente', async () => {
      renderWithProviders(<InvestmentGoals />);

      // Verifica se o título está presente
      expect(screen.getByText('Metas de Investimento')).toBeInTheDocument();
      expect(screen.getByText('Defina e acompanhe suas metas financeiras')).toBeInTheDocument();

      // Verifica se o botão de nova meta está presente
      expect(screen.getByText('Nova Meta')).toBeInTheDocument();

      // Aguarda o carregamento dos dados
      await waitFor(() => {
        expect(screen.getByText('Comprar Carro')).toBeInTheDocument();
        expect(screen.getByText('Viagem para Europa')).toBeInTheDocument();
      });
    });

    it('deve exibir estatísticas corretamente', async () => {
      renderWithProviders(<InvestmentGoals />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total de metas
        expect(screen.getByText('R$ 80000.00')).toBeInTheDocument(); // Valor total alvo
        expect(screen.getByText('75.0%')).toBeInTheDocument(); // Progresso médio
        expect(screen.getByText('1')).toBeInTheDocument(); // Metas concluídas
      });
    });

    it('deve exibir metas com informações corretas', async () => {
      renderWithProviders(<InvestmentGoals />);

      await waitFor(() => {
        // Verifica se as metas estão sendo exibidas
        expect(screen.getByText('Comprar Carro')).toBeInTheDocument();
        expect(screen.getByText('Meta para comprar um carro novo')).toBeInTheDocument();
        expect(screen.getByText('R$ 50000.00')).toBeInTheDocument(); // Valor alvo
        expect(screen.getByText('R$ 25000.00')).toBeInTheDocument(); // Valor atual
        expect(screen.getByText('50.0%')).toBeInTheDocument(); // Progresso
      });
    });
  });

  describe('Funcionalidades de Busca e Filtro', () => {
    it('deve filtrar metas por termo de busca', async () => {
      renderWithProviders(<InvestmentGoals />);

      await waitFor(() => {
        expect(screen.getByText('Comprar Carro')).toBeInTheDocument();
        expect(screen.getByText('Viagem para Europa')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar metas...');
      fireEvent.change(searchInput, { target: { value: 'Carro' } });

      expect(screen.getByText('Comprar Carro')).toBeInTheDocument();
      expect(screen.queryByText('Viagem para Europa')).not.toBeInTheDocument();
    });

    it('deve filtrar metas por status', async () => {
      renderWithProviders(<InvestmentGoals />);

      await waitFor(() => {
        expect(screen.getByText('Comprar Carro')).toBeInTheDocument();
        expect(screen.getByText('Viagem para Europa')).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('Todas');
      fireEvent.click(statusSelect);

      // Simula seleção de status "Ativas"
      const activeOption = screen.getByText('Ativas');
      fireEvent.click(activeOption);

      // Verifica se apenas metas ativas são exibidas
      expect(screen.getByText('Comprar Carro')).toBeInTheDocument();
      expect(screen.queryByText('Viagem para Europa')).not.toBeInTheDocument();
    });
  });

  describe('Criação de Meta', () => {
    it('deve abrir modal de criação ao clicar em Nova Meta', async () => {
      renderWithProviders(<InvestmentGoals />);

      const createButton = screen.getByText('Nova Meta');
      fireEvent.click(createButton);

      expect(screen.getByText('Criar Nova Meta')).toBeInTheDocument();
      expect(screen.getByText('Defina uma nova meta de investimento para acompanhar seu progresso financeiro.')).toBeInTheDocument();
    });

    it('deve criar meta com dados válidos', async () => {
      renderWithProviders(<InvestmentGoals />);

      const createButton = screen.getByText('Nova Meta');
      fireEvent.click(createButton);

      // Preenche o formulário
      const titleInput = screen.getByLabelText('Título *');
      const targetAmountInput = screen.getByLabelText('Valor Alvo *');
      const targetDateInput = screen.getByLabelText('Data Alvo *');

      fireEvent.change(titleInput, { target: { value: 'Nova Meta Teste' } });
      fireEvent.change(targetAmountInput, { target: { value: '10000' } });
      fireEvent.change(targetDateInput, { target: { value: '2024-12-31' } });

      const createGoalButton = screen.getByText('Criar Meta');
      fireEvent.click(createGoalButton);

      await waitFor(() => {
        expect(mockInvestmentGoalService.createGoal).toHaveBeenCalledWith({
          title: 'Nova Meta Teste',
          description: '',
          target_amount: 10000,
          target_date: '2024-12-31',
          current_amount: 0,
          color: '#3B82F6',
        });
      });
    });

    it('deve validar dados obrigatórios', async () => {
      mockInvestmentGoalService.validateGoal.mockReturnValue(['Título deve ter pelo menos 3 caracteres']);

      renderWithProviders(<InvestmentGoals />);

      const createButton = screen.getByText('Nova Meta');
      fireEvent.click(createButton);

      const createGoalButton = screen.getByText('Criar Meta');
      fireEvent.click(createGoalButton);

      await waitFor(() => {
        expect(mockInvestmentGoalService.validateGoal).toHaveBeenCalled();
      });
    });
  });

  describe('Estados de Carregamento', () => {
    it('deve exibir loading durante carregamento', () => {
      mockInvestmentGoalService.getGoals.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<InvestmentGoals />);

      expect(screen.getByText('Carregando metas...')).toBeInTheDocument();
    });

    it('deve exibir mensagem quando não há metas', async () => {
      mockInvestmentGoalService.getGoals.mockResolvedValue({
        goals: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      });

      renderWithProviders(<InvestmentGoals />);

      await waitFor(() => {
        expect(screen.getByText('Nenhuma meta encontrada')).toBeInTheDocument();
        expect(screen.getByText('Crie sua primeira meta de investimento')).toBeInTheDocument();
      });
    });
  });

  describe('Integração com API', () => {
    it('deve carregar metas ao montar o componente', async () => {
      renderWithProviders(<InvestmentGoals />);

      await waitFor(() => {
        expect(mockInvestmentGoalService.getGoals).toHaveBeenCalledWith({
          page: 1,
          limit: 50,
        });
      });
    });

    it('deve carregar estatísticas ao montar o componente', async () => {
      renderWithProviders(<InvestmentGoals />);

      await waitFor(() => {
        expect(mockInvestmentGoalService.getStats).toHaveBeenCalled();
      });
    });

    it('deve recarregar dados ao mudar filtro de status', async () => {
      renderWithProviders(<InvestmentGoals />);

      await waitFor(() => {
        expect(mockInvestmentGoalService.getGoals).toHaveBeenCalledTimes(1);
      });

      const statusSelect = screen.getByDisplayValue('Todas');
      fireEvent.click(statusSelect);
      const activeOption = screen.getByText('Ativas');
      fireEvent.click(activeOption);

      await waitFor(() => {
        expect(mockInvestmentGoalService.getGoals).toHaveBeenCalledWith({
          page: 1,
          limit: 50,
          status: 'ativa',
        });
      });
    });
  });

  describe('Formatação de Dados', () => {
    it('deve formatar valores monetários corretamente', async () => {
      renderWithProviders(<InvestmentGoals />);

      await waitFor(() => {
        expect(screen.getByText('R$ 50000.00')).toBeInTheDocument();
        expect(screen.getByText('R$ 25000.00')).toBeInTheDocument();
      });
    });

    it('deve formatar percentuais corretamente', async () => {
      renderWithProviders(<InvestmentGoals />);

      await waitFor(() => {
        expect(screen.getByText('50.0%')).toBeInTheDocument();
        expect(screen.getByText('100.0%')).toBeInTheDocument();
      });
    });

    it('deve calcular e exibir dias restantes', async () => {
      renderWithProviders(<InvestmentGoals />);

      await waitFor(() => {
        expect(screen.getByText('30 dias restantes')).toBeInTheDocument();
      });
    });
  });

  describe('Status e Progresso', () => {
    it('deve exibir status correto das metas', async () => {
      renderWithProviders(<InvestmentGoals />);

      await waitFor(() => {
        expect(screen.getByText('Ativa')).toBeInTheDocument();
        expect(screen.getByText('Concluída')).toBeInTheDocument();
      });
    });

    it('deve exibir progresso visual das metas', async () => {
      renderWithProviders(<InvestmentGoals />);

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars).toHaveLength(2);
      });
    });

    it('deve exibir alertas para metas em atraso', async () => {
      mockInvestmentGoalService.getGoalStatus.mockReturnValue({
        status: 'behind',
        message: 'Atenção: prazo próximo',
      });

      renderWithProviders(<InvestmentGoals />);

      await waitFor(() => {
        expect(screen.getByText('Atenção: prazo próximo')).toBeInTheDocument();
      });
    });
  });
}); 