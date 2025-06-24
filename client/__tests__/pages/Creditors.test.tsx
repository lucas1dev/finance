/// <reference types="jest" />

/**
 * Testes unitários para a página de Credores
 * @author Lucas
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Creditors from '../../src/pages/Creditors';

// Mock do contexto de autenticação
const mockAuthContext = {
  user: { id: 1, name: 'Admin User', email: 'admin@test.com', role: 'admin' },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock do serviço de credores
jest.mock('../../src/lib/creditorService', () => ({
  __esModule: true,
  default: {
    getCreditors: jest.fn(),
    createCreditor: jest.fn(),
    updateCreditor: jest.fn(),
    deleteCreditor: jest.fn(),
    getCreditor: jest.fn(),
  }
}));

// Mock do toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock do confirm
global.confirm = jest.fn(() => true);

// Dados mockados
const mockCreditors = [
  {
    id: 1,
    user_id: 1,
    name: 'Banco XYZ',
    document_type: 'CNPJ',
    document_number: '12345678000199',
    address: 'Rua das Flores, 123',
    phone: '(11) 99999-9999',
    email: 'contato@bancoxyz.com',
    status: 'ativo',
    observations: 'Banco principal',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    name: 'Financeira ABC',
    document_type: 'CPF',
    document_number: '12345678901',
    address: 'Av. Principal, 456',
    phone: '(11) 88888-8888',
    email: 'contato@financeiraabc.com',
    status: 'ativo',
    observations: '',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  }
];

// Wrapper para renderizar com contexto
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Creditors Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock das funções do serviço
    const creditorService = require('../../src/lib/creditorService').default;
    creditorService.getCreditors.mockResolvedValue(mockCreditors);
    creditorService.createCreditor.mockResolvedValue(mockCreditors[0]);
    creditorService.updateCreditor.mockResolvedValue(mockCreditors[0]);
    creditorService.deleteCreditor.mockResolvedValue();
    creditorService.getCreditor.mockResolvedValue(mockCreditors[0]);
  });

  describe('Renderização', () => {
    it('deve renderizar a página corretamente', async () => {
      renderWithRouter(<Creditors />);
      
      await waitFor(() => {
        expect(screen.getByText('Credores')).toBeInTheDocument();
        expect(screen.getByText('Gerencie seus credores e instituições financeiras')).toBeInTheDocument();
      });
    });

    it('deve exibir os cards de estatísticas simples', async () => {
      renderWithRouter(<Creditors />);
      
      await waitFor(() => {
        expect(screen.getByText('Total de Credores')).toBeInTheDocument();
        expect(screen.getByText('CPFs')).toBeInTheDocument();
        expect(screen.getByText('CNPJs')).toBeInTheDocument();
      });
    });

    it('deve exibir a aba visão geral', async () => {
      renderWithRouter(<Creditors />);
      
      await waitFor(() => {
        expect(screen.getByText('Visão Geral')).toBeInTheDocument();
      });
    });
  });

  describe('Listagem de Credores', () => {
    it('deve carregar e exibir a lista de credores', async () => {
      renderWithRouter(<Creditors />);
      
      await waitFor(() => {
        expect(screen.getByText('Banco XYZ')).toBeInTheDocument();
        expect(screen.getByText('Financeira ABC')).toBeInTheDocument();
      });
    });

    it('deve exibir informações corretas dos credores na tabela', async () => {
      renderWithRouter(<Creditors />);
      
      await waitFor(() => {
        expect(screen.getByText('Banco XYZ')).toBeInTheDocument();
        expect(screen.getByText('contato@bancoxyz.com')).toBeInTheDocument();
        expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument();
        expect(screen.getByText('Rua das Flores, 123')).toBeInTheDocument();
      });
    });

    it('deve exibir mensagem quando não há credores', async () => {
      const creditorService = require('../../src/lib/creditorService').default;
      creditorService.getCreditors.mockResolvedValue([]);
      
      renderWithRouter(<Creditors />);
      
      await waitFor(() => {
        expect(screen.getByText('Nenhum credor encontrado')).toBeInTheDocument();
        expect(screen.getByText('Comece criando seu primeiro credor')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros', () => {
    it('deve aplicar filtro de busca', async () => {
      renderWithRouter(<Creditors />);
      
      const searchInput = screen.getByPlaceholderText('Buscar por nome...');
      fireEvent.change(searchInput, { target: { value: 'Banco' } });
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('Banco');
      });
    });

    it('deve aplicar filtro por tipo de documento', async () => {
      renderWithRouter(<Creditors />);
      
      const documentTypeSelect = screen.getByText('Todos os tipos');
      fireEvent.click(documentTypeSelect);
      
      await waitFor(() => {
        expect(screen.getByText('CPF')).toBeInTheDocument();
        expect(screen.getByText('CNPJ')).toBeInTheDocument();
      });
    });
  });

  describe('Criação de Credor', () => {
    it('deve abrir modal de criação ao clicar em Novo Credor', async () => {
      renderWithRouter(<Creditors />);
      
      const newButton = screen.getByRole('button', { name: /novo credor/i });
      fireEvent.click(newButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText('Nome *')).toBeInTheDocument();
        expect(screen.getByLabelText('Tipo de Documento *')).toBeInTheDocument();
      });
    });

    it('deve criar credor com dados válidos', async () => {
      const creditorService = require('../../src/lib/creditorService').default;
      
      renderWithRouter(<Creditors />);
      
      // Abrir modal
      const newButton = screen.getByRole('button', { name: /novo credor/i });
      fireEvent.click(newButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Preencher formulário
      const nameInput = screen.getByLabelText('Nome *');
      const documentTypeSelect = screen.getByLabelText('Tipo de Documento *');
      const documentNumberInput = screen.getByLabelText('Número do Documento *');
      const addressInput = screen.getByLabelText('Endereço *');
      const emailInput = screen.getByLabelText('Email *');
      
      fireEvent.change(nameInput, { target: { value: 'Novo Banco' } });
      fireEvent.change(documentTypeSelect, { target: { value: 'CNPJ' } });
      fireEvent.change(documentNumberInput, { target: { value: '12345678000199' } });
      fireEvent.change(addressInput, { target: { value: 'Rua Nova, 123' } });
      fireEvent.change(emailInput, { target: { value: 'novo@banco.com' } });
      
      // Salvar
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(creditorService.createCreditor).toHaveBeenCalledWith({
          name: 'Novo Banco',
          document_type: 'CNPJ',
          document_number: '12345678000199',
          address: 'Rua Nova, 123',
          email: 'novo@banco.com',
          phone: '',
          observations: '',
        });
      });
    });
  });

  describe('Edição de Credor', () => {
    it('deve abrir modal de edição ao clicar no botão editar', async () => {
      renderWithRouter(<Creditors />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByTestId('edit-button');
        fireEvent.click(editButtons[0]);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('deve atualizar credor com dados válidos', async () => {
      const creditorService = require('../../src/lib/creditorService').default;
      
      renderWithRouter(<Creditors />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByTestId('edit-button');
        fireEvent.click(editButtons[0]);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Modificar dados
      const nameInput = screen.getByLabelText('Nome *');
      fireEvent.change(nameInput, { target: { value: 'Banco Atualizado' } });
      
      // Submeter formulário
      const submitButton = screen.getByRole('button', { name: /atualizar/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(creditorService.updateCreditor).toHaveBeenCalled();
      });
    });
  });

  describe('Exclusão de Credor', () => {
    it('deve excluir credor após confirmação', async () => {
      const creditorService = require('../../src/lib/creditorService').default;
      
      renderWithRouter(<Creditors />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('delete-button');
        fireEvent.click(deleteButtons[0]);
      });
      
      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalled();
        expect(creditorService.deleteCreditor).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Validações', () => {
    it('deve validar CPF/CNPJ antes de salvar', async () => {
      const creditorService = require('../../src/lib/creditorService').default;
      
      renderWithRouter(<Creditors />);
      
      // Abrir modal
      const newButton = screen.getByRole('button', { name: /novo credor/i });
      fireEvent.click(newButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Preencher com CNPJ inválido
      const nameInput = screen.getByLabelText('Nome *');
      const documentTypeSelect = screen.getByLabelText('Tipo de Documento *');
      const documentNumberInput = screen.getByLabelText('Número do Documento *');
      const addressInput = screen.getByLabelText('Endereço *');
      
      fireEvent.change(nameInput, { target: { value: 'Banco Teste' } });
      fireEvent.change(documentTypeSelect, { target: { value: 'CNPJ' } });
      fireEvent.change(documentNumberInput, { target: { value: '12345678000199' } });
      fireEvent.change(addressInput, { target: { value: 'Rua Teste, 123' } });
      
      // Tentar salvar sem preencher campos obrigatórios
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(saveButton);
      
      // Verificar se a validação está funcionando
      await waitFor(() => {
        expect(screen.getByText('Nome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve exibir erro quando falha ao carregar credores', async () => {
      const creditorService = require('../../src/lib/creditorService').default;
      creditorService.getCreditors.mockRejectedValue(new Error('Erro de rede'));
      
      renderWithRouter(<Creditors />);
      
      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar credores. Tente novamente.')).toBeInTheDocument();
      });
    });

    it('deve exibir loading state durante carregamento', async () => {
      const creditorService = require('../../src/lib/creditorService').default;
      creditorService.getCreditors.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithRouter(<Creditors />);
      
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });
  });

  describe('Responsividade', () => {
    it('deve ser responsivo em diferentes tamanhos de tela', async () => {
      renderWithRouter(<Creditors />);
      
      await waitFor(() => {
        expect(screen.getByText('Credores')).toBeInTheDocument();
        expect(screen.getByText('Novo Credor')).toBeInTheDocument();
      });
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels apropriados para inputs', async () => {
      renderWithRouter(<Creditors />);
      
      // Abrir modal
      const newButton = screen.getByRole('button', { name: /novo credor/i });
      fireEvent.click(newButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Nome *')).toBeInTheDocument();
        expect(screen.getByLabelText('Tipo de Documento *')).toBeInTheDocument();
        expect(screen.getByLabelText('Número do Documento *')).toBeInTheDocument();
        expect(screen.getByLabelText('Email *')).toBeInTheDocument();
      });
    });

    it('deve ter botões com texto descritivo', async () => {
      renderWithRouter(<Creditors />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /novo credor/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /atualizar/i })).toBeInTheDocument();
      });
    });
  });
}); 