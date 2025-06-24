/**
 * @jest-environment jsdom
 */

/// <reference types="jest" />

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import AdminAudit from '../../../src/pages/admin/Audit';
import auditService from '../../../src/lib/auditService';

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

// Mock do auditService
jest.mock('../../../src/lib/auditService');
const mockAuditService = auditService as jest.Mocked<typeof auditService>;

// Mock global scrollIntoView para Radix UI
window.HTMLElement.prototype.scrollIntoView = function() {};

// Mock dos dados de auditoria
const mockLogs = [
  {
    id: '1',
    userId: 1,
    userName: 'João Silva',
    action: 'LOGIN',
    resource: 'Auth',
    details: 'Login realizado com sucesso',
    ipAddress: '192.168.0.10',
    timestamp: '2025-01-21T10:30:00Z',
    status: 'success' as const,
  },
  {
    id: '2',
    userId: 2,
    userName: 'Maria Santos',
    action: 'CREATE_USER',
    resource: 'User',
    details: 'Usuário criado: pedro@finance.com',
    ipAddress: '192.168.0.11',
    timestamp: '2025-01-21T11:00:00Z',
    status: 'success' as const,
  },
  {
    id: '3',
    userId: 3,
    userName: 'Pedro Costa',
    action: 'DELETE_PAYMENT',
    resource: 'Payment',
    details: 'Tentativa de exclusão de pagamento falhou: permissão insuficiente',
    ipAddress: '192.168.0.12',
    timestamp: '2025-01-21T12:15:00Z',
    status: 'error' as const,
  },
];

const mockStats = {
  totalLogs: 1250,
  logsToday: 45,
  logsThisWeek: 320,
  logsThisMonth: 1250,
  topActions: [
    { action: 'LOGIN', count: 450 },
    { action: 'CREATE_TRANSACTION', count: 200 },
    { action: 'UPDATE_ACCOUNT', count: 150 },
  ],
  topUsers: [
    { userName: 'João Silva', count: 120 },
    { userName: 'Maria Santos', count: 95 },
    { userName: 'Pedro Costa', count: 80 },
  ],
  errorRate: 2.5,
  successRate: 97.5,
};

const mockUsersWithLogs = [
  { id: 1, name: 'João Silva', email: 'joao@finance.com' },
  { id: 2, name: 'Maria Santos', email: 'maria@finance.com' },
  { id: 3, name: 'Pedro Costa', email: 'pedro@finance.com' },
];

