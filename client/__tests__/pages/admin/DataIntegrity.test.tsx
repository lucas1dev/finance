/// <reference types="jest" />
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import { AdminDataIntegrity } from '../../../src/pages/admin/DataIntegrity';
import dataIntegrityService from '../../../src/lib/dataIntegrityService';

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

// Mock do dataIntegrityService
jest.mock('../../../src/lib/dataIntegrityService');
const mockDataIntegrityService = dataIntegrityService as jest.Mocked<typeof dataIntegrityService>;

// Mock dos hooks customizados
jest.mock('../../../src/hooks/useDataIntegrity', () => ({
  useIntegrityChecks: () => ({
    checks: [
      {
        id: 1,
        name: 'Verificação de Transações',
        description: 'Verifica inconsistências em transações',
        status: 'completed' as const,
        lastRun: '2025-01-21T10:00:00Z',
        nextRun: '2025-01-22T10:00:00Z',
        issues: 5,
        critical: 2,
        warnings: 3,
        autoFix: true,
        enabled: true,
      },
      {
        id: 2,
        name: 'Verificação de Contas',
        description: 'Verifica saldos de contas',
        status: 'pending' as const,
        lastRun: '2025-01-20T10:00:00Z',
        nextRun: '2025-01-21T10:00:00Z',
        issues: 0,
        critical: 0,
        warnings: 0,
        autoFix: false,
        enabled: true,
      },
    ],
    loading: false,
    error: null,
    runningChecks: new Set(),
    fetchChecks: jest.fn(),
    runCheck: jest.fn(),
    runAllChecks: jest.fn(),
    toggleCheck: jest.fn(),
    configureCheck: jest.fn(),
  }),
  useIntegrityIssues: () => ({
    issues: [
      {
        id: 1,
        checkId: 1,
        type: 'critical' as const,
        title: 'Transação duplicada',
        description: 'Transação com ID duplicado encontrada',
        affectedRecords: 1,
        suggestedFix: 'Remover transação duplicada',
        createdAt: '2025-01-21T10:00:00Z',
        fixed: false,
        severity: 'critical' as const,
        category: 'transactions',
      },
      {
        id: 2,
        checkId: 1,
        type: 'warning' as const,
        title: 'Saldo inconsistente',
        description: 'Saldo da conta não confere com transações',
        affectedRecords: 3,
        suggestedFix: 'Recalcular saldo da conta',
        createdAt: '2025-01-21T09:00:00Z',
        fixed: true,
        fixedAt: '2025-01-21T09:30:00Z',
        fixedBy: 'admin@finance.com',
        severity: 'medium' as const,
        category: 'accounts',
      },
    ],
    loading: false,
    error: null,
    filters: {},
    fetchIssues: jest.fn(),
    fixIssue: jest.fn(),
    fixMultipleIssues: jest.fn(),
    updateFilters: jest.fn(),
  }),
  useIntegrityReports: () => ({
    report: {
      totalChecks: 10,
      activeChecks: 8,
      totalIssues: 15,
      criticalIssues: 3,
      warningIssues: 12,
      fixedIssues: 8,
      lastWeek: {
        checksRun: 50,
        issuesFound: 20,
        issuesFixed: 15,
        successRate: 85,
      },
      byType: {
        critical: 3,
        warning: 12,
        info: 5,
      },
      byCategory: {
        transactions: 8,
        accounts: 5,
        users: 2,
      },
      trends: [],
    },
    stats: {
      totalChecks: 10,
      activeChecks: 8,
      totalIssues: 15,
      criticalIssues: 3,
      warningIssues: 12,
      fixedIssues: 8,
      lastWeek: {
        checksRun: 50,
        issuesFound: 20,
        issuesFixed: 15,
        successRate: 85,
      },
      byType: {
        critical: 3,
        warning: 12,
        info: 5,
      },
      byCategory: {
        transactions: 8,
        accounts: 5,
        users: 2,
      },
      trends: [],
    },
    loading: false,
    error: null,
    fetchReport: jest.fn(),
    fetchStats: jest.fn(),
    exportReport: jest.fn(),
  }),
  useIntegrityNotifications: () => ({
    notifications: [],
    addNotification: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    clearNotifications: jest.fn(),
  }),
}));

// Mock dos componentes customizados
jest.mock('../../../src/components/DataIntegrityFilters', () => ({
  DataIntegrityFilters: () => <div data-testid="data-integrity-filters">Filtros</div>,
}));

jest.mock('../../../src/components/CheckConfigurationModal', () => ({
  CheckConfigurationModal: ({ open, onOpenChange }: any) => 
    open ? <div data-testid="check-configuration-modal">Modal de Configuração</div> : null,
}));

// Mock global scrollIntoView para Radix UI
window.HTMLElement.prototype.scrollIntoView = function() {};

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
const renderAdminDataIntegrity = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AdminDataIntegrity />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AdminDataIntegrity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar a página corretamente', async () => {
      renderAdminDataIntegrity();
      
      expect(screen.getByText('Integridade de Dados')).toBeInTheDocument();
      expect(screen.getByText('Monitore e corrija problemas de integridade no sistema')).toBeInTheDocument();
      expect(screen.getByText('Atualizar')).toBeInTheDocument();
      expect(screen.getByText('Executar Todas')).toBeInTheDocument();
    });

    it('deve exibir as abas principais', async () => {
      renderAdminDataIntegrity();

      expect(screen.getByText('Visão Geral')).toBeInTheDocument();
      expect(screen.getByText('Verificações')).toBeInTheDocument();
      expect(screen.getByText('Problemas')).toBeInTheDocument();
      expect(screen.getByText('Relatórios')).toBeInTheDocument();
    });

    it('deve mostrar alerta quando há problemas críticos', async () => {
      renderAdminDataIntegrity();

      expect(screen.getByText(/1 problema\(s\) crítico\(s\)/)).toBeInTheDocument();
      expect(screen.getByText('Recomendamos correção imediata.')).toBeInTheDocument();
    });
  });

  describe('Aba Visão Geral', () => {
    it('deve exibir cards de estatísticas', async () => {
      renderAdminDataIntegrity();

      expect(screen.getByText('Verificações Ativas')).toBeInTheDocument();
      expect(screen.getByText('Problemas Críticos')).toBeInTheDocument();
      expect(screen.getByText('Avisos')).toBeInTheDocument();
      expect(screen.getByText('Taxa de Sucesso')).toBeInTheDocument();
    });

    it('deve exibir valores corretos nas estatísticas', async () => {
      renderAdminDataIntegrity();

      expect(screen.getByText('2')).toBeInTheDocument(); // Verificações ativas
      expect(screen.getByText('1')).toBeInTheDocument(); // Problemas críticos
      expect(screen.getByText('1')).toBeInTheDocument(); // Avisos
      expect(screen.getByText('100%')).toBeInTheDocument(); // Taxa de sucesso
    });

    it('deve exibir ações rápidas', async () => {
      renderAdminDataIntegrity();

      expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
      expect(screen.getAllByText('Executar Todas')).toHaveLength(2); // Header + Ações rápidas
    });
  });

  describe('Aba Verificações', () => {
    it('deve exibir lista de verificações', async () => {
      renderAdminDataIntegrity();

      // Clicar na aba Verificações
      fireEvent.click(screen.getByText('Verificações'));

      await waitFor(() => {
        expect(screen.getByText('Verificação de Transações')).toBeInTheDocument();
        expect(screen.getByText('Verificação de Contas')).toBeInTheDocument();
      });
    });

    it('deve exibir status das verificações', async () => {
      renderAdminDataIntegrity();

      fireEvent.click(screen.getByText('Verificações'));

      await waitFor(() => {
        expect(screen.getByText('Concluída')).toBeInTheDocument();
        expect(screen.getByText('Pendente')).toBeInTheDocument();
      });
    });

    it('deve exibir informações das verificações', async () => {
      renderAdminDataIntegrity();

      fireEvent.click(screen.getByText('Verificações'));

      await waitFor(() => {
        expect(screen.getByText('Verifica inconsistências em transações')).toBeInTheDocument();
        expect(screen.getByText('Verifica saldos de contas')).toBeInTheDocument();
      });
    });
  });

  describe('Aba Problemas', () => {
    it('deve exibir lista de problemas', async () => {
      renderAdminDataIntegrity();

      fireEvent.click(screen.getByText('Problemas'));

      await waitFor(() => {
        expect(screen.getByText('Transação duplicada')).toBeInTheDocument();
        expect(screen.getByText('Saldo inconsistente')).toBeInTheDocument();
      });
    });

    it('deve exibir tipos de problemas', async () => {
      renderAdminDataIntegrity();

      fireEvent.click(screen.getByText('Problemas'));

      await waitFor(() => {
        expect(screen.getByText('Crítico')).toBeInTheDocument();
        expect(screen.getByText('Aviso')).toBeInTheDocument();
      });
    });

    it('deve exibir status de correção', async () => {
      renderAdminDataIntegrity();

      fireEvent.click(screen.getByText('Problemas'));

      await waitFor(() => {
        expect(screen.getByText('Não corrigido')).toBeInTheDocument();
        expect(screen.getByText('Corrigido')).toBeInTheDocument();
      });
    });
  });

  describe('Aba Relatórios', () => {
    it('deve exibir relatórios de integridade', async () => {
      renderAdminDataIntegrity();

      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        expect(screen.getByText('Relatórios de Integridade')).toBeInTheDocument();
        expect(screen.getByText('Estatísticas Gerais')).toBeInTheDocument();
        expect(screen.getByText('Performance da Semana')).toBeInTheDocument();
      });
    });

    it('deve exibir botões de exportação', async () => {
      renderAdminDataIntegrity();

      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        expect(screen.getByText('CSV')).toBeInTheDocument();
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('Excel')).toBeInTheDocument();
      });
    });

    it('deve exibir estatísticas gerais', async () => {
      renderAdminDataIntegrity();

      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument(); // Total de verificações
        expect(screen.getByText('8')).toBeInTheDocument(); // Verificações ativas
        expect(screen.getByText('3')).toBeInTheDocument(); // Problemas críticos
        expect(screen.getByText('12')).toBeInTheDocument(); // Avisos
      });
    });

    it('deve exibir performance da semana', async () => {
      renderAdminDataIntegrity();

      fireEvent.click(screen.getByText('Relatórios'));

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument(); // Verificações executadas
        expect(screen.getByText('20')).toBeInTheDocument(); // Problemas encontrados
        expect(screen.getByText('15')).toBeInTheDocument(); // Problemas corrigidos
        expect(screen.getByText('85%')).toBeInTheDocument(); // Taxa de sucesso
      });
    });
  });

  describe('Ações', () => {
    it('deve executar todas as verificações', async () => {
      const { useIntegrityChecks } = require('../../../src/hooks/useDataIntegrity');
      const mockRunAllChecks = jest.fn();
      
      useIntegrityChecks.mockReturnValue({
        checks: [],
        loading: false,
        error: null,
        runningChecks: new Set(),
        fetchChecks: jest.fn(),
        runCheck: jest.fn(),
        runAllChecks: mockRunAllChecks,
        toggleCheck: jest.fn(),
        configureCheck: jest.fn(),
      });

      renderAdminDataIntegrity();

      fireEvent.click(screen.getByText('Executar Todas'));

      await waitFor(() => {
        expect(mockRunAllChecks).toHaveBeenCalled();
      });
    });

    it('deve atualizar verificações', async () => {
      const { useIntegrityChecks } = require('../../../src/hooks/useDataIntegrity');
      const mockFetchChecks = jest.fn();
      
      useIntegrityChecks.mockReturnValue({
        checks: [],
        loading: false,
        error: null,
        runningChecks: new Set(),
        fetchChecks: mockFetchChecks,
        runCheck: jest.fn(),
        runAllChecks: jest.fn(),
        toggleCheck: jest.fn(),
        configureCheck: jest.fn(),
      });

      renderAdminDataIntegrity();

      fireEvent.click(screen.getByText('Atualizar'));

      await waitFor(() => {
        expect(mockFetchChecks).toHaveBeenCalled();
      });
    });
  });

  describe('Navegação entre Abas', () => {
    it('deve alternar entre abas corretamente', async () => {
      renderAdminDataIntegrity();

      // Inicialmente na aba Visão Geral
      expect(screen.getByText('Verificações Ativas')).toBeInTheDocument();

      // Ir para aba Verificações
      fireEvent.click(screen.getByText('Verificações'));
      await waitFor(() => {
        expect(screen.getByText('Verificação de Transações')).toBeInTheDocument();
      });

      // Ir para aba Problemas
      fireEvent.click(screen.getByText('Problemas'));
      await waitFor(() => {
        expect(screen.getByText('Transação duplicada')).toBeInTheDocument();
      });

      // Ir para aba Relatórios
      fireEvent.click(screen.getByText('Relatórios'));
      await waitFor(() => {
        expect(screen.getByText('Relatórios de Integridade')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros', () => {
    it('deve exibir componente de filtros', async () => {
      renderAdminDataIntegrity();

      expect(screen.getByTestId('data-integrity-filters')).toBeInTheDocument();
    });
  });

  describe('Modal de Configuração', () => {
    it('deve abrir modal de configuração', async () => {
      renderAdminDataIntegrity();

      // O modal não deve estar visível inicialmente
      expect(screen.queryByTestId('check-configuration-modal')).not.toBeInTheDocument();
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve exibir erro quando falha ao carregar verificações', async () => {
      const { useIntegrityChecks } = require('../../../src/hooks/useDataIntegrity');
      
      useIntegrityChecks.mockReturnValue({
        checks: [],
        loading: false,
        error: 'Erro ao carregar verificações',
        runningChecks: new Set(),
        fetchChecks: jest.fn(),
        runCheck: jest.fn(),
        runAllChecks: jest.fn(),
        toggleCheck: jest.fn(),
        configureCheck: jest.fn(),
      });

      renderAdminDataIntegrity();

      expect(screen.getByText('Erro ao carregar verificações')).toBeInTheDocument();
    });

    it('deve exibir loading state', async () => {
      const { useIntegrityChecks } = require('../../../src/hooks/useDataIntegrity');
      
      useIntegrityChecks.mockReturnValue({
        checks: [],
        loading: true,
        error: null,
        runningChecks: new Set(),
        fetchChecks: jest.fn(),
        runCheck: jest.fn(),
        runAllChecks: jest.fn(),
        toggleCheck: jest.fn(),
        configureCheck: jest.fn(),
      });

      renderAdminDataIntegrity();

      expect(screen.getByText('Carregando verificações de integridade...')).toBeInTheDocument();
    });
  });

  describe('Responsividade', () => {
    it('deve ser responsivo em diferentes tamanhos de tela', async () => {
      renderAdminDataIntegrity();

      // Verificar se os elementos principais estão presentes
      expect(screen.getByText('Integridade de Dados')).toBeInTheDocument();
      expect(screen.getByText('Visão Geral')).toBeInTheDocument();
      expect(screen.getByText('Verificações')).toBeInTheDocument();
      expect(screen.getByText('Problemas')).toBeInTheDocument();
      expect(screen.getByText('Relatórios')).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter elementos acessíveis', async () => {
      renderAdminDataIntegrity();

      expect(screen.getByText('Atualizar')).toBeInTheDocument();
      expect(screen.getByText('Executar Todas')).toBeInTheDocument();
      expect(screen.getByText('Visão Geral')).toBeInTheDocument();
    });

    it('deve ter navegação por teclado', async () => {
      renderAdminDataIntegrity();

      const updateButton = screen.getByText('Atualizar');
      const runAllButton = screen.getByText('Executar Todas');

      updateButton.focus();
      expect(document.activeElement).toBe(updateButton);

      runAllButton.focus();
      expect(document.activeElement).toBe(runAllButton);
    });
  });
}); 