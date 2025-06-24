import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FixedAccountFormSimple } from '@/components/FixedAccountFormSimple';

// Mock dos serviços
vi.mock('@/lib/categoryService', () => ({
  default: {
    getCategoriesByType: vi.fn(),
  },
}));

vi.mock('@/lib/supplierService', () => ({
  default: {
    getSuppliers: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import categoryService from '@/lib/categoryService';
import supplierService from '@/lib/supplierService';
import { toast } from 'sonner';

describe('FixedAccountFormSimple', () => {
  const mockCategories = [
    { id: 1, name: 'Moradia', color: '#FF0000', type: 'expense' },
    { id: 2, name: 'Transporte', color: '#00FF00', type: 'expense' },
  ];

  const mockSuppliers = [
    { id: 1, name: 'Fornecedor A' },
    { id: 2, name: 'Fornecedor B' },
  ];

  const mockInitialData = {
    id: 1,
    description: 'Aluguel',
    amount: 1500.00,
    periodicity: 'monthly' as const,
    start_date: '2024-01-01',
    category_id: 1,
    supplier_id: 1,
    payment_method: 'boleto' as const,
    observations: 'Aluguel do apartamento',
    reminder_days: 3,
  };

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock das respostas dos serviços
    (categoryService.getCategoriesByType as any).mockResolvedValue(mockCategories);
    (supplierService.getSuppliers as any).mockResolvedValue(mockSuppliers);
  });

  describe('Rendering', () => {
    it('should render form fields correctly', async () => {
      render(
        <FixedAccountFormSimple
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Verificar se os campos estão presentes
      expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/valor/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/periodicidade/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/data de início/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fornecedor/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/método de pagamento/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/dias de antecedência/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/observações/i)).toBeInTheDocument();

      // Verificar se os botões estão presentes
      expect(screen.getByRole('button', { name: /criar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('should render with initial data when provided', async () => {
      render(
        <FixedAccountFormSimple
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Verificar se os campos estão preenchidos com os dados iniciais
      expect(screen.getByDisplayValue('Aluguel')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1500')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Aluguel do apartamento')).toBeInTheDocument();
      expect(screen.getByDisplayValue('3')).toBeInTheDocument();

      // Verificar se o botão mostra "Atualizar" em vez de "Criar"
      expect(screen.getByRole('button', { name: /atualizar/i })).toBeInTheDocument();
    });

    it('should show loading states while fetching data', async () => {
      // Mock de carregamento lento
      (categoryService.getCategoriesByType as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockCategories), 100))
      );

      render(
        <FixedAccountFormSimple
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Verificar se mostra "Carregando..." nos selects
      expect(screen.getByText(/carregando categorias/i)).toBeInTheDocument();
      expect(screen.getByText(/carregando fornecedores/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty description', async () => {
      const user = userEvent.setup();
      
      render(
        <FixedAccountFormSimple
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Preencher apenas o valor e tentar submeter
      const amountInput = screen.getByLabelText(/valor/i);
      await user.type(amountInput, '1500');

      const submitButton = screen.getByRole('button', { name: /criar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Descrição é obrigatória');
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error for invalid amount', async () => {
      const user = userEvent.setup();
      
      render(
        <FixedAccountFormSimple
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Preencher descrição e valor inválido
      const descriptionInput = screen.getByLabelText(/descrição/i);
      const amountInput = screen.getByLabelText(/valor/i);
      
      await user.type(descriptionInput, 'Aluguel');
      await user.type(amountInput, '0');

      const submitButton = screen.getByRole('button', { name: /criar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Valor deve ser maior que zero');
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error for missing category', async () => {
      const user = userEvent.setup();
      
      render(
        <FixedAccountFormSimple
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Preencher campos obrigatórios exceto categoria
      const descriptionInput = screen.getByLabelText(/descrição/i);
      const amountInput = screen.getByLabelText(/valor/i);
      
      await user.type(descriptionInput, 'Aluguel');
      await user.type(amountInput, '1500');

      const submitButton = screen.getByRole('button', { name: /criar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Categoria é obrigatória');
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with correct data', async () => {
      const user = userEvent.setup();
      
      render(
        <FixedAccountFormSimple
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Aguardar carregamento dos dados
      await waitFor(() => {
        expect(screen.queryByText(/carregando categorias/i)).not.toBeInTheDocument();
      });

      // Preencher formulário
      const descriptionInput = screen.getByLabelText(/descrição/i);
      const amountInput = screen.getByLabelText(/valor/i);
      const observationsInput = screen.getByLabelText(/observações/i);
      
      await user.type(descriptionInput, 'Aluguel');
      await user.type(amountInput, '1500');
      await user.type(observationsInput, 'Aluguel do apartamento');

      // Selecionar periodicidade
      const periodicitySelect = screen.getByLabelText(/periodicidade/i);
      await user.click(periodicitySelect);
      await user.click(screen.getByText('Mensal'));

      // Selecionar categoria
      const categorySelect = screen.getByLabelText(/categoria/i);
      await user.click(categorySelect);
      await user.click(screen.getByText('Moradia'));

      // Selecionar fornecedor
      const supplierSelect = screen.getByLabelText(/fornecedor/i);
      await user.click(supplierSelect);
      await user.click(screen.getByText('Fornecedor A'));

      // Selecionar método de pagamento
      const paymentMethodSelect = screen.getByLabelText(/método de pagamento/i);
      await user.click(paymentMethodSelect);
      await user.click(screen.getByText('Boleto'));

      // Submeter formulário
      const submitButton = screen.getByRole('button', { name: /criar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          description: 'Aluguel',
          amount: 1500,
          periodicity: 'monthly',
          start_date: expect.any(String), // Data atual formatada
          category_id: 1,
          supplier_id: 1,
          payment_method: 'boleto',
          observations: 'Aluguel do apartamento',
          reminder_days: 3,
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Conta fixa criada com sucesso');
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      const error = new Error('API Error');
      mockOnSubmit.mockRejectedValue(error);
      
      render(
        <FixedAccountFormSimple
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Aguardar carregamento dos dados
      await waitFor(() => {
        expect(screen.queryByText(/carregando categorias/i)).not.toBeInTheDocument();
      });

      // Preencher formulário mínimo
      const descriptionInput = screen.getByLabelText(/descrição/i);
      const amountInput = screen.getByLabelText(/valor/i);
      
      await user.type(descriptionInput, 'Aluguel');
      await user.type(amountInput, '1500');

      // Selecionar categoria
      const categorySelect = screen.getByLabelText(/categoria/i);
      await user.click(categorySelect);
      await user.click(screen.getByText('Moradia'));

      // Submeter formulário
      const submitButton = screen.getByRole('button', { name: /criar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('API Error');
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <FixedAccountFormSimple
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Data Loading', () => {
    it('should handle category loading error', async () => {
      const error = new Error('Failed to load categories');
      (categoryService.getCategoriesByType as any).mockRejectedValue(error);
      
      render(
        <FixedAccountFormSimple
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erro ao carregar categorias');
      });

      expect(screen.getByText(/nenhuma categoria encontrada/i)).toBeInTheDocument();
    });

    it('should handle supplier loading error', async () => {
      const error = new Error('Failed to load suppliers');
      (supplierService.getSuppliers as any).mockRejectedValue(error);
      
      render(
        <FixedAccountFormSimple
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erro ao carregar fornecedores');
      });

      expect(screen.getByText(/nenhum fornecedor encontrado/i)).toBeInTheDocument();
    });
  });

  describe('Form Reset', () => {
    it('should reset form after successful creation', async () => {
      const user = userEvent.setup();
      
      render(
        <FixedAccountFormSimple
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Aguardar carregamento dos dados
      await waitFor(() => {
        expect(screen.queryByText(/carregando categorias/i)).not.toBeInTheDocument();
      });

      // Preencher formulário
      const descriptionInput = screen.getByLabelText(/descrição/i);
      const amountInput = screen.getByLabelText(/valor/i);
      
      await user.type(descriptionInput, 'Aluguel');
      await user.type(amountInput, '1500');

      // Selecionar categoria
      const categorySelect = screen.getByLabelText(/categoria/i);
      await user.click(categorySelect);
      await user.click(screen.getByText('Moradia'));

      // Submeter formulário
      const submitButton = screen.getByRole('button', { name: /criar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Verificar se o formulário foi resetado
      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Descrição vazia
      expect(screen.getByDisplayValue('0')).toBeInTheDocument(); // Valor resetado
    });

    it('should not reset form after successful update', async () => {
      const user = userEvent.setup();
      
      render(
        <FixedAccountFormSimple
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Aguardar carregamento dos dados
      await waitFor(() => {
        expect(screen.queryByText(/carregando categorias/i)).not.toBeInTheDocument();
      });

      // Submeter formulário
      const submitButton = screen.getByRole('button', { name: /atualizar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Verificar se o formulário NÃO foi resetado
      expect(screen.getByDisplayValue('Aluguel')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1500')).toBeInTheDocument();
    });
  });
}); 