const mockActions = ['LOGIN', 'CREATE_USER', 'DELETE_PAYMENT', 'EXPORT_REPORT', 'UPDATE_CATEGORY'];
const mockResources = ['Auth', 'User', 'Payment', 'Report', 'Category'];

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
const renderAdminAudit = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AdminAudit />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AdminAudit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mocks padrão
    mockAuditService.getLogs.mockResolvedValue({
      logs: mockLogs,
      total: mockLogs.length,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });
    mockAuditService.getStats.mockResolvedValue(mockStats);
    mockAuditService.getAvailableActions.mockResolvedValue(mockActions);
    mockAuditService.getAvailableResources.mockResolvedValue(mockResources);
    mockAuditService.getUsersWithLogs.mockResolvedValue(mockUsersWithLogs);
  });

  describe('Renderização', () => {
    it('deve renderizar a página corretamente', async () => {
      renderAdminAudit();
      
      expect(screen.getByText('Auditoria do Sistema')).toBeInTheDocument();
      expect(screen.getByText('Atualizar')).toBeInTheDocument();
      expect(screen.getByText('Exportar Relatório')).toBeInTheDocument();
    });

    it('deve mostrar loading state inicialmente', () => {
      renderAdminAudit();
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('deve carregar dados após montagem', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(mockAuditService.getLogs).toHaveBeenCalled();
        expect(mockAuditService.getStats).toHaveBeenCalled();
        expect(mockAuditService.getAvailableActions).toHaveBeenCalled();
        expect(mockAuditService.getAvailableResources).toHaveBeenCalled();
        expect(mockAuditService.getUsersWithLogs).toHaveBeenCalled();
      });
    });
  });

  describe('Estatísticas', () => {
    it('deve exibir cards de estatísticas', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('Total de Logs')).toBeInTheDocument();
        expect(screen.getByText('Logs Hoje')).toBeInTheDocument();
        expect(screen.getByText('Taxa de Sucesso')).toBeInTheDocument();
        expect(screen.getByText('Taxa de Erro')).toBeInTheDocument();
      });
    });

    it('deve exibir valores corretos nas estatísticas', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('1,250')).toBeInTheDocument(); // Total de logs
        expect(screen.getByText('45')).toBeInTheDocument(); // Logs hoje
        expect(screen.getByText('97.5%')).toBeInTheDocument(); // Taxa de sucesso
        expect(screen.getByText('2.5%')).toBeInTheDocument(); // Taxa de erro
      });
    });
  });

  describe('Listagem de Logs', () => {
    it('deve exibir lista de logs após carregamento', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
      });
    });

    it('deve exibir informações dos logs', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('LOGIN')).toBeInTheDocument();
        expect(screen.getByText('CREATE_USER')).toBeInTheDocument();
        expect(screen.getByText('DELETE_PAYMENT')).toBeInTheDocument();
        expect(screen.getByText('Auth')).toBeInTheDocument();
        expect(screen.getByText('User')).toBeInTheDocument();
        expect(screen.getByText('Payment')).toBeInTheDocument();
      });
    });

    it('deve exibir status dos logs', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('Sucesso')).toBeInTheDocument();
        expect(screen.getByText('Erro')).toBeInTheDocument();
      });
    });

    it('deve exibir endereços IP', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('192.168.0.10')).toBeInTheDocument();
        expect(screen.getByText('192.168.0.11')).toBeInTheDocument();
        expect(screen.getByText('192.168.0.12')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros', () => {
    it('deve filtrar por busca de texto', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar por usuário, ação, recurso ou detalhes...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar por usuário, ação, recurso ou detalhes...');
      fireEvent.change(searchInput, { target: { value: 'João' } });

      await waitFor(() => {
        expect(mockAuditService.getLogs).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'João' })
        );
      });
    });

    it('deve exibir filtros de usuário', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('Usuário')).toBeInTheDocument();
      });
    });

    it('deve exibir filtros de ação', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('Ação')).toBeInTheDocument();
      });
    });

    it('deve exibir filtros de status', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('deve exibir filtros de data', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('De')).toBeInTheDocument();
        expect(screen.getByText('Até')).toBeInTheDocument();
      });
    });
  });

  describe('Exportação', () => {
    it('deve exportar relatório', async () => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      mockAuditService.exportReport.mockResolvedValue(mockBlob);
      
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('Exportar Relatório')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Exportar Relatório'));

      await waitFor(() => {
        expect(mockAuditService.exportReport).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Relatório exportado com sucesso');
      });
    });

    it('deve exibir erro quando falha na exportação', async () => {
      mockAuditService.exportReport.mockRejectedValue(new Error('Erro na API'));
      
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('Exportar Relatório')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Exportar Relatório'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erro ao exportar relatório');
      });
    });
  });

  describe('Visualização de Detalhes', () => {
    it('deve abrir modal de detalhes ao clicar no ícone de olho', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Clicar no botão de visualizar detalhes do primeiro log
      const viewButtons = screen.getAllByTitle('Ver detalhes');
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Detalhes do Log de Auditoria')).toBeInTheDocument();
      });
    });

    it('deve exibir detalhes completos do log', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Abrir modal de detalhes
      const viewButtons = screen.getAllByTitle('Ver detalhes');
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Detalhes do Log de Auditoria')).toBeInTheDocument();
        expect(screen.getByText(/João Silva/)).toBeInTheDocument();
        expect(screen.getByText(/LOGIN/)).toBeInTheDocument();
        expect(screen.getByText(/Auth/)).toBeInTheDocument();
        expect(screen.getByText(/192.168.0.10/)).toBeInTheDocument();
      });
    });
  });

  describe('Paginação', () => {
    it('deve exibir paginação quando há múltiplas páginas', async () => {
      mockAuditService.getLogs.mockResolvedValue({
        logs: mockLogs,
        total: 25,
        page: 1,
        pageSize: 10,
        totalPages: 3,
      });
      
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('Página 1 de 3 (25 logs)')).toBeInTheDocument();
        expect(screen.getByText('Anterior')).toBeInTheDocument();
        expect(screen.getByText('Próxima')).toBeInTheDocument();
      });
    });

    it('deve navegar entre páginas', async () => {
      mockAuditService.getLogs.mockResolvedValue({
        logs: mockLogs,
        total: 25,
        page: 1,
        pageSize: 10,
        totalPages: 3,
      });
      
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('Próxima')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Próxima'));

      await waitFor(() => {
        expect(mockAuditService.getLogs).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });
  });

  describe('Atualização', () => {
    it('deve atualizar dados ao clicar em Atualizar', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('Atualizar')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Atualizar'));

      await waitFor(() => {
        expect(mockAuditService.getLogs).toHaveBeenCalled();
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve exibir erro quando falha ao carregar logs', async () => {
      mockAuditService.getLogs.mockRejectedValue(new Error('Erro na API'));
      
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar logs de auditoria')).toBeInTheDocument();
        expect(toast.error).toHaveBeenCalledWith('Erro ao carregar logs de auditoria');
      });
    });

    it('deve exibir erro quando falha ao carregar estatísticas', async () => {
      mockAuditService.getStats.mockRejectedValue(new Error('Erro na API'));
      
      renderAdminAudit();

      await waitFor(() => {
        // A página deve carregar mesmo sem estatísticas
        expect(screen.getByText('Auditoria do Sistema')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros Avançados', () => {
    it('deve aplicar filtro por usuário', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('Usuário')).toBeInTheDocument();
      });

      // Simular seleção de usuário
      const userSelect = screen.getByText('Usuário').closest('div')?.querySelector('button');
      if (userSelect) {
        fireEvent.click(userSelect);
      }

      await waitFor(() => {
        expect(screen.getByText('joao@finance.com')).toBeInTheDocument();
      });
    });

    it('deve aplicar filtro por ação', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('Ação')).toBeInTheDocument();
      });

      // Simular seleção de ação
      const actionSelect = screen.getByText('Ação').closest('div')?.querySelector('button');
      if (actionSelect) {
        fireEvent.click(actionSelect);
      }

      await waitFor(() => {
        expect(screen.getByText('LOGIN')).toBeInTheDocument();
      });
    });

    it('deve aplicar filtro por status', async () => {
      renderAdminAudit();

      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });

      // Simular seleção de status
      const statusSelect = screen.getByText('Status').closest('div')?.querySelector('button');
      if (statusSelect) {
        fireEvent.click(statusSelect);
      }

      await waitFor(() => {
        expect(screen.getByText('Sucesso')).toBeInTheDocument();
        expect(screen.getByText('Erro')).toBeInTheDocument();
      });
    });
  });
}); 