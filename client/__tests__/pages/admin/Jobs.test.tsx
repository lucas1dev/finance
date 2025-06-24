import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import AdminJobs from '@/pages/admin/Jobs';

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

/**
 * Renderiza o componente AdminJobs com os providers necessários
 */
const renderAdminJobs = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AdminJobs />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AdminJobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar o título e descrição', async () => {
      renderAdminJobs();
      await waitFor(() => {
        expect(screen.getByText('Painel de Jobs')).toBeInTheDocument();
        expect(screen.getByText('Gerencie jobs do sistema, agendamentos e execuções')).toBeInTheDocument();
      });
    });

    it('deve exibir os cards de estatísticas', async () => {
      renderAdminJobs();
      await waitFor(() => {
        expect(screen.getByText('Total de Jobs')).toBeInTheDocument();
        expect(screen.getByText('Jobs Ativos')).toBeInTheDocument();
        expect(screen.getByText('Jobs Pausados')).toBeInTheDocument();
        expect(screen.getByText('Jobs Falharam')).toBeInTheDocument();
      });
    });

    it('deve exibir os valores corretos nos cards', async () => {
      renderAdminJobs();
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // Total de jobs
        expect(screen.getByText('1')).toBeInTheDocument(); // Jobs ativos
        expect(screen.getByText('1')).toBeInTheDocument(); // Jobs pausados
        expect(screen.getByText('1')).toBeInTheDocument(); // Jobs falharam
      });
    });

    it('deve exibir as abas principais', async () => {
      renderAdminJobs();
      await waitFor(() => {
        expect(screen.getByText('Jobs')).toBeInTheDocument();
        expect(screen.getByText('Histórico')).toBeInTheDocument();
        expect(screen.getByText('Configurações')).toBeInTheDocument();
      });
    });
  });

  describe('Tabela de Jobs', () => {
    it('deve exibir a tabela de jobs', async () => {
      renderAdminJobs();
      await waitFor(() => {
        expect(screen.getByText('Jobs do Sistema')).toBeInTheDocument();
        expect(screen.getByText('Enviar Notificações')).toBeInTheDocument();
        expect(screen.getByText('Backup Diário')).toBeInTheDocument();
        expect(screen.getByText('Verificar Integridade')).toBeInTheDocument();
      });
    });

    it('deve exibir os cabeçalhos da tabela', async () => {
      renderAdminJobs();
      await waitFor(() => {
        expect(screen.getByText('Job')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Agendamento')).toBeInTheDocument();
        expect(screen.getByText('Última Execução')).toBeInTheDocument();
        expect(screen.getByText('Próxima Execução')).toBeInTheDocument();
        expect(screen.getByText('Duração Média')).toBeInTheDocument();
        expect(screen.getByText('Taxa de Sucesso')).toBeInTheDocument();
        expect(screen.getByText('Ações')).toBeInTheDocument();
      });
    });

    it('deve exibir os status dos jobs corretamente', async () => {
      renderAdminJobs();
      await waitFor(() => {
        expect(screen.getByText('Executando')).toBeInTheDocument();
        expect(screen.getByText('Pausado')).toBeInTheDocument();
        expect(screen.getByText('Falhou')).toBeInTheDocument();
      });
    });

    it('deve exibir os botões de ação', async () => {
      renderAdminJobs();
      await waitFor(() => {
        const playButtons = screen.getAllByRole('button', { name: /play/i });
        const pauseButtons = screen.getAllByRole('button', { name: /pause/i });
        const settingsButtons = screen.getAllByRole('button', { name: /settings/i });
        
        expect(playButtons.length).toBeGreaterThan(0);
        expect(pauseButtons.length).toBeGreaterThan(0);
        expect(settingsButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Filtros', () => {
    it('deve exibir o campo de busca', async () => {
      renderAdminJobs();
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar por nome ou descrição...');
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('deve exibir o filtro de status', async () => {
      renderAdminJobs();
      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('deve filtrar jobs por busca', async () => {
      renderAdminJobs();
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar por nome ou descrição...');
        fireEvent.change(searchInput, { target: { value: 'Notificações' } });
        
        expect(screen.getByText('Enviar Notificações')).toBeInTheDocument();
        expect(screen.queryByText('Backup Diário')).not.toBeInTheDocument();
      });
    });

    it('deve filtrar jobs por status', async () => {
      renderAdminJobs();
      await waitFor(() => {
        const statusSelect = screen.getByText('Status');
        fireEvent.click(statusSelect);
        
        // Verificar se as opções de status estão disponíveis
        expect(screen.getByText('Todos os Status')).toBeInTheDocument();
        expect(screen.getByText('Em Execução')).toBeInTheDocument();
        expect(screen.getByText('Pausado')).toBeInTheDocument();
        expect(screen.getByText('Falhou')).toBeInTheDocument();
        expect(screen.getByText('Ocioso')).toBeInTheDocument();
      });
    });
  });

  describe('Ações de Jobs', () => {
    it('deve permitir executar job manualmente', async () => {
      renderAdminJobs();
      await waitFor(() => {
        const playButtons = screen.getAllByRole('button', { name: /play/i });
        fireEvent.click(playButtons[0]);
      });
    });

    it('deve permitir pausar job', async () => {
      renderAdminJobs();
      await waitFor(() => {
        const pauseButtons = screen.getAllByRole('button', { name: /pause/i });
        fireEvent.click(pauseButtons[0]);
      });
    });

    it('deve permitir abrir configurações', async () => {
      renderAdminJobs();
      await waitFor(() => {
        const settingsButtons = screen.getAllByRole('button', { name: /settings/i });
        fireEvent.click(settingsButtons[0]);
      });
    });
  });

  describe('Histórico de Execuções', () => {
    it('deve exibir a aba de histórico', async () => {
      renderAdminJobs();
      await waitFor(() => {
        const historyTab = screen.getByText('Histórico');
        fireEvent.click(historyTab);
        
        expect(screen.getByText('Histórico de Execuções')).toBeInTheDocument();
      });
    });

    it('deve exibir os cabeçalhos da tabela de histórico', async () => {
      renderAdminJobs();
      await waitFor(() => {
        const historyTab = screen.getByText('Histórico');
        fireEvent.click(historyTab);
        
        expect(screen.getByText('Job')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Início')).toBeInTheDocument();
        expect(screen.getByText('Fim')).toBeInTheDocument();
        expect(screen.getByText('Duração')).toBeInTheDocument();
        expect(screen.getByText('Mensagem')).toBeInTheDocument();
      });
    });
  });

  describe('Configurações', () => {
    it('deve exibir a aba de configurações', async () => {
      renderAdminJobs();
      await waitFor(() => {
        const settingsTab = screen.getByText('Configurações');
        fireEvent.click(settingsTab);
        
        expect(screen.getByText('Configurações Globais')).toBeInTheDocument();
      });
    });

    it('deve exibir os campos de configuração', async () => {
      renderAdminJobs();
      await waitFor(() => {
        const settingsTab = screen.getByText('Configurações');
        fireEvent.click(settingsTab);
        
        expect(screen.getByText('Timeout Padrão (segundos)')).toBeInTheDocument();
        expect(screen.getByText('Máximo de Tentativas')).toBeInTheDocument();
        expect(screen.getByText('Intervalo entre Tentativas (segundos)')).toBeInTheDocument();
        expect(screen.getByText('Salvar Configurações')).toBeInTheDocument();
      });
    });
  });

  describe('Botões de Ação', () => {
    it('deve exibir botão de atualizar', async () => {
      renderAdminJobs();
      await waitFor(() => {
        expect(screen.getByText('Atualizar')).toBeInTheDocument();
      });
    });

    it('deve exibir botão de configurar', async () => {
      renderAdminJobs();
      await waitFor(() => {
        expect(screen.getByText('Configurar')).toBeInTheDocument();
      });
    });

    it('deve permitir clicar no botão atualizar', async () => {
      renderAdminJobs();
      await waitFor(() => {
        const updateButton = screen.getByText('Atualizar');
        fireEvent.click(updateButton);
      });
    });

    it('deve permitir clicar no botão configurar', async () => {
      renderAdminJobs();
      await waitFor(() => {
        const configButton = screen.getByText('Configurar');
        fireEvent.click(configButton);
      });
    });
  });

  describe('Dados Mockados', () => {
    it('deve exibir dados mockados corretamente', async () => {
      renderAdminJobs();
      await waitFor(() => {
        // Verificar se os jobs mockados estão sendo exibidos
        expect(screen.getByText('Enviar Notificações')).toBeInTheDocument();
        expect(screen.getByText('Backup Diário')).toBeInTheDocument();
        expect(screen.getByText('Verificar Integridade')).toBeInTheDocument();
        expect(screen.getByText('Limpar Logs')).toBeInTheDocument();
        expect(screen.getByText('Atualizar Relatórios')).toBeInTheDocument();
      });
    });

    it('deve exibir informações de agendamento', async () => {
      renderAdminJobs();
      await waitFor(() => {
        // Verificar se as informações de agendamento estão sendo exibidas
        expect(screen.getByText('*/5 * * * *')).toBeInTheDocument(); // Enviar Notificações
        expect(screen.getByText('0 2 * * *')).toBeInTheDocument(); // Limpeza de Dados
        expect(screen.getByText('0 1 * * 0')).toBeInTheDocument(); // Geração de Backup
      });
    });

    it('deve exibir taxas de sucesso', async () => {
      renderAdminJobs();
      await waitFor(() => {
        // Verificar se as taxas de sucesso estão sendo exibidas
        expect(screen.getByText('98.5%')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('95.2%')).toBeInTheDocument();
        expect(screen.getByText('99.1%')).toBeInTheDocument();
      });
    });
  });

  describe('Estrutura de Layout', () => {
    it('deve ter estrutura de layout correta', async () => {
      renderAdminJobs();
      await waitFor(() => {
        // Verificar se a estrutura básica está presente
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getByText('Filtros')).toBeInTheDocument();
        expect(screen.getByText('Jobs do Sistema')).toBeInTheDocument();
      });
    });

    it('deve exibir loading state inicialmente', async () => {
      renderAdminJobs();
      // O loading deve aparecer brevemente
      expect(screen.getByText('Carregando jobs...')).toBeInTheDocument();
    });
  });

  describe('Navegação entre Abas', () => {
    it('deve navegar entre as abas corretamente', async () => {
      renderAdminJobs();
      await waitFor(() => {
        // Clicar na aba Histórico
        const historyTab = screen.getByText('Histórico');
        fireEvent.click(historyTab);
        expect(screen.getByText('Histórico de Execuções')).toBeInTheDocument();

        // Clicar na aba Configurações
        const settingsTab = screen.getByText('Configurações');
        fireEvent.click(settingsTab);
        expect(screen.getByText('Configurações Globais')).toBeInTheDocument();

        // Voltar para a aba Jobs
        const jobsTab = screen.getByText('Jobs');
        fireEvent.click(jobsTab);
        expect(screen.getByText('Jobs do Sistema')).toBeInTheDocument();
      });
    });
  });
}); 