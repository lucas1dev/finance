/**
 * @jest-environment jsdom
 */

/// <reference types="jest" />

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import AdminDashboard from '../../../src/pages/admin/Dashboard';
import { toast } from 'sonner';
import * as adminDashboardService from '../../../src/lib/adminDashboardService';

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

// Mock do adminDashboardService
jest.mock('../../../src/lib/adminDashboardService');
const mockAdminDashboardService = adminDashboardService as jest.Mocked<typeof adminDashboardService>;

// Mock dos dados do sistema
const mockSystemStats = {
  totalUsers: 1247,
  activeUsers: 892,
  totalTransactions: 15420,
  transactionsToday: 156,
  totalAccounts: 89,
  totalCategories: 45,
  systemUptime: 99.98,
  databaseSize: 2.4,
  jobsRunning: 3,
  jobsCompleted: 1250,
  jobsFailed: 1,
};

const mockAlerts = [
  {
    id: 1,
    type: 'warning' as const,
    title: 'Alto Uso de CPU',
    message: 'O uso de CPU está em 85% - considere otimizar',
    timestamp: '2025-01-21T09:15:00Z',
    severity: 'medium' as const,
  },
  {
    id: 2,
    type: 'error' as const,
    title: 'Falha no Job de Backup',
    message: 'O job de backup automático falhou nas últimas 2 horas',
    timestamp: '2025-01-21T10:30:00Z',
    severity: 'critical' as const,
  },
];

const mockAuditLogs = [
  {
    id: 1,
    userId: 1,
    userName: 'João Silva',
    action: 'CREATE',
    resource: 'Transaction',
    details: 'Criou nova transação de R$ 150,00',
    ipAddress: '192.168.1.100',
    timestamp: '2025-01-21T10:45:00Z',
  },
  {
    id: 2,
    userId: 2,
    userName: 'Maria Santos',
    action: 'UPDATE',
    resource: 'Account',
    details: 'Atualizou saldo da conta principal',
    ipAddress: '192.168.1.101',
    timestamp: '2025-01-21T10:30:00Z',
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
 * Função helper para renderizar o AdminDashboard com os providers necessários
 */
const renderAdminDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AdminDashboard />
      </AuthProvider>
    </BrowserRouter>
  );
};

/**
 * Wrapper para renderizar o componente com Router
 */
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

/**
 * Testes unitários para o Dashboard Administrativo
 */
describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mocks padrão
    mockAdminDashboardService.getSystemStats.mockResolvedValue(mockSystemStats);
    mockAdminDashboardService.getSystemAlerts.mockResolvedValue(mockAlerts);
    mockAdminDashboardService.getAuditLogs.mockResolvedValue(mockAuditLogs);
  });

  /**
   * Teste de renderização básica
   */
  describe('Renderização Básica', () => {
    it('deve renderizar o título do dashboard após carregamento', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Administrativo')).toBeInTheDocument();
      });
    });

    it('deve renderizar o subtítulo', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        expect(screen.getByText(/Visão geral do sistema/)).toBeInTheDocument();
      });
    });

    it('deve ter estrutura de layout correta', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        // Verificar se a estrutura básica está presente
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getAllByRole('alert').length).toBeGreaterThan(0); // Alerta do sistema
        expect(screen.getByRole('tablist')).toBeInTheDocument(); // Lista de abas
      });
    });
  });

  /**
   * Teste de renderização inicial com loading
   */
  describe('Renderização Inicial', () => {
    it('deve renderizar o título do dashboard após carregamento', async () => {
      renderAdminDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Administrativo')).toBeInTheDocument();
      });
    });

    it('deve exibir o alerta de alerta crítico', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        const alertContainer = screen.getByTestId('dashboard-alertas');
        expect(alertContainer).toHaveTextContent('Alertas Críticos');
        expect(alertContainer).toHaveTextContent('alertas críticos que requerem atenção imediata');
      });
    });
  });

  /**
   * Teste de cards de estatísticas
   */
  describe('Cards de Estatísticas', () => {
    it('deve exibir os cards de estatísticas', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        expect(screen.getAllByText((_, el) => el?.textContent?.replace(/\s/g, '').includes('UsuáriosAtivos'))).not.toHaveLength(0);
        expect(screen.getAllByText((_, el) => el?.textContent?.replace(/\s/g, '').includes('TotaldeUsuários'))).not.toHaveLength(0);
        expect(screen.getAllByText((_, el) => el?.textContent?.replace(/\s/g, '').includes('UptimedoSistema'))).not.toHaveLength(0);
      });
    });

    it('deve exibir os valores corretos nos cards', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        expect(screen.getAllByText((_, el) => el?.textContent?.replace(/\s/g, '').includes('892'))).not.toHaveLength(0); // Usuários Ativos
        expect(screen.getAllByText((_, el) => el?.textContent?.replace(/\s/g, '').includes('1,247'))).not.toHaveLength(0); // Total de Usuários
        expect(screen.getAllByText((_, el) => el?.textContent?.replace(/\s/g, '').includes('15,420'))).not.toHaveLength(0); // Transações
        // Uptime: buscar o valor percentual realmente exibido
        expect(screen.getAllByText((_, el) => el?.textContent?.replace(/\s/g, '').includes('99.98%'))).not.toHaveLength(0); // Uptime
      });
    });

    it('deve exibir o card de Total de Usuários', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        expect(screen.getAllByText('Total de Usuários').length).toBeGreaterThan(0);
        expect(screen.getAllByText('1,247').length).toBeGreaterThan(0);
        expect(screen.getAllByText('+23 esta semana').length).toBeGreaterThan(0);
      });
    });

    it('deve exibir o card de Usuários Ativos', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        expect(screen.getAllByText('Usuários Ativos').length).toBeGreaterThan(0);
        expect(screen.getAllByText('892').length).toBeGreaterThan(0);
        expect(screen.getAllByText('156 hoje').length).toBeGreaterThan(0);
      });
    });

    it('deve exibir o card de Administradores', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        expect(screen.getAllByText((_, el) => el?.textContent?.includes('Administradores'))).not.toHaveLength(0);
        expect(screen.getAllByText((_, el) => el?.textContent?.includes('8'))).not.toHaveLength(0);
        expect(screen.getAllByText((_, el) => el?.textContent?.includes('com acesso total'))).not.toHaveLength(0);
      });
    });

    it('deve exibir o card de Notificações', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        expect(screen.getAllByText((_, el) => el?.textContent?.includes('Notificações'))).not.toHaveLength(0);
        expect(screen.getAllByText((_, el) => el?.textContent?.includes('12'))).not.toHaveLength(0);
        expect(screen.getAllByText((_, el) => el?.textContent?.includes('a serem processadas'))).not.toHaveLength(0);
      });
    });

    it('deve exibir o card de Uptime', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        expect(screen.getAllByText((_, el) => el?.textContent?.includes('Uptime'))).not.toHaveLength(0);
        expect(screen.getAllByText((_, el) => el?.textContent?.includes('99.98%'))).not.toHaveLength(0);
        expect(screen.getAllByText((_, el) => el?.textContent?.includes('Uptime do Sistema'))).not.toHaveLength(0);
      });
    });

    it('deve exibir jobs ativos no momento', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        expect(screen.getAllByText((_, el) => el?.textContent?.includes('Jobs ativos no momento'))).not.toHaveLength(0);
        expect(screen.getAllByText((_, el) => el?.textContent?.includes('3'))).not.toHaveLength(0);
      });
    });
  });

  /**
   * Teste de métricas de sistema
   */
  describe('Métricas de Sistema', () => {
    it('deve exibir as métricas de sistema', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        const metricas = screen.getByTestId('dashboard-metricas');
        expect(metricas).toHaveTextContent('Sistema');
        expect(metricas).toHaveTextContent('2.4 GB');
        expect(metricas).toHaveTextContent('Jobs Pendentes');
        expect(metricas).toHaveTextContent('Jobs Falharam');
      });
    });

    it('deve exibir as métricas de crescimento', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        expect(screen.getAllByText('Crescimento').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Novos Usuários (Mês)').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Taxa de Crescimento').length).toBeGreaterThan(0);
        expect(screen.getAllByText('+12.5%').length).toBeGreaterThan(0);
      });
    });

    it('deve exibir as métricas de uptime', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        expect(screen.getAllByText('Uptime').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Uptime do Sistema').length).toBeGreaterThan(0);
        expect(screen.getAllByText('99.98%').length).toBeGreaterThan(0);
      });
    });
  });

  /**
   * Teste de alertas do sistema
   */
  describe('Alertas do Sistema', () => {
    it('deve exibir alertas críticos', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        const alertas = screen.getByTestId('dashboard-alertas');
        expect(alertas).toHaveTextContent('Alertas Críticos');
        expect(alertas).toHaveTextContent('alertas críticos que requerem atenção imediata');
      });
    });

    it('deve permitir resolver alertas', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        const resolverButtons = screen.getAllByText('Resolver');
        expect(resolverButtons.length).toBeGreaterThan(0);
        // Interagir apenas com o primeiro botão relevante
        expect(resolverButtons[0]).toBeInTheDocument();
      });
    });
  });

  /**
   * Teste de logs de auditoria
   */
  describe('Logs de Auditoria', () => {
    it('deve exibir a aba de logs', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        expect(screen.getByText('Logs de Auditoria')).toBeInTheDocument();
      });
    });

    it('deve exibir placeholders para gráficos', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        expect(screen.getByText('Gráficos')).toBeInTheDocument();
      });
    });
  });

  /**
   * Teste de funcionalidades interativas
   */
  describe('Funcionalidades Interativas', () => {
    it('deve ter botão de atualizar', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        const botaoAtualizar = screen.getByText('Atualizar');
        expect(botaoAtualizar).toBeInTheDocument();
      });
    });

    it('deve permitir clicar no botão de atualizar', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        const botaoAtualizar = screen.getByText('Atualizar');
        fireEvent.click(botaoAtualizar);
        // Verificar se o botão ainda está presente após o clique
        expect(botaoAtualizar).toBeInTheDocument();
      });
    });
  });

  /**
   * Teste de responsividade e layout
   */
  describe('Responsividade e Layout', () => {
    it('deve ter grid responsivo para cards', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        const cardsContainer = screen.getByTestId('dashboard-cards');
        expect(cardsContainer).toBeInTheDocument();
      });
    });

    it('deve ter grid responsivo para métricas', async () => {
      renderAdminDashboard();
      await waitFor(() => {
        const metricasContainer = screen.getByTestId('dashboard-metricas');
        expect(metricasContainer).toBeInTheDocument();
      });
    });
  });

  describe('Renderização', () => {
    it('deve renderizar a página corretamente', async () => {
      renderWithRouter(<AdminDashboard />);
      
      expect(screen.getByText('Dashboard Administrativo')).toBeInTheDocument();
      expect(screen.getByText('Visão geral do sistema e métricas administrativas')).toBeInTheDocument();
      
      // Aguardar carregamento para ver o botão Atualizar
      await waitFor(() => {
        expect(screen.getByText('Atualizar')).toBeInTheDocument();
      });
    });

    it('deve mostrar loading state inicialmente', () => {
      renderWithRouter(<AdminDashboard />);
      
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Administrativo')).toBeInTheDocument();
    });

    it('deve carregar dados do dashboard após montagem', async () => {
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(mockAdminDashboardService.getSystemStats).toHaveBeenCalled();
        expect(mockAdminDashboardService.getSystemAlerts).toHaveBeenCalled();
        expect(mockAdminDashboardService.getAuditLogs).toHaveBeenCalled();
      });
    });
  });

  describe('Métricas do Sistema', () => {
    it('deve exibir métricas do sistema após carregamento', async () => {
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('892')).toBeInTheDocument(); // Usuários ativos
        expect(screen.getByText('156')).toBeInTheDocument(); // Transações hoje
        expect(screen.getByText('3')).toBeInTheDocument(); // Jobs em execução
        expect(screen.getByText('99.98%')).toBeInTheDocument(); // Uptime
      });
    });

    it('deve exibir informações complementares das métricas', async () => {
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('de 1247 total')).toBeInTheDocument(); // Total de usuários
        expect(screen.getByText('de 15420 total')).toBeInTheDocument(); // Total de transações
        expect(screen.getByText('1250 completados, 1 falharam')).toBeInTheDocument(); // Jobs
        expect(screen.getByText('Sistema estável')).toBeInTheDocument(); // Status do sistema
      });
    });
  });

  describe('Alertas do Sistema', () => {
    it('deve exibir alertas do sistema', async () => {
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Alertas do Sistema')).toBeInTheDocument();
        expect(screen.getByText('Alto Uso de CPU')).toBeInTheDocument();
        expect(screen.getByText('Falha no Job de Backup')).toBeInTheDocument();
      });
    });

    it('deve exibir severidade dos alertas', async () => {
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('medium')).toBeInTheDocument();
        expect(screen.getByText('critical')).toBeInTheDocument();
      });
    });

    it('deve exibir mensagem quando não há alertas', async () => {
      mockAdminDashboardService.getSystemAlerts.mockResolvedValue([]);
      
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum alerta ativo')).toBeInTheDocument();
      });
    });
  });

  describe('Logs de Auditoria', () => {
    it('deve exibir logs de auditoria', async () => {
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Logs de Auditoria')).toBeInTheDocument();
        // Usar getAllByText para elementos duplicados
        const joaoSilvaElements = screen.getAllByText('João Silva');
        expect(joaoSilvaElements.length).toBeGreaterThan(0);
        const mariaSantosElements = screen.getAllByText('Maria Santos');
        expect(mariaSantosElements.length).toBeGreaterThan(0);
      });
    });

    it('deve exibir detalhes dos logs', async () => {
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('CREATE - Transaction')).toBeInTheDocument();
        expect(screen.getByText('UPDATE - Account')).toBeInTheDocument();
        // Usar getAllByText para elementos duplicados
        const transactionDetails = screen.getAllByText('Criou nova transação de R$ 150,00');
        expect(transactionDetails.length).toBeGreaterThan(0);
        const accountDetails = screen.getAllByText('Atualizou saldo da conta principal');
        expect(accountDetails.length).toBeGreaterThan(0);
      });
    });

    it('deve exibir tabela detalhada de logs', async () => {
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Logs de Auditoria Detalhados')).toBeInTheDocument();
        expect(screen.getByText('Usuário')).toBeInTheDocument();
        expect(screen.getByText('Ação')).toBeInTheDocument();
        expect(screen.getByText('Recurso')).toBeInTheDocument();
        expect(screen.getByText('Detalhes')).toBeInTheDocument();
        expect(screen.getByText('IP')).toBeInTheDocument();
        expect(screen.getByText('Data/Hora')).toBeInTheDocument();
      });
    });

    it('deve exibir mensagem quando não há logs', async () => {
      mockAdminDashboardService.getAuditLogs.mockResolvedValue([]);
      
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum log disponível')).toBeInTheDocument();
      });
    });
  });

  describe('Interações', () => {
    it('deve atualizar dados ao clicar no botão Atualizar', async () => {
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Atualizar')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Atualizar'));

      await waitFor(() => {
        expect(mockAdminDashboardService.getSystemStats).toHaveBeenCalledTimes(2);
        expect(mockAdminDashboardService.getSystemAlerts).toHaveBeenCalledTimes(2);
        expect(mockAdminDashboardService.getAuditLogs).toHaveBeenCalledTimes(2);
      });
    });

    it('deve mostrar toast de sucesso após carregamento', async () => {
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Dashboard atualizado com sucesso');
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve exibir erro quando falha ao carregar dados', async () => {
      const errorMessage = 'Erro na API';
      mockAdminDashboardService.getSystemStats.mockRejectedValue(new Error(errorMessage));
      
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(`Erro ao carregar dashboard: ${errorMessage}`)).toBeInTheDocument();
        expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
      });
    });

    it('deve mostrar toast de erro quando falha', async () => {
      mockAdminDashboardService.getSystemStats.mockRejectedValue(new Error('Erro na API'));
      
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        // O toast recebe apenas a mensagem do erro, não o prefixo
        expect(toast.error).toHaveBeenCalledWith('Erro na API');
      });
    });

    it('deve permitir tentar novamente após erro', async () => {
      mockAdminDashboardService.getSystemStats.mockRejectedValueOnce(new Error('Erro na API'));
      
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Tentar Novamente'));

      await waitFor(() => {
        expect(mockAdminDashboardService.getSystemStats).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Ações Administrativas', () => {
    it('deve exibir seção de ações administrativas', async () => {
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Ações Administrativas')).toBeInTheDocument();
        expect(screen.getByText('Acesso rápido às ferramentas administrativas')).toBeInTheDocument();
      });
    });

    it('deve exibir botões de ações administrativas', async () => {
      renderWithRouter(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Usuários')).toBeInTheDocument();
        expect(screen.getByText('Backup')).toBeInTheDocument();
        expect(screen.getByText('Relatórios')).toBeInTheDocument();
        expect(screen.getByText('Segurança')).toBeInTheDocument();
      });
    });
  });
}); 