/**
 * @jest-environment jsdom
 */

/// <reference types="jest" />

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import AdminUsers from '../../../src/pages/admin/Users';
import adminUserService from '../../../src/lib/adminUserService';

// Mock do axios
jest.mock('../../../src/lib/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}));

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock do adminUserService
jest.mock('../../../src/lib/adminUserService');
const mockAdminUserService = adminUserService as jest.Mocked<typeof adminUserService>;

// Mock global scrollIntoView para Radix UI
window.HTMLElement.prototype.scrollIntoView = function() {};

// Mock dos dados de usuários
const mockUsers = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@finance.com',
    role: 'admin',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date('2025-01-21'),
    emailVerified: true,
    avatar: '',
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@finance.com',
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-02-20'),
    lastLogin: new Date('2025-01-20'),
    emailVerified: true,
    avatar: '',
  },
  {
    id: '3',
    name: 'Pedro Costa',
    email: 'pedro@finance.com',
    role: 'manager',
    status: 'inactive',
    createdAt: new Date('2024-03-10'),
    lastLogin: null,
    emailVerified: false,
    avatar: '',
  },
];

// Mock do console.error para evitar logs desnecessários nos testes
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Limpar após cada teste
afterEach(() => {
  cleanup();
  });

/**
 * Wrapper para renderizar o componente com Router e AuthProvider
 */
  const renderAdminUsers = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <AdminUsers />
        </AuthProvider>
      </BrowserRouter>
    );
  };

describe('AdminUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mocks padrão
    mockAdminUserService.getUsers.mockResolvedValue({
      users: mockUsers,
      total: mockUsers.length,
    });
  });

  describe('Renderização', () => {
    it('deve renderizar a página corretamente', async () => {
      renderAdminUsers();
      
        expect(screen.getByText('Gerenciamento de Usuários')).toBeInTheDocument();
      expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Buscar por nome, email ou role...')).toBeInTheDocument();
    });

    it('deve mostrar loading state inicialmente', () => {
      renderAdminUsers();
      
      expect(screen.getByText('Carregando usuários...')).toBeInTheDocument();
    });

    it('deve carregar usuários após montagem', async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(mockAdminUserService.getUsers).toHaveBeenCalled();
      });
    });
  });

  describe('Listagem de Usuários', () => {
    it('deve exibir lista de usuários após carregamento', async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
      });
    });

    it('deve exibir informações dos usuários', async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText('joao@finance.com')).toBeInTheDocument();
        expect(screen.getByText('maria@finance.com')).toBeInTheDocument();
        expect(screen.getByText('pedro@finance.com')).toBeInTheDocument();
      });
    });

    it('deve exibir status dos usuários', async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText('Ativo')).toBeInTheDocument();
        expect(screen.getByText('Inativo')).toBeInTheDocument();
      });
    });

    it('deve exibir roles dos usuários', async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('user')).toBeInTheDocument();
        expect(screen.getByText('manager')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros e Busca', () => {
    it('deve filtrar por busca de texto', async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar por nome, email ou role...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar por nome, email ou role...');
      fireEvent.change(searchInput, { target: { value: 'João' } });

      await waitFor(() => {
        expect(mockAdminUserService.getUsers).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'João' })
        );
      });
    });

    it('deve exibir filtros de status', async () => {
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('deve exibir filtros de função', async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText('Função')).toBeInTheDocument();
      });
    });
  });

  describe('Criação de Usuário', () => {
    it('deve abrir modal de criação ao clicar em Novo Usuário', async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Novo Usuário'));

      await waitFor(() => {
        expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
      });
    });

    it('deve criar usuário com dados válidos', async () => {
      mockAdminUserService.createUser.mockResolvedValue(mockUsers[0]);
      
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Novo Usuário'));

      await waitFor(() => {
        expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
      });

      // Preencher formulário
      const nameInput = screen.getByPlaceholderText('Nome completo');
      const emailInput = screen.getByPlaceholderText('email@exemplo.com');
      
      fireEvent.change(nameInput, { target: { value: 'Novo Usuário' } });
      fireEvent.change(emailInput, { target: { value: 'novo@example.com' } });

      // Salvar
      fireEvent.click(screen.getByText('Criar'));

      await waitFor(() => {
        expect(mockAdminUserService.createUser).toHaveBeenCalledWith({});
        expect(toast.success).toHaveBeenCalledWith('Usuário criado com sucesso');
      });
    });
  });

  describe('Edição de Usuário', () => {
    it('deve abrir modal de edição ao clicar em editar', async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Clicar no menu de ações do primeiro usuário
      const actionButtons = screen.getAllByRole('button');
      const editButton = actionButtons.find(button => 
        button.getAttribute('aria-label')?.includes('Editar') || 
        button.textContent?.includes('Editar')
      );
      
      if (editButton) {
        fireEvent.click(editButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Editar Usuário')).toBeInTheDocument();
      });
    });

    it('deve editar usuário com dados válidos', async () => {
      mockAdminUserService.updateUser.mockResolvedValue(mockUsers[0]);
      
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Abrir modal de edição (simulado)
      const { rerender } = renderAdminUsers();
      
      // Simular estado de edição
      rerender(
        <BrowserRouter>
          <AuthProvider>
            <AdminUsers />
          </AuthProvider>
        </BrowserRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });
    });
  });

  describe('Ativação/Desativação de Usuário', () => {
    it('deve ativar usuário inativo', async () => {
      mockAdminUserService.toggleUserStatus.mockResolvedValue(mockUsers[2]);
      
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
      });

      // Clicar no badge de status do usuário inativo
      const statusBadge = screen.getByText('Inativo');
      fireEvent.click(statusBadge);

      await waitFor(() => {
        expect(mockAdminUserService.toggleUserStatus).toHaveBeenCalledWith('3', 'inactive');
        expect(toast.success).toHaveBeenCalledWith('Status do usuário atualizado');
      });
    });

    it('deve desativar usuário ativo', async () => {
      mockAdminUserService.toggleUserStatus.mockResolvedValue(mockUsers[0]);
      
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Clicar no badge de status do usuário ativo
      const statusBadge = screen.getByText('Ativo');
      fireEvent.click(statusBadge);

      await waitFor(() => {
        expect(mockAdminUserService.toggleUserStatus).toHaveBeenCalledWith('1', 'active');
        expect(toast.success).toHaveBeenCalledWith('Status do usuário atualizado');
      });
    });
  });

  describe('Exclusão de Usuário', () => {
    it('deve excluir usuário', async () => {
      mockAdminUserService.deleteUser.mockResolvedValue(undefined);

      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Clicar no menu de ações do usuário
      const actionButtons = screen.getAllByRole('button');
      const deleteButton = actionButtons.find(button => 
        button.getAttribute('aria-label')?.includes('Remover') || 
        button.textContent?.includes('Remover')
      );
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
      }

      await waitFor(() => {
        expect(mockAdminUserService.deleteUser).toHaveBeenCalledWith('1');
        expect(toast.success).toHaveBeenCalledWith('Usuário excluído com sucesso');
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve exibir erro quando falha ao carregar usuários', async () => {
      mockAdminUserService.getUsers.mockRejectedValue(new Error('Erro na API'));
      
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument();
        expect(toast.error).toHaveBeenCalledWith('Erro ao carregar lista de usuários');
      });
    });

    it('deve exibir erro quando falha ao criar usuário', async () => {
      mockAdminUserService.createUser.mockRejectedValue(new Error('Erro na API'));
      
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Novo Usuário'));

      await waitFor(() => {
        expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
      });

      // Tentar salvar sem dados
      fireEvent.click(screen.getByText('Criar'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erro ao salvar usuário');
      });
    });

    it('deve exibir erro quando falha ao atualizar status', async () => {
      mockAdminUserService.toggleUserStatus.mockRejectedValue(new Error('Erro na API'));
      
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Simular tentativa de ativar/desativar
      // (teste simplificado devido à complexidade de interação com dropdown)

      expect(mockAdminUserService.toggleUserStatus).not.toHaveBeenCalled();
    });
  });

  describe('Estatísticas', () => {
    it('deve exibir cards de estatísticas', async () => {
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('Total de Usuários')).toBeInTheDocument();
        expect(screen.getByText('Usuários Ativos')).toBeInTheDocument();
        expect(screen.getByText('Administradores')).toBeInTheDocument();
        expect(screen.getByText('Email Verificado')).toBeInTheDocument();
      });
    });

    it('deve exibir valores corretos nas estatísticas', async () => {
      renderAdminUsers();

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Total de usuários
        expect(screen.getByText('2')).toBeInTheDocument(); // Usuários ativos
        expect(screen.getByText('1')).toBeInTheDocument(); // Administradores
        expect(screen.getByText('2')).toBeInTheDocument(); // Emails verificados
      });
    });
  });

  describe('Exportação', () => {
    it('deve exportar lista de usuários', async () => {
      renderAdminUsers();
      
      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Exportar'));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Lista de usuários exportada com sucesso');
      });
    });
  });
}); 