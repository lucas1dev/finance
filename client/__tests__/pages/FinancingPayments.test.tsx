import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'sonner';
import FinancingPayments from '../../src/pages/FinancingPayments';
import financingService from '../../src/lib/financingService';

// Mock do financingService
jest.mock('../../src/lib/financingService');
const mockFinancingService = financingService as jest.Mocked<typeof financingService>;

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock dos dados de pagamento
const mockPayments = [
  {
    id: 1,
    user_id: 1,
    financing_id: 1,
    account_id: 1,
    installment_number: 1,
    payment_amount: 1000.00,
    principal_amount: 800.00,
    interest_amount: 200.00,
    payment_date: '2024-01-15',
    payment_method: 'pix' as const,
    payment_type: 'parcela' as const,
    status: 'pago' as const,
    observations: 'Pagamento da primeira parcela',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    financing_id: 1,
    account_id: 1,
    installment_number: 2,
    payment_amount: 1000.00,
    principal_amount: 820.00,
    interest_amount: 180.00,
    payment_date: '2024-02-15',
    payment_method: 'boleto' as const,
    payment_type: 'parcela' as const,
    status: 'pendente' as const,
    observations: 'Segunda parcela',
    created_at: '2024-02-15T10:00:00Z',
    updated_at: '2024-02-15T10:00:00Z',
  },
];

const mockPagination = {
  page: 1,
  limit: 10,
  total: 2,
  totalPages: 1,
};

// Wrapper para renderizar com Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('FinancingPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFinancingService.getPayments.mockResolvedValue({
      payments: mockPayments,
      pagination: mockPagination,
    });
    mockFinancingService.createPayment.mockResolvedValue(mockPayments[0]);
    mockFinancingService.formatCurrency.mockImplementation((value: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    );
    mockFinancingService.formatDate.mockImplementation((date: string) => 
      new Date(date).toLocaleDateString('pt-BR')
    );
  });

  describe('Renderização', () => {
    it('deve renderizar a página corretamente', async () => {
      renderWithRouter(<FinancingPayments />);
      
      expect(screen.getByText('Pagamentos de Financiamentos')).toBeInTheDocument();
      expect(screen.getAllByText('Registrar Pagamento')[0]).toBeInTheDocument();
      expect(screen.getByText('Filtrar')).toBeInTheDocument();
    });

    it('deve exibir a tabela de pagamentos', async () => {
      renderWithRouter(<FinancingPayments />);
      
      await waitFor(() => {
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Financiamento')).toBeInTheDocument();
        expect(screen.getByText('Conta')).toBeInTheDocument();
        expect(screen.getByText('Parcela')).toBeInTheDocument();
        expect(screen.getByText('Valor')).toBeInTheDocument();
        expect(screen.getByText('Amortização')).toBeInTheDocument();
        expect(screen.getByText('Juros')).toBeInTheDocument();
        expect(screen.getByText('Data')).toBeInTheDocument();
        expect(screen.getAllByText('Status')[1]).toBeInTheDocument();
      });
    });

    it('deve carregar e exibir os pagamentos', async () => {
      renderWithRouter(<FinancingPayments />);
      
      await waitFor(() => {
        expect(screen.getAllByText('1').length).toBeGreaterThan(1);
        expect(screen.getAllByText('R$ 1.000,00')).toHaveLength(2);
        expect(screen.getByText('R$ 800,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 200,00')).toBeInTheDocument();
        expect(screen.getByText('pago')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros', () => {
    it('deve aplicar filtro por ID do financiamento', async () => {
      renderWithRouter(<FinancingPayments />);
      
      const financingInputs = screen.getAllByPlaceholderText('ID do Financiamento');
      const filterInput = financingInputs[0];
      fireEvent.change(filterInput, { target: { name: 'financing_id', value: '1' } });
      
      await waitFor(() => {
        expect(mockFinancingService.getPayments).toHaveBeenCalledWith(
          expect.objectContaining({ financing_id: '1' })
        );
      });
    });

    it('deve aplicar filtro por status', async () => {
      renderWithRouter(<FinancingPayments />);
      
      const statusButtons = screen.getAllByText('Status');
      fireEvent.click(statusButtons[0]);
      
      const pagoOption = screen.getByText('Pago');
      fireEvent.click(pagoOption);
      
      await waitFor(() => {
        expect(mockFinancingService.getPayments).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'pago' })
        );
      });
    });

    it('deve aplicar filtro por ID da conta', async () => {
      renderWithRouter(<FinancingPayments />);
      
      const accountInputs = screen.getAllByPlaceholderText('ID da Conta');
      const filterInput = accountInputs[0];
      fireEvent.change(filterInput, { target: { name: 'account_id', value: '2' } });
      
      await waitFor(() => {
        expect(mockFinancingService.getPayments).toHaveBeenCalledWith(
          expect.objectContaining({ account_id: '2' })
        );
      });
    });
  });

  describe('Formulário de Registro', () => {
    it('deve abrir o modal de registro ao clicar no botão', async () => {
      renderWithRouter(<FinancingPayments />);
      
      const registerButton = screen.getAllByText('Registrar Pagamento')[0];
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('Registrar Pagamento')[1]).toBeInTheDocument();
      });
    });

    it('deve preencher o formulário corretamente', async () => {
      renderWithRouter(<FinancingPayments />);
      
      const registerButton = screen.getAllByText('Registrar Pagamento')[0];
      fireEvent.click(registerButton);
      
      await waitFor(() => {
        const formInputs = screen.getAllByPlaceholderText('ID do Financiamento');
        const financingInput = formInputs[1];
        const accountInputs = screen.getAllByPlaceholderText('ID da Conta');
        const accountInput = accountInputs[1];
        const installmentInput = screen.getByPlaceholderText('Nº Parcela');
        const amountInput = screen.getByPlaceholderText('Valor Total');
        
        fireEvent.change(financingInput, { target: { value: '1' } });
        fireEvent.change(accountInput, { target: { value: '1' } });
        fireEvent.change(installmentInput, { target: { value: '3' } });
        fireEvent.change(amountInput, { target: { value: '1000.00' } });
        
        expect(financingInput).toHaveValue('1');
        expect(accountInput).toHaveValue('1');
        expect(installmentInput).toHaveValue(3);
        expect(amountInput).toHaveValue(1000.00);
      });
    });

    it('deve registrar um novo pagamento com sucesso', async () => {
      renderWithRouter(<FinancingPayments />);
      
      const registerButton = screen.getAllByText('Registrar Pagamento')[0];
      fireEvent.click(registerButton);
      
      await waitFor(async () => {
        const formInputs = screen.getAllByPlaceholderText('ID do Financiamento');
        const financingInput = formInputs[1];
        const accountInputs = screen.getAllByPlaceholderText('ID da Conta');
        const accountInput = accountInputs[1];
        const installmentInput = screen.getByPlaceholderText('Nº Parcela');
        const amountInput = screen.getByPlaceholderText('Valor Total');
        const principalInput = screen.getByPlaceholderText('Valor Amortização');
        const interestInput = screen.getByPlaceholderText('Valor Juros');
        const dateInput = screen.getByPlaceholderText('Data do Pagamento');
        
        fireEvent.change(financingInput, { target: { value: '1' } });
        fireEvent.change(accountInput, { target: { value: '1' } });
        fireEvent.change(installmentInput, { target: { value: '3' } });
        fireEvent.change(amountInput, { target: { value: '1000.00' } });
        fireEvent.change(principalInput, { target: { value: '800.00' } });
        fireEvent.change(interestInput, { target: { value: '200.00' } });
        fireEvent.change(dateInput, { target: { value: '2024-03-15' } });
        
        const saveButton = screen.getByText('Salvar');
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(mockFinancingService.createPayment).toHaveBeenCalledWith({
            financing_id: '1',
            account_id: '1',
            installment_number: '3',
            payment_amount: '1000.00',
            principal_amount: '800.00',
            interest_amount: '200.00',
            payment_date: '2024-03-15',
          });
          expect(toast.success).toHaveBeenCalledWith('Pagamento registrado com sucesso');
        });
      });
    });

    it('deve exibir erro ao falhar no registro', async () => {
      mockFinancingService.createPayment.mockRejectedValue(new Error('Erro no servidor'));
      
      renderWithRouter(<FinancingPayments />);
      
      const registerButton = screen.getAllByText('Registrar Pagamento')[0];
      fireEvent.click(registerButton);
      
      await waitFor(async () => {
        const formInputs = screen.getAllByPlaceholderText('ID do Financiamento');
        const financingInput = formInputs[1];
        const accountInputs = screen.getAllByPlaceholderText('ID da Conta');
        const accountInput = accountInputs[1];
        const installmentInput = screen.getByPlaceholderText('Nº Parcela');
        const amountInput = screen.getByPlaceholderText('Valor Total');
        const principalInput = screen.getByPlaceholderText('Valor Amortização');
        const interestInput = screen.getByPlaceholderText('Valor Juros');
        const dateInput = screen.getByPlaceholderText('Data do Pagamento');
        
        fireEvent.change(financingInput, { target: { value: '1' } });
        fireEvent.change(accountInput, { target: { value: '1' } });
        fireEvent.change(installmentInput, { target: { value: '3' } });
        fireEvent.change(amountInput, { target: { value: '1000.00' } });
        fireEvent.change(principalInput, { target: { value: '800.00' } });
        fireEvent.change(interestInput, { target: { value: '200.00' } });
        fireEvent.change(dateInput, { target: { value: '2024-03-15' } });
        
        const saveButton = screen.getByText('Salvar');
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Erro ao registrar pagamento');
        });
      });
    });
  });

  describe('Paginação', () => {
    it('deve navegar para a próxima página', async () => {
      const manyPayments = Array.from({ length: 15 }, (_, i) => ({
        ...mockPayments[0],
        id: i + 1,
      }));
      
      mockFinancingService.getPayments.mockResolvedValue({
        payments: manyPayments,
        pagination: { ...mockPagination, total: 15, totalPages: 2 },
      });
      
      renderWithRouter(<FinancingPayments />);
      
      await waitFor(() => {
        const nextButton = screen.getByText('Próxima');
        expect(nextButton).not.toBeDisabled();
        fireEvent.click(nextButton);
        
        expect(mockFinancingService.getPayments).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });

    it('deve navegar para a página anterior', async () => {
      mockFinancingService.getPayments.mockResolvedValue({
        payments: mockPayments,
        pagination: { ...mockPagination, page: 2 },
      });
      
      renderWithRouter(<FinancingPayments />);
      
      await waitFor(() => {
        const prevButton = screen.getByText('Anterior');
        expect(prevButton).not.toBeDisabled();
        fireEvent.click(prevButton);
        
        expect(mockFinancingService.getPayments).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1 })
        );
      });
    });
  });

  describe('Estados de Loading', () => {
    it('deve exibir loading durante o carregamento', async () => {
      mockFinancingService.getPayments.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          payments: mockPayments,
          pagination: mockPagination,
        }), 100))
      );
      
      renderWithRouter(<FinancingPayments />);
      
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
      });
    });

    it('deve exibir mensagem quando não há pagamentos', async () => {
      mockFinancingService.getPayments.mockResolvedValue({
        payments: [],
        pagination: { ...mockPagination, total: 0 },
      });
      
      renderWithRouter(<FinancingPayments />);
      
      await waitFor(() => {
        expect(screen.getByText('Nenhum pagamento encontrado')).toBeInTheDocument();
      });
    });
  });

  describe('Formatação', () => {
    it('deve formatar valores monetários corretamente', async () => {
      renderWithRouter(<FinancingPayments />);
      
      await waitFor(() => {
        expect(screen.getAllByText('R$ 1.000,00')).toHaveLength(2);
        expect(screen.getByText('R$ 800,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 200,00')).toBeInTheDocument();
      });
    });

    it('deve formatar datas corretamente', async () => {
      renderWithRouter(<FinancingPayments />);
      await waitFor(() => {
        // Verifica se as datas exibidas na tabela estão corretas
        expect(screen.getByText('14/01/2024')).toBeInTheDocument();
        expect(screen.getByText('14/02/2024')).toBeInTheDocument();
      });
    });
  });
}); 