/// <reference types="jest" />

/**
 * Testes unitários para a página de Fornecedores
 * @author Lucas
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import Suppliers from '../../src/pages/Suppliers';
import supplierService from '../../src/lib/supplierService';

// Mock do serviço de fornecedores
jest.mock('../../src/lib/supplierService');

const mockSupplierService = supplierService as jest.Mocked<typeof supplierService>;

// Mock de dados de teste
const mockSuppliers = [
  {
    id: 1,
    user_id: 1,
    name: 'Fornecedor Teste 1',
    document_type: 'CNPJ' as const,
    document_number: '12345678000190',
    email: 'teste1@example.com',
    phone: '(11) 99999-9999',
    address: 'Rua Teste, 123',
    status: 'ativo' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    payables_count: 5,
    total_payables: 15000,
    last_transaction: '2024-01-15T00:00:00Z'
  }
];

// Mock do contexto de autenticação
const mockAuthContext = {
  user: {
    id: 1,
    name: 'Usuário Teste',
    email: 'teste@example.com',
    role: 'user'
  },
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: true
};

jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

// Componente wrapper para testes
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
      <Toaster />
    </BrowserRouter>
  );
};

describe('Suppliers Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock padrão do serviço
    mockSupplierService.getSuppliers.mockResolvedValue(mockSuppliers);
    mockSupplierService.createSupplier.mockResolvedValue(mockSuppliers[0]);
    mockSupplierService.updateSupplier.mockResolvedValue(mockSuppliers[0]);
    mockSupplierService.deleteSupplier.mockResolvedValue();
  });

  describe('Renderização Inicial', () => {
    it('deve renderizar a página de fornecedores corretamente', async () => {
      renderWithProviders(<Suppliers />);

      // Verificar elementos principais
      expect(screen.getByText('Fornecedores')).toBeInTheDocument();
      expect(screen.getByText('Gerencie seus fornecedores e parceiros comerciais')).toBeInTheDocument();
      expect(screen.getByText('Novo Fornecedor')).toBeInTheDocument();

      // Aguardar carregamento dos dados
      await waitFor(() => {
        expect(mockSupplierService.getSuppliers).toHaveBeenCalled();
      });
    });

    it('deve mostrar loading durante carregamento inicial', () => {
      mockSupplierService.getSuppliers.mockImplementation(() => new Promise(() => {}));
      
      renderWithProviders(<Suppliers />);
      
      expect(screen.getByText('Carregando fornecedores...')).toBeInTheDocument();
    });

    it('deve mostrar mensagem quando não há fornecedores', async () => {
      mockSupplierService.getSuppliers.mockResolvedValue([]);
      
      renderWithProviders(<Suppliers />);
      
      await waitFor(() => {
        expect(screen.getByText('Nenhum fornecedor encontrado')).toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidades de Listagem', () => {
    it('deve exibir lista de fornecedores corretamente', async () => {
      renderWithProviders(<Suppliers />);

      await waitFor(() => {
        expect(screen.getByText('Fornecedor Teste 1')).toBeInTheDocument();
        expect(screen.getByText('teste1@example.com')).toBeInTheDocument();
      });
    });

    it('deve exibir status dos fornecedores corretamente', async () => {
      renderWithProviders(<Suppliers />);

      await waitFor(() => {
        expect(screen.getByText('Ativo')).toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidades de Criação', () => {
    it('deve abrir modal de criação ao clicar em Novo Fornecedor', async () => {
      renderWithProviders(<Suppliers />);

      const createButton = screen.getByText('Novo Fornecedor');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Novo Fornecedor')).toBeInTheDocument();
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve mostrar erro ao falhar carregamento de fornecedores', async () => {
      mockSupplierService.getSuppliers.mockRejectedValue(new Error('Erro de rede'));

      renderWithProviders(<Suppliers />);

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar fornecedores')).toBeInTheDocument();
      });
    });
  });
}); 