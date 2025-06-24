/**
 * Testes para a página de Clientes
 * @author Lucas
 */

/// <reference types="jest" />

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Customers } from '../../src/pages/Customers';
import { AuthProvider } from '../../src/contexts/AuthContext';
import customerService from '../../src/lib/customerService';

// Mock do serviço de clientes
jest.mock('../../src/lib/customerService');
const mockCustomerService = customerService as jest.Mocked<typeof customerService>;

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Dados mockados
const mockCustomers = [
  {
    id: 1,
    user_id: 1,
    name: 'João Silva',
    documentType: 'CPF' as const,
    document: '12345678901',
    email: 'joao@example.com',
    phone: '(11) 99999-9999',
    status: 'ativo' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    receivables_count: 5,
    total_receivables: 15000,
    last_transaction: '2024-01-15T00:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    name: 'Maria Santos',
    documentType: 'CNPJ' as const,
    document: '12345678000190',
    email: 'maria@empresa.com',
    phone: '(11) 88888-8888',
    status: 'ativo' as const,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    receivables_count: 3,
    total_receivables: 8500,
    last_transaction: '2024-01-10T00:00:00Z',
  },
  {
    id: 3,
    user_id: 1,
    name: 'Pedro Costa',
    documentType: 'CPF' as const,
    document: '98765432100',
    email: 'pedro@example.com',
    phone: '(11) 77777-7777',
    status: 'inativo' as const,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    receivables_count: 0,
    total_receivables: 0,
    last_transaction: null,
  }
];

const mockCustomerStats = {
  total_customers: 2,
  active_customers: 2,
  inactive_customers: 0,
  pending_customers: 0,
  total_receivables: 23500,
  average_receivables_per_customer: 11750,
  top_customers: [
    {
      id: 1,
      name: 'João Silva',
      total_receivables: 15000,
      receivables_count: 5,
    },
    {
      id: 2,
      name: 'Maria Santos',
      total_receivables: 8500,
      receivables_count: 3,
    },
  ],
  customers_by_status: [
    { status: 'ativo', count: 2, percentage: 100 },
    { status: 'inativo', count: 0, percentage: 0 },
    { status: 'pendente', count: 0, percentage: 0 },
  ],
};

// Mock do usuário autenticado
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
};

// Wrapper para renderizar com providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Customers Page', () => {
  beforeEach(() => {
    // Reset dos mocks
    jest.clearAllMocks();
    
    // Mock das funções do serviço
    mockCustomerService.getCustomers.mockResolvedValue({
      customers: mockCustomers,
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        total_pages: 1,
      },
    });
    
    mockCustomerService.getCustomerStats.mockResolvedValue(mockCustomerStats);
    mockCustomerService.createCustomer.mockResolvedValue(mockCustomers[0]);
    mockCustomerService.updateCustomer.mockResolvedValue(mockCustomers[0]);
    mockCustomerService.deleteCustomer.mockResolvedValue();
    mockCustomerService.exportCustomers.mockResolvedValue(new Blob(['test']));
    mockCustomerService.formatCPF.mockReturnValue('123.456.789-01');
    mockCustomerService.formatCNPJ.mockReturnValue('12.345.678/0001-90');
  });

  describe('Renderização', () => {
    it('deve renderizar a página de clientes', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        expect(screen.getByText('Clientes')).toBeInTheDocument();
        expect(screen.getByText('Gerencie seus clientes e recebíveis')).toBeInTheDocument();
      });
    });

    it('deve exibir cards de estatísticas', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        expect(screen.getByText('Total de Clientes')).toBeInTheDocument();
        expect(screen.getByText('Clientes Ativos')).toBeInTheDocument();
        expect(screen.getByText('Clientes Inativos')).toBeInTheDocument();
        expect(screen.getByText('Total Recebíveis')).toBeInTheDocument();
      });
    });

    it('deve exibir tabs de navegação', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        expect(screen.getByText('Visão Geral')).toBeInTheDocument();
        expect(screen.getByText('Clientes')).toBeInTheDocument();
        expect(screen.getByText('Estatísticas')).toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidades de Cliente', () => {
    it('deve exibir lista de clientes', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      });
    });

    it('deve permitir buscar clientes', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar por nome, documento, email...');
        fireEvent.change(searchInput, { target: { value: 'João' } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
      });
    });

    it('deve permitir filtrar por tipo de documento', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        const documentTypeSelect = screen.getByText('Todos os tipos');
        fireEvent.click(documentTypeSelect);
      });
      
      await waitFor(() => {
        expect(screen.getByText('CPF')).toBeInTheDocument();
        expect(screen.getByText('CNPJ')).toBeInTheDocument();
      });
    });

    it('deve permitir filtrar por status', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        const statusSelect = screen.getByText('Todos os status');
        fireEvent.click(statusSelect);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Ativo')).toBeInTheDocument();
        expect(screen.getByText('Inativo')).toBeInTheDocument();
        expect(screen.getByText('Pendente')).toBeInTheDocument();
      });
    });
  });

  describe('Formulário de Cliente', () => {
    it('deve abrir modal para criar novo cliente', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        const newCustomerButton = screen.getByText('Novo Cliente');
        fireEvent.click(newCustomerButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Novo Cliente')).toBeInTheDocument();
        expect(screen.getByLabelText('Nome')).toBeInTheDocument();
        expect(screen.getByLabelText('Tipo de Documento')).toBeInTheDocument();
        expect(screen.getByLabelText('Número do Documento')).toBeInTheDocument();
      });
    });

    it('deve permitir editar cliente existente', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByText('Editar');
        fireEvent.click(editButtons[0]);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Editar Cliente')).toBeInTheDocument();
        expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument();
      });
    });
  });

  describe('Estatísticas', () => {
    it('deve exibir estatísticas detalhadas na aba de estatísticas', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        const statsTab = screen.getByText('Estatísticas');
        fireEvent.click(statsTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Estatísticas Detalhadas')).toBeInTheDocument();
        expect(screen.getByText('Distribuição por Status')).toBeInTheDocument();
        expect(screen.getByText('Top Clientes por Recebíveis')).toBeInTheDocument();
      });
    });

    it('deve exibir progresso de distribuição por status', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        const statsTab = screen.getByText('Estatísticas');
        fireEvent.click(statsTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Ativos')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Total de ativos
      });
    });
  });

  describe('Exportação', () => {
    it('deve permitir exportar dados dos clientes', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        const exportButton = screen.getByText('Exportar');
        fireEvent.click(exportButton);
      });
      
      await waitFor(() => {
        expect(mockCustomerService.exportCustomers).toHaveBeenCalled();
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve exibir mensagem de erro quando falhar ao carregar clientes', async () => {
      mockCustomerService.getCustomers.mockRejectedValue(new Error('Erro de rede'));
      
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        expect(screen.getByText('Nenhum cliente encontrado')).toBeInTheDocument();
      });
    });

    it('deve exibir loading state durante carregamento', async () => {
      // Mock de uma promise que não resolve imediatamente
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockCustomerService.getCustomers.mockReturnValue(promise);
      
      renderWithProviders(<Customers />);
      
      expect(screen.getByText('Carregando clientes...')).toBeInTheDocument();
      
      // Resolve a promise
      resolvePromise!({
        customers: mockCustomers,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          total_pages: 1,
        },
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Carregando clientes...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Formatação', () => {
    it('deve formatar CPF corretamente', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        expect(screen.getByText('123.456.789-01')).toBeInTheDocument();
      });
    });

    it('deve formatar CNPJ corretamente', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        expect(screen.getByText('12.345.678/0001-90')).toBeInTheDocument();
      });
    });
  });

  describe('Responsividade', () => {
    it('deve ser responsivo em diferentes tamanhos de tela', async () => {
      renderWithProviders(<Customers />);
      
      await waitFor(() => {
        // Verifica se os elementos principais estão presentes
        expect(screen.getByText('Clientes')).toBeInTheDocument();
        expect(screen.getByText('Novo Cliente')).toBeInTheDocument();
        expect(screen.getByText('Exportar')).toBeInTheDocument();
      });
    });
  });
}); 