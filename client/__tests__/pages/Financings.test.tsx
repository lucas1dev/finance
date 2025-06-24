/**
 * Testes para a página de Financiamentos
 * @author Lucas
 */

/// <reference types="jest" />

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { ThemeProvider } from '../../src/contexts/ThemeContext';
import Financings from '../../src/pages/Financings';
import financingService from '../../src/lib/financingService';

// Mock do serviço de financiamentos
jest.mock('../../src/lib/financingService');
const mockFinancingService = financingService as jest.Mocked<typeof financingService>;

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Dados de teste
const mockFinancings = [
  {
    id: 1,
    user_id: 1,
    creditor_id: 1,
    financing_type: 'emprestimo_pessoal' as const,
    total_amount: 50000,
    interest_rate: 12.5,
    term_months: 60,
    start_date: '2024-01-01',
    description: 'Empréstimo pessoal',
    contract_number: 'EMP001',
    payment_method: 'boleto' as const,
    observations: 'Observações do financiamento',
    amortization_method: 'SAC' as const,
    status: 'ativo' as const,
    remaining_balance: 40000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    creditor: {
      id: 1,
      name: 'Banco Teste',
      document_type: 'CNPJ',
      document_number: '12345678000100',
    },
  },
  {
    id: 2,
    user_id: 1,
    creditor_id: 2,
    financing_type: 'hipoteca' as const,
    total_amount: 200000,
    interest_rate: 8.5,
    term_months: 240,
    start_date: '2024-02-01',
    description: 'Financiamento imobiliário',
    contract_number: 'HIP001',
    payment_method: 'debito_automatico' as const,
    observations: '',
    amortization_method: 'Price' as const,
    status: 'ativo' as const,
    remaining_balance: 180000,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
    creditor: {
      id: 2,
      name: 'Caixa Econômica',
      document_type: 'CNPJ',
      document_number: '00360305000104',
    },
  },
];

const mockStats = {
  total_financings: 2,
  active_financings: 2,
  paid_financings: 0,
  defaulted_financings: 0,
  total_borrowed: 250000,
  total_remaining: 220000,
  total_paid: 30000,
  average_interest_rate: 10.5,
  financings_by_type: {
    hipoteca: 1,
    emprestimo_pessoal: 1,
    veiculo: 0,
    outros: 0,
  },
  financings_by_status: {
    ativo: 2,
    quitado: 0,
    inadimplente: 0,
  },
  financings_by_method: {
    SAC: 1,
    Price: 1,
  },
};

const mockAmortizationTable = [
  {
    installment: 1,
    payment_date: '2024-02-01',
    payment_amount: 1000,
    principal_amount: 800,
    interest_amount: 200,
    remaining_balance: 49200,
  },
  {
    installment: 2,
    payment_date: '2024-03-01',
    payment_amount: 1000,
    principal_amount: 800,
    interest_amount: 200,
    remaining_balance: 48400,
  },
];

const mockPayments = [
  {
    id: 1,
    user_id: 1,
    financing_id: 1,
    account_id: 1,
    installment_number: 1,
    payment_amount: 1000,
    principal_amount: 800,
    interest_amount: 200,
    payment_date: '2024-02-01',
    payment_method: 'boleto' as const,
    payment_type: 'parcela' as const,
    status: 'pago' as const,
    observations: 'Pagamento realizado',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
];

// Mock do contexto de autenticação
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'user' as const,
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

describe('Financings Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mocks padrão
    mockFinancingService.getFinancings.mockResolvedValue({
      financings: mockFinancings,
      pagination: { pages: 1, current: 1, total: 2 },
    });
    mockFinancingService.getStats.mockResolvedValue(mockStats);
    mockFinancingService.getAmortizationTable.mockResolvedValue(mockAmortizationTable);
    mockFinancingService.getPayments.mockResolvedValue({
      payments: mockPayments,
      pagination: { pages: 1, current: 1, total: 1 },
    });
    mockFinancingService.createFinancing.mockResolvedValue(mockFinancings[0]);
    mockFinancingService.createPayment.mockResolvedValue(mockPayments[0]);
    mockFinancingService.deleteFinancing.mockResolvedValue();
    mockFinancingService.validateFinancing.mockReturnValue([]);
    mockFinancingService.validatePayment.mockReturnValue([]);
    mockFinancingService.formatCurrency.mockImplementation((value) => `R$ ${value.toFixed(2)}`);
    mockFinancingService.formatPercentage.mockImplementation((value) => `${value.toFixed(2)}%`);
    mockFinancingService.formatDate.mockImplementation((date) => new Date(date).toLocaleDateString('pt-BR'));
    mockFinancingService.getFinancingStatus.mockReturnValue({
      status: 'ativo',
      message: 'Financiamento ativo',
      color: '#3B82F6',
    });
    mockFinancingService.getFinancingTypeLabel.mockImplementation((type) => {
      const types = {
        hipoteca: 'Hipoteca',
        emprestimo_pessoal: 'Empréstimo Pessoal',
        veiculo: 'Financiamento de Veículo',
        outros: 'Outros',
      };
      return types[type as keyof typeof types] || type;
    });
    mockFinancingService.getPaymentMethodLabel.mockImplementation((method) => {
      const methods = {
        boleto: 'Boleto',
        debito_automatico: 'Débito Automático',
        cartao: 'Cartão',
        pix: 'PIX',
        transferencia: 'Transferência',
      };
      return methods[method as keyof typeof methods] || method;
    });
    mockFinancingService.getAmortizationMethodLabel.mockImplementation((method) => {
      const methods = {
        SAC: 'Sistema de Amortização Constante (SAC)',
        Price: 'Sistema Price',
      };
      return methods[method as keyof typeof methods] || method;
    });
  });

  describe('Renderização', () => {
    it('deve renderizar a página corretamente', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Financiamentos')).toBeInTheDocument();
        expect(screen.getByText('Gerencie seus financiamentos e acompanhe o progresso de pagamento')).toBeInTheDocument();
        expect(screen.getByText('Novo Financiamento')).toBeInTheDocument();
      });
    });

    it('deve carregar e exibir estatísticas', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Total de Financiamentos')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Total Financiado')).toBeInTheDocument();
        expect(screen.getByText('R$ 250000.00')).toBeInTheDocument();
      });
    });

    it('deve carregar e exibir lista de financiamentos', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Empréstimo pessoal')).toBeInTheDocument();
        expect(screen.getByText('Financiamento imobiliário')).toBeInTheDocument();
        expect(screen.getByText('Banco Teste')).toBeInTheDocument();
        expect(screen.getByText('Caixa Econômica')).toBeInTheDocument();
      });
    });

    it('deve exibir loading durante carregamento', () => {
      mockFinancingService.getFinancings.mockImplementation(() => new Promise(() => {}));
      
      renderWithProviders(<Financings />);

      expect(screen.getByText('Carregando financiamentos...')).toBeInTheDocument();
    });
  });

  describe('Filtros e Busca', () => {
    it('deve filtrar financiamentos por termo de busca', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Empréstimo pessoal')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar financiamentos...');
      await userEvent.type(searchInput, 'pessoal');

      expect(screen.getByText('Empréstimo pessoal')).toBeInTheDocument();
      expect(screen.queryByText('Financiamento imobiliário')).not.toBeInTheDocument();
    });

    it('deve filtrar por status', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('Todos');
      fireEvent.click(statusSelect);

      await waitFor(() => {
        expect(screen.getByText('Ativos')).toBeInTheDocument();
      });
    });

    it('deve filtrar por tipo', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Tipo')).toBeInTheDocument();
      });

      const typeSelect = screen.getByDisplayValue('Todos');
      fireEvent.click(typeSelect);

      await waitFor(() => {
        expect(screen.getByText('Hipoteca')).toBeInTheDocument();
        expect(screen.getByText('Empréstimo Pessoal')).toBeInTheDocument();
      });
    });
  });

  describe('Criação de Financiamento', () => {
    it('deve abrir modal de criação', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Novo Financiamento')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Novo Financiamento');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Criar Novo Financiamento')).toBeInTheDocument();
        expect(screen.getByText('Credor *')).toBeInTheDocument();
        expect(screen.getByText('Tipo de Financiamento *')).toBeInTheDocument();
      });
    });

    it('deve criar financiamento com dados válidos', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Novo Financiamento')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Novo Financiamento');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Criar Novo Financiamento')).toBeInTheDocument();
      });

      // Preencher formulário
      const creditorInput = screen.getByPlaceholderText('ID do credor');
      const totalAmountInput = screen.getByPlaceholderText('0,00');
      const interestRateInput = screen.getByDisplayValue('');
      const termMonthsInput = screen.getByPlaceholderText('12');
      const startDateInput = screen.getByDisplayValue('');

      await userEvent.type(creditorInput, '1');
      await userEvent.type(totalAmountInput, '50000');
      await userEvent.type(interestRateInput, '12.5');
      await userEvent.type(termMonthsInput, '60');
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

      const submitButton = screen.getByText('Criar Financiamento');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFinancingService.createFinancing).toHaveBeenCalledWith({
          creditor_id: 1,
          financing_type: 'emprestimo_pessoal',
          total_amount: 50000,
          interest_rate: 12.5,
          term_months: 60,
          start_date: '2024-01-01',
          description: '',
          contract_number: '',
          payment_method: 'boleto',
          observations: '',
          amortization_method: 'SAC',
        });
      });
    });

    it('deve validar dados antes de criar', async () => {
      mockFinancingService.validateFinancing.mockReturnValue(['Valor total deve ser maior que zero']);

      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Novo Financiamento')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Novo Financiamento');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Criar Novo Financiamento')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Criar Financiamento');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFinancingService.validateFinancing).toHaveBeenCalled();
      });
    });
  });

  describe('Tabela de Amortização', () => {
    it('deve abrir modal de tabela de amortização', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Tabela')).toBeInTheDocument();
      });

      const tableButtons = screen.getAllByText('Tabela');
      fireEvent.click(tableButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Tabela de Amortização')).toBeInTheDocument();
        expect(mockFinancingService.getAmortizationTable).toHaveBeenCalledWith(1);
      });
    });

    it('deve exibir tabela de amortização corretamente', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Tabela')).toBeInTheDocument();
      });

      const tableButtons = screen.getAllByText('Tabela');
      fireEvent.click(tableButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Parcela')).toBeInTheDocument();
        expect(screen.getByText('Data')).toBeInTheDocument();
        expect(screen.getByText('Valor da Parcela')).toBeInTheDocument();
        expect(screen.getByText('Amortização')).toBeInTheDocument();
        expect(screen.getByText('Juros')).toBeInTheDocument();
        expect(screen.getByText('Saldo Devedor')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  describe('Pagamentos', () => {
    it('deve abrir modal de pagamento', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getAllByText('Pagar')).toHaveLength(2);
      });

      // Usar getAllByText e pegar o primeiro botão de pagamento
      const payButtons = screen.getAllByText('Pagar');
      fireEvent.click(payButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Registrar Pagamento')).toBeInTheDocument();
        expect(screen.getByText('Conta *')).toBeInTheDocument();
        expect(screen.getByText('Número da Parcela *')).toBeInTheDocument();
      });
    });

    it('deve registrar pagamento com dados válidos', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getAllByText('Pagar')).toHaveLength(2);
      });

      // Usar getAllByText e pegar o primeiro botão de pagamento
      const payButtons = screen.getAllByText('Pagar');
      fireEvent.click(payButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Registrar Pagamento')).toBeInTheDocument();
      });

      // Preencher formulário de pagamento
      const accountInput = screen.getByPlaceholderText('ID da conta');
      const installmentInput = screen.getByPlaceholderText('1');
      const amountInput = screen.getByPlaceholderText('0,00');
      const dateInput = screen.getByDisplayValue('');

      await userEvent.type(accountInput, '1');
      await userEvent.type(installmentInput, '1');
      await userEvent.type(amountInput, '1000');
      fireEvent.change(dateInput, { target: { value: '2024-02-01' } });

      const submitButton = screen.getByText('Registrar Pagamento');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFinancingService.createPayment).toHaveBeenCalledWith({
          financing_id: 1,
          account_id: 1,
          installment_number: 1,
          payment_amount: 1000,
          principal_amount: 0,
          interest_amount: 0,
          payment_date: '2024-02-01',
          payment_method: 'boleto',
          payment_type: 'parcela',
          observations: '',
        });
      });
    });

    it('deve validar dados de pagamento', async () => {
      mockFinancingService.validatePayment.mockReturnValue(['Valor do pagamento deve ser maior que zero']);

      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getAllByText('Pagar')).toHaveLength(2);
      });

      // Usar getAllByText e pegar o primeiro botão de pagamento
      const payButtons = screen.getAllByText('Pagar');
      fireEvent.click(payButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Registrar Pagamento')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Registrar Pagamento');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFinancingService.validatePayment).toHaveBeenCalled();
      });
    });
  });

  describe('Exclusão', () => {
    it('deve confirmar exclusão antes de deletar', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getAllByText('Excluir')).toHaveLength(2);
      });

      // Usar getAllByText e pegar o primeiro botão de exclusão
      const deleteButtons = screen.getAllByText('Excluir');
      fireEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith('Tem certeza que deseja excluir este financiamento?');
      expect(mockFinancingService.deleteFinancing).toHaveBeenCalledWith(1);

      confirmSpy.mockRestore();
    });

    it('não deve deletar se usuário cancelar', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getAllByText('Excluir')).toHaveLength(2);
      });

      // Usar getAllByText e pegar o primeiro botão de exclusão
      const deleteButtons = screen.getAllByText('Excluir');
      fireEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockFinancingService.deleteFinancing).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Estados Vazios', () => {
    it('deve exibir mensagem quando não há financiamentos', async () => {
      mockFinancingService.getFinancings.mockResolvedValue({
        financings: [],
        pagination: { pages: 0, current: 1, total: 0 },
      });

      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum financiamento encontrado')).toBeInTheDocument();
        expect(screen.getByText('Crie seu primeiro financiamento para começar')).toBeInTheDocument();
      });
    });

    it('deve exibir mensagem quando filtros não retornam resultados', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Empréstimo pessoal')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar financiamentos...');
      await userEvent.type(searchInput, 'financiamento inexistente');

      expect(screen.getByText('Nenhum financiamento encontrado')).toBeInTheDocument();
      expect(screen.getByText('Tente ajustar os filtros de busca')).toBeInTheDocument();
    });
  });

  describe('Integração com API', () => {
    it('deve carregar dados ao montar componente', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(mockFinancingService.getFinancings).toHaveBeenCalled();
        expect(mockFinancingService.getStats).toHaveBeenCalled();
      });
    });

    it('deve recarregar dados após operações', async () => {
      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Novo Financiamento')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Novo Financiamento');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Criar Novo Financiamento')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Criar Financiamento');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFinancingService.createFinancing).toHaveBeenCalled();
        expect(mockFinancingService.getFinancings).toHaveBeenCalledTimes(2);
        expect(mockFinancingService.getStats).toHaveBeenCalledTimes(2);
      });
    });

    it('deve tratar erros de API', async () => {
      mockFinancingService.getFinancings.mockRejectedValue(new Error('Erro de API'));

      renderWithProviders(<Financings />);

      await waitFor(() => {
        expect(screen.getByText('Carregando financiamentos...')).toBeInTheDocument();
      });

      // Aguardar o erro ser tratado
      await waitFor(() => {
        expect(screen.getByText('Nenhum financiamento encontrado')).toBeInTheDocument();
      });
    });
  });
}); 