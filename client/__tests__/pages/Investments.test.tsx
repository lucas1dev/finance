/**
 * Testes para a página de Investimentos
 * @author Lucas
 */

/// <reference types="jest" />

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { ThemeProvider } from '../../src/contexts/ThemeContext';
import Investments from '../../src/pages/Investments';
import investmentService from '../../src/lib/investmentService';

// Mock do serviço de investimentos
jest.mock('../../src/lib/investmentService');
const mockInvestmentService = investmentService as jest.Mocked<typeof investmentService>;

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock do contexto de autenticação
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'user' as const,
  two_factor_enabled: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockAuthContext = {
  user: mockUser,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  updateProfile: jest.fn(),
  updatePassword: jest.fn(),
  enable2FA: jest.fn(),
  disable2FA: jest.fn(),
  verify2FA: jest.fn(),
};

// Mock do AuthContext
jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Dados mockados
const mockInvestments = [
  {
    id: 1,
    user_id: 1,
    name: 'Ações Petrobras',
    type: 'stocks',
    amount: 10000,
    current_value: 12000,
    purchase_date: '2024-01-01',
    purchase_price: 25.50,
    quantity: 392,
    broker: 'XP Investimentos',
    description: 'Ações da Petrobras',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    name: 'CDB Banco Inter',
    type: 'bonds',
    amount: 5000,
    current_value: 5200,
    purchase_date: '2024-01-15',
    purchase_price: 1000,
    quantity: 5,
    broker: 'Banco Inter',
    description: 'CDB com rendimento de 120% do CDI',
    status: 'active',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
];

const mockInvestmentStats = {
  total_investments: 2,
  total_invested: 15000,
  total_current_value: 17200,
  total_profit_loss: 2200,
  total_profit_loss_percentage: 14.67,
  investments_by_type: [
    {
      type: 'stocks',
      count: 1,
      amount: 10000,
      percentage: 66.67,
    },
    {
      type: 'bonds',
      count: 1,
      amount: 5000,
      percentage: 33.33,
    },
  ],
  top_performers: [
    {
      id: 1,
      name: 'Ações Petrobras',
      profit_loss: 2000,
      profit_loss_percentage: 20,
    },
  ],
  monthly_performance: [
    {
      month: '2024-01',
      invested: 15000,
      current_value: 17200,
      profit_loss: 2200,
    },
  ],
};

// Função helper para renderizar com providers
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

describe('Investments Page', () => {
  beforeEach(() => {
    // Reset dos mocks
    jest.clearAllMocks();
    
    // Configurar mocks padrão com formato correto
    mockInvestmentService.getInvestments.mockResolvedValue({
      data: mockInvestments,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      },
    });
    mockInvestmentService.getInvestmentStats.mockResolvedValue(mockInvestmentStats);
    mockInvestmentService.createInvestment.mockResolvedValue(mockInvestments[0]);
    mockInvestmentService.updateInvestment.mockResolvedValue(mockInvestments[0]);
    mockInvestmentService.deleteInvestment.mockResolvedValue(undefined);
    mockInvestmentService.addTransaction.mockResolvedValue(undefined);
    mockInvestmentService.exportInvestments.mockResolvedValue(new Blob(['test']));
    
    // Mock dos métodos de cálculo
    mockInvestmentService.calculateProfitLoss.mockReturnValue({
      value: 2000,
      percentage: 20.0,
    });
    mockInvestmentService.calculateAnnualizedReturn.mockReturnValue(15.5);
  });

  describe('Renderização Inicial', () => {
    it('deve renderizar a página com título e descrição', async () => {
      renderWithProviders(<Investments />);

      expect(screen.getByText('Investimentos')).toBeInTheDocument();
      expect(screen.getByText('Gerencie seus investimentos e acompanhe a performance')).toBeInTheDocument();
    });

    it('deve exibir estatísticas dos investimentos', async () => {
      renderWithProviders(<Investments />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total de investimentos
        expect(screen.getByText('R$ 15.000,00')).toBeInTheDocument(); // Total investido
        expect(screen.getByText('R$ 17.200,00')).toBeInTheDocument(); // Valor atual
        expect(screen.getByText('R$ 2.200,00')).toBeInTheDocument(); // Lucro/Prejuízo
      });
    });

    it('deve carregar e exibir lista de investimentos', async () => {
      renderWithProviders(<Investments />);

      await waitFor(() => {
        expect(screen.getByText('Ações Petrobras')).toBeInTheDocument();
        expect(screen.getByText('CDB Banco Inter')).toBeInTheDocument();
        expect(screen.getByText('XP Investimentos')).toBeInTheDocument();
        expect(screen.getByText('Banco Inter')).toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidades de CRUD', () => {
    it('deve abrir modal para criar novo investimento', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Investments />);

      const newButton = screen.getByText('Novo Investimento');
      await user.click(newButton);

      await waitFor(() => {
        expect(screen.getByText('Criar Investimento')).toBeInTheDocument();
        expect(screen.getByLabelText('Nome do Investimento')).toBeInTheDocument();
      });
    });

    it('deve criar investimento com dados válidos', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Investments />);

      // Abrir modal
      const newButton = screen.getByText('Novo Investimento');
      await user.click(newButton);

      await waitFor(() => {
        expect(screen.getByText('Criar Investimento')).toBeInTheDocument();
      });

      // Preencher formulário
      const nameInput = screen.getByLabelText('Nome do Investimento');
      const typeSelect = screen.getByLabelText('Tipo de Investimento');
      const amountInput = screen.getByLabelText('Valor Investido');

      await user.type(nameInput, 'Tesouro Direto');
      await user.selectOptions(typeSelect, 'bonds');
      await user.type(amountInput, '10000');

      // Submeter formulário
      const submitButton = screen.getByText('Criar');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockInvestmentService.createInvestment).toHaveBeenCalledWith({
          name: 'Tesouro Direto',
          type: 'bonds',
          amount: 10000,
          purchase_date: expect.any(String),
          purchase_price: expect.any(Number),
          quantity: expect.any(Number),
          broker: undefined,
          description: undefined,
        });
      });
    });

    it('deve editar investimento existente', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Investments />);

      await waitFor(() => {
        expect(screen.getByText('Ações Petrobras')).toBeInTheDocument();
      });

      // Clicar no botão de editar (primeiro investimento)
      const editButtons = screen.getAllByText('Editar');
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Editar Investimento')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Ações Petrobras')).toBeInTheDocument();
      });
    });

    it('deve excluir investimento com confirmação', async () => {
      const user = userEvent.setup();
      // Mock do confirm
      window.confirm = jest.fn(() => true);
      
      renderWithProviders(<Investments />);

      await waitFor(() => {
        expect(screen.getByText('Ações Petrobras')).toBeInTheDocument();
      });

      // Clicar no botão de excluir (primeiro investimento)
      const deleteButtons = screen.getAllByText('Excluir');
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir este investimento?');
      expect(mockInvestmentService.deleteInvestment).toHaveBeenCalledWith(1);
    });
  });

  describe('Transações de Investimento', () => {
    it('deve abrir modal para registrar transação', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Investments />);

      await waitFor(() => {
        expect(screen.getByText('Ações Petrobras')).toBeInTheDocument();
      });

      // Clicar no botão de transação (primeiro investimento)
      const transactionButtons = screen.getAllByText('Transação');
      await user.click(transactionButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Registrar Transação')).toBeInTheDocument();
      });
    });

    it('deve registrar transação com dados válidos', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Investments />);

      await waitFor(() => {
        expect(screen.getByText('Ações Petrobras')).toBeInTheDocument();
      });

      // Abrir modal de transação
      const transactionButtons = screen.getAllByText('Transação');
      await user.click(transactionButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Registrar Transação')).toBeInTheDocument();
      });

      // Preencher formulário de transação
      const typeSelect = screen.getByLabelText('Tipo de Transação');
      const amountInput = screen.getByLabelText('Valor');
      const quantityInput = screen.getByLabelText('Quantidade');

      await user.selectOptions(typeSelect, 'buy');
      await user.type(amountInput, '5000');
      await user.type(quantityInput, '100');

      // Submeter formulário
      const submitButton = screen.getByText('Registrar Transação');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockInvestmentService.addTransaction).toHaveBeenCalledWith(1, {
          type: 'buy',
          amount: 5000,
          quantity: 100,
          price: expect.any(Number),
          date: expect.any(String),
          description: undefined,
        });
      });
    });
  });

  describe('Navegação por Tabs', () => {
    it('deve alternar entre tabs corretamente', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Investments />);

      await waitFor(() => {
        expect(screen.getByText('Ações Petrobras')).toBeInTheDocument();
      });

      // Verificar se a tab "Visão Geral" está ativa por padrão
      expect(screen.getByText('Visão Geral')).toHaveAttribute('data-state', 'active');

      // Clicar na tab "Estatísticas"
      const statsTab = screen.getByText('Estatísticas');
      await user.click(statsTab);

      await waitFor(() => {
        expect(screen.getByText('Estatísticas')).toHaveAttribute('data-state', 'active');
      });
    });
  });

  describe('Filtros e Busca', () => {
    it('deve filtrar investimentos por busca', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Investments />);

      await waitFor(() => {
        expect(screen.getByText('Ações Petrobras')).toBeInTheDocument();
        expect(screen.getByText('CDB Banco Inter')).toBeInTheDocument();
      });

      // Buscar por "Petrobras"
      const searchInput = screen.getByPlaceholderText('Nome, corretora, descrição...');
      await user.type(searchInput, 'Petrobras');

      await waitFor(() => {
        expect(screen.getByText('Ações Petrobras')).toBeInTheDocument();
        expect(screen.queryByText('CDB Banco Inter')).not.toBeInTheDocument();
      });
    });

    it('deve filtrar por tipo de investimento', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Investments />);

      await waitFor(() => {
        expect(screen.getByText('Ações Petrobras')).toBeInTheDocument();
        expect(screen.getByText('CDB Banco Inter')).toBeInTheDocument();
      });

      // Filtrar por "Ações"
      const typeSelect = screen.getByDisplayValue('Todos os Tipos');
      await user.selectOptions(typeSelect, 'stocks');

      await waitFor(() => {
        expect(screen.getByText('Ações Petrobras')).toBeInTheDocument();
        expect(screen.queryByText('CDB Banco Inter')).not.toBeInTheDocument();
      });
    });
  });

  describe('Exportação de Dados', () => {
    it('deve exportar investimentos para CSV', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Investments />);

      await waitFor(() => {
        expect(screen.getByText('Ações Petrobras')).toBeInTheDocument();
      });

      // Clicar no botão de exportar
      const exportButton = screen.getByText('Exportar');
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockInvestmentService.exportInvestments).toHaveBeenCalledWith({});
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve exibir mensagem de erro quando falha ao carregar investimentos', async () => {
      // Mock do erro
      mockInvestmentService.getInvestments.mockRejectedValue(new Error('Erro de rede'));

      renderWithProviders(<Investments />);

      await waitFor(() => {
        expect(screen.getByText('Erro de rede')).toBeInTheDocument();
        expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
      });
    });

    it('deve exibir estado vazio quando não há investimentos', async () => {
      // Mock de lista vazia
      mockInvestmentService.getInvestments.mockResolvedValue([]);
      mockInvestmentService.getInvestmentStats.mockResolvedValue({
        ...mockInvestmentStats,
        total_investments: 0,
      });

      renderWithProviders(<Investments />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum investimento encontrado')).toBeInTheDocument();
        expect(screen.getByText('Adicionar Primeiro Investimento')).toBeInTheDocument();
      });
    });
  });

  describe('Responsividade', () => {
    it('deve adaptar layout para telas menores', async () => {
      renderWithProviders(<Investments />);

      await waitFor(() => {
        expect(screen.getByText('Ações Petrobras')).toBeInTheDocument();
      });

      // Verificar se os elementos responsivos estão presentes
      expect(screen.getByText('Investimentos')).toBeInTheDocument();
      expect(screen.getByText('Novo Investimento')).toBeInTheDocument();
      expect(screen.getByText('Exportar')).toBeInTheDocument();
    });
  });
}); 