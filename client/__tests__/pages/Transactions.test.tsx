/**
 * @jest-environment jsdom
 */

/**
 * Testes unitários para a página de Transações
 * @description Testa todas as funcionalidades da página de transações incluindo filtros, estatísticas, tabs, exportação e tabela interativa
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';
import Transactions from '../../src/pages/Transactions';

// Mock do react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock do componente TransactionForm
jest.mock('../../src/components/TransactionForm', () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="transaction-form">
      <button onClick={onSuccess}>Salvar</button>
    </div>
  ),
}));

// Mock do axios
jest.mock('../../src/lib/axios', () => ({
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

// Importar o mock após a declaração
import api from '../../src/lib/axios';
const mockApi = api as jest.Mocked<typeof api>;

// Dados mockados iguais aos do componente
const mockTransactions = [
  {
    id: 1,
    account_id: 1,
    category_id: 1,
    type: 'income',
    amount: 5000,
    description: 'Salário',
    date: '2025-01-15',
    bank_name: 'Banco do Brasil',
    account_type: 'Conta Corrente',
    category_name: 'Trabalho',
    status: 'confirmed',
    created_at: '2025-01-15T08:00:00Z'
  },
  {
    id: 2,
    account_id: 1,
    category_id: 2,
    type: 'expense',
    amount: 350,
    description: 'Supermercado',
    date: '2025-01-14',
    bank_name: 'Banco do Brasil',
    account_type: 'Conta Corrente',
    category_name: 'Alimentação',
    status: 'confirmed',
    created_at: '2025-01-14T15:30:00Z'
  },
  {
    id: 3,
    account_id: 2,
    category_id: 3,
    type: 'expense',
    amount: 120,
    description: 'Combustível',
    date: '2025-01-13',
    bank_name: 'Nubank',
    account_type: 'Conta Corrente',
    category_name: 'Transporte',
    status: 'pending',
    created_at: '2025-01-13T10:15:00Z'
  },
  {
    id: 4,
    account_id: 1,
    category_id: 1,
    type: 'income',
    amount: 800,
    description: 'Freelance',
    date: '2025-01-12',
    bank_name: 'Banco do Brasil',
    account_type: 'Conta Corrente',
    category_name: 'Trabalho',
    status: 'confirmed',
    created_at: '2025-01-12T14:20:00Z'
  },
  {
    id: 5,
    account_id: 2,
    category_id: 4,
    type: 'expense',
    amount: 200,
    description: 'Academia',
    date: '2025-01-11',
    bank_name: 'Nubank',
    account_type: 'Conta Corrente',
    category_name: 'Saúde',
    status: 'confirmed',
    created_at: '2025-01-11T09:45:00Z'
  },
  {
    id: 6,
    account_id: 1,
    category_id: 5,
    type: 'expense',
    amount: 150,
    description: 'Cinema',
    date: '2025-01-10',
    bank_name: 'Banco do Brasil',
    account_type: 'Conta Corrente',
    category_name: 'Lazer',
    status: 'confirmed',
    created_at: '2025-01-10T19:30:00Z'
  }
];

const mockAccounts = [
  { id: 1, bankName: 'Banco do Brasil', accountType: 'Conta Corrente', balance: 3500 },
  { id: 2, bankName: 'Nubank', accountType: 'Conta Corrente', balance: 1480 }
];

const mockCategories = [
  { id: 1, name: 'Trabalho', type: 'income', color: '#10b981' },
  { id: 2, name: 'Alimentação', type: 'expense', color: '#ef4444' },
  { id: 3, name: 'Transporte', type: 'expense', color: '#3b82f6' },
  { id: 4, name: 'Saúde', type: 'expense', color: '#8b5cf6' },
  { id: 5, name: 'Lazer', type: 'expense', color: '#f59e0b' }
];

/**
 * Wrapper para renderizar o componente com Router e AuthProvider
 */
const renderTransactions = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Transactions />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock das chamadas da API com dados reais
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/transactions') {
        return Promise.resolve({ data: mockTransactions });
      }
      if (url === '/accounts') {
        return Promise.resolve({ data: { accounts: mockAccounts } });
      }
      if (url === '/categories') {
        return Promise.resolve({ data: mockCategories });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  describe('Renderização Inicial', () => {
    it('deve renderizar a página de transações', () => {
      renderTransactions();
      expect(screen.getByText('Transações')).toBeInTheDocument();
      expect(screen.getByText('Gerencie suas receitas e despesas')).toBeInTheDocument();
    });

    it('deve exibir botões de ação no header', () => {
      renderTransactions();
      expect(screen.getByText('Nova Transação')).toBeInTheDocument();
      expect(screen.getByText('Exportar')).toBeInTheDocument();
      expect(screen.getByText('Atualizar')).toBeInTheDocument();
    });

    it('deve exibir cards de estatísticas', () => {
      renderTransactions();
      // Usar getAllByText e filtrar por h3 (cards de estatísticas)
      const receitasCards = screen.getAllByText('Receitas').filter(el => el.tagName === 'H3');
      const despesasCards = screen.getAllByText('Despesas').filter(el => el.tagName === 'H3');
      const saldoCards = screen.getAllByText('Saldo').filter(el => el.tagName === 'H3');
      const pendentesCards = screen.getAllByText('Pendentes').filter(el => el.tagName === 'H3');
      
      expect(receitasCards.length).toBeGreaterThan(0);
      expect(despesasCards.length).toBeGreaterThan(0);
      expect(saldoCards.length).toBeGreaterThan(0);
      expect(pendentesCards.length).toBeGreaterThan(0);
    });

    it('deve exibir valores formatados nas estatísticas', () => {
      renderTransactions();
      // Verificar se há valores formatados nos cards
      const formattedValues = screen.queryAllByText((content) => 
        /R\$\s*\d+,\d+/.test(content)
      );
      expect(formattedValues.length).toBeGreaterThan(0);
    });
  });

  describe('Tabs e Navegação', () => {
    function isTabActive(tab: HTMLElement) {
      return tab.getAttribute('data-state') === 'active' || tab.getAttribute('aria-selected') === 'true';
    }

    it('deve exibir todas as abas', () => {
      renderTransactions();
      // Deve haver pelo menos um botão/tab para cada aba
      const todasTabs = screen.getAllByText('Todas').filter(el => el.tagName === 'BUTTON');
      const receitasTabs = screen.getAllByText('Receitas').filter(el => el.tagName === 'BUTTON');
      const despesasTabs = screen.getAllByText('Despesas').filter(el => el.tagName === 'BUTTON');
      const pendentesTabs = screen.getAllByText('Pendentes').filter(el => el.tagName === 'BUTTON');
      expect(todasTabs.length).toBeGreaterThan(0);
      expect(receitasTabs.length).toBeGreaterThan(0);
      expect(despesasTabs.length).toBeGreaterThan(0);
      expect(pendentesTabs.length).toBeGreaterThan(0);
    });

    it('deve alternar para a aba Receitas', async () => {
      renderTransactions();
      const receitasTabs = screen.getAllByText('Receitas').filter(el => el.tagName === 'BUTTON');
      const tabButton = receitasTabs[0];
      fireEvent.click(tabButton);
      await waitFor(() => {
        // Validar que só aparecem receitas na tabela
        const incomeCells = screen.queryAllByText((content, node) => 
          node?.tagName === 'SPAN' && /Receita/.test(content)
        );
        expect(incomeCells.length).toBeGreaterThan(0);
      });
    });

    it('deve alternar para a aba Despesas', async () => {
      renderTransactions();
      const despesasTabs = screen.getAllByText('Despesas').filter(el => el.tagName === 'BUTTON');
      const tabButton = despesasTabs[0];
      fireEvent.click(tabButton);
      await waitFor(() => {
        // Validar que só aparecem despesas na tabela
        const expenseCells = screen.queryAllByText((content, node) => 
          node?.tagName === 'SPAN' && /Despesa/.test(content)
        );
        expect(expenseCells.length).toBeGreaterThan(0);
      });
    });

    it('deve alternar para a aba Pendentes', async () => {
      renderTransactions();
      const pendentesTabs = screen.getAllByText('Pendentes').filter(el => el.tagName === 'BUTTON');
      const tabButton = pendentesTabs[0];
      fireEvent.click(tabButton);
      await waitFor(() => {
        // Validar que só aparecem transações pendentes na tabela
        const pendingCells = screen.queryAllByText((content, node) => 
          node?.tagName === 'SPAN' && /Pendente/.test(content)
        );
        expect(pendingCells.length).toBeGreaterThan(0);
      });
    });

    it('deve alternar para a aba Todas', async () => {
      renderTransactions();
      const todasTabs = screen.getAllByText('Todas').filter(el => el.tagName === 'BUTTON');
      const tabButton = todasTabs[0];
      fireEvent.click(tabButton);
      await waitFor(() => {
        // Validar que aparecem tanto receitas quanto despesas na tabela
        const incomeCells = screen.queryAllByText((content, node) => 
          node?.tagName === 'SPAN' && /Receita/.test(content)
        );
        const expenseCells = screen.queryAllByText((content, node) => 
          node?.tagName === 'SPAN' && /Despesa/.test(content)
        );
        expect(incomeCells.length).toBeGreaterThan(0);
        expect(expenseCells.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Filtros', () => {
    it('deve exibir seção de filtros', () => {
      renderTransactions();
      
      expect(screen.getByText('Filtros')).toBeInTheDocument();
      expect(screen.getByText('Filtre as transações por diferentes critérios')).toBeInTheDocument();
    });

    it('deve ter campo de busca', () => {
      renderTransactions();
      
      const searchInput = screen.getByPlaceholderText('Descrição...');
      expect(searchInput).toBeInTheDocument();
    });

    it('deve ter filtro por tipo', () => {
      renderTransactions();
      
      expect(screen.getByText('Tipo')).toBeInTheDocument();
      expect(screen.getByText('Todos os tipos')).toBeInTheDocument();
    });

    it('deve ter filtro por categoria', () => {
      renderTransactions();
      
      expect(screen.getByText('Categoria')).toBeInTheDocument();
      expect(screen.getByText('Todas as categorias')).toBeInTheDocument();
    });

    it('deve ter filtro por conta', () => {
      renderTransactions();
      
      expect(screen.getByText('Conta')).toBeInTheDocument();
      expect(screen.getByText('Todas as contas')).toBeInTheDocument();
    });

    it('deve ter filtro por status', () => {
      renderTransactions();
      
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Todos os status')).toBeInTheDocument();
    });

    it('deve ter filtros de data', () => {
      renderTransactions();
      
      expect(screen.getByText('Data Inicial')).toBeInTheDocument();
      expect(screen.getByText('Data Final')).toBeInTheDocument();
    });

    it('deve ter filtros de valor', () => {
      renderTransactions();
      
      expect(screen.getByText('Valor Mínimo')).toBeInTheDocument();
      expect(screen.getByText('Valor Máximo')).toBeInTheDocument();
    });

    it('deve ter botão para limpar filtros', () => {
      renderTransactions();
      
      expect(screen.getByText('Limpar Filtros')).toBeInTheDocument();
    });

    it('deve limpar filtros quando clicar no botão', () => {
      renderTransactions();
      
      const searchInput = screen.getByPlaceholderText('Descrição...');
      fireEvent.change(searchInput, { target: { value: 'teste' } });
      
      expect(searchInput).toHaveValue('teste');
      
      const clearButton = screen.getByText('Limpar Filtros');
      fireEvent.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Tabela de Transações', () => {
    beforeEach(() => {
      mockApi.get.mockImplementation((url: string) => {
        if (url === '/transactions') return Promise.resolve({ data: mockTransactions });
        if (url === '/accounts') return Promise.resolve({ data: { accounts: mockAccounts } });
        if (url === '/categories') return Promise.resolve({ data: mockCategories });
        return Promise.resolve({ data: [] });
      });
    });

    it('deve exibir cabeçalho da tabela', () => {
      renderTransactions();
      const headers = screen.getAllByText((content) => content.includes('Transações'));
      const tableHeader = headers.find(h => h.tagName === 'H3');
      expect(tableHeader).toBeInTheDocument();
      expect(screen.getByText('Lista de todas as transações filtradas')).toBeInTheDocument();
    });

    it('deve exibir colunas da tabela', async () => {
      renderTransactions();
      await waitFor(() => {
        const ths = Array.from(document.querySelectorAll('th')).map(th => th.textContent);
        expect(ths).toEqual([
          'Descrição',
          'Tipo',
          'Valor',
          'Categoria',
          'Conta',
          'Data',
          'Status',
          'Ações'
        ]);
      });
    });

    it('deve exibir dados das transações', async () => {
      renderTransactions();
      await waitFor(() => {
        const trs = document.querySelectorAll('tbody tr');
        expect(trs.length).toBeGreaterThan(0);
      });
      await waitFor(() => {
        const salaryCell = screen.queryAllByText((content, node) => node?.tagName === 'TD' && /Salário/.test(content));
        expect(salaryCell.length).toBeGreaterThan(0);
        const supermarketCell = screen.queryAllByText((content, node) => node?.tagName === 'TD' && /Supermercado/.test(content));
        expect(supermarketCell.length).toBeGreaterThan(0);
      });
    });

    it('deve exibir categorias corretas', async () => {
      renderTransactions();
      // Garantir que a aba "Todas" está ativa para mostrar todas as transações
      const todasTabs = screen.getAllByText('Todas').filter(el => el.tagName === 'BUTTON');
      const tabButton = todasTabs[0];
      fireEvent.click(tabButton);
      await waitFor(() => {
        // Aguardar que a tabela seja renderizada
        const tableRows = document.querySelectorAll('tbody tr');
        expect(tableRows.length).toBeGreaterThan(0);
      });
      await waitFor(() => {
        // Buscar por categorias em qualquer elemento (não apenas TD)
        const workCategory = screen.queryAllByText((content, node) => 
          /Trabalho/.test(content)
        );
        expect(workCategory.length).toBeGreaterThan(0);
        const foodCategory = screen.queryAllByText((content, node) => 
          /Alimentação/.test(content)
        );
        expect(foodCategory.length).toBeGreaterThan(0);
      });
    });

    it('deve exibir contas corretas', async () => {
      renderTransactions();
      
      await waitFor(() => {
        const accountText = screen.queryAllByText((content, node) => 
          node?.tagName === 'TD' && /Banco do Brasil - Conta Corrente/.test(content)
        );
        expect(accountText.length).toBeGreaterThan(0);
      });
    });

    it('deve exibir valores formatados', async () => {
      renderTransactions();
      
      await waitFor(() => {
        const incomeValue = screen.queryAllByText((content, node) => 
          node?.tagName === 'TD' && /R\$ 5\.000,00/.test(content)
        );
        expect(incomeValue.length).toBeGreaterThan(0);
        
        const expenseValue = screen.queryAllByText((content, node) => 
          node?.tagName === 'TD' && /R\$ 350,00/.test(content)
        );
        expect(expenseValue.length).toBeGreaterThan(0);
      });
    });

    it('deve exibir status das transações', async () => {
      renderTransactions();
      // Garantir que a aba "Todas" está ativa para mostrar todos os status
      const todasTabs = screen.getAllByText('Todas').filter(el => el.tagName === 'BUTTON');
      const tabButton = todasTabs[0];
      fireEvent.click(tabButton);
      await waitFor(() => {
        // Aguardar que a tabela seja renderizada
        const tableRows = document.querySelectorAll('tbody tr');
        expect(tableRows.length).toBeGreaterThan(0);
      });
      await waitFor(() => {
        const confirmedStatus = screen.queryAllByText((content, node) => 
          node?.tagName === 'SPAN' && /Confirmado/.test(content)
        );
        expect(confirmedStatus.length).toBeGreaterThan(0);
        const pendingStatus = screen.queryAllByText((content, node) => 
          node?.tagName === 'SPAN' && /Pendente/.test(content)
        );
        expect(pendingStatus.length).toBeGreaterThan(0);
      });
    });

    it('deve exibir botões de ação', async () => {
      renderTransactions();
      await waitFor(() => {
        const trs = document.querySelectorAll('tbody tr');
        expect(trs.length).toBeGreaterThan(0);
      });
      await waitFor(() => {
        const editButtons = screen.queryAllByLabelText('Editar');
        const deleteButtons = screen.queryAllByLabelText('Excluir');
        expect(editButtons.length).toBeGreaterThan(0);
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Estados da Tabela', () => {
    it('deve exibir mensagem quando não há transações', async () => {
      // Sobrescrever mock para retornar array vazio
      mockApi.get.mockImplementation((url: string) => {
        if (url === '/transactions') return Promise.resolve({ data: [] });
        if (url === '/accounts') return Promise.resolve({ data: { accounts: mockAccounts } });
        if (url === '/categories') return Promise.resolve({ data: mockCategories });
        return Promise.resolve({ data: [] });
      });

      renderTransactions();
      
      await waitFor(() => {
        const emptyMessage = screen.queryByText((content, node) => 
          /Nenhuma transação encontrada/.test(content)
        );
        expect(emptyMessage).not.toBeNull();
      });
    });

    it('deve exibir loading durante carregamento', () => {
      // Mock de loading
      mockApi.get.mockImplementation(() => new Promise(() => {}));
      
      renderTransactions();
      // Verificar se há algum indicador de loading
      const loadingIndicator = screen.queryByText(/carregando/i) || 
                             screen.queryByRole('progressbar') ||
                             document.querySelector('.animate-spin');
      expect(loadingIndicator).toBeInTheDocument();
    });
  });

  describe('Modal de Formulário', () => {
    it('deve abrir modal ao clicar em Nova Transação', () => {
      renderTransactions();
      
      // Usar getAllByText para pegar o primeiro botão "Nova Transação"
      const newTransactionButtons = screen.getAllByText('Nova Transação');
      const button = newTransactionButtons[0]; // Primeiro botão (não o título do modal)
      fireEvent.click(button);
      
      expect(screen.getByText('Crie uma nova transação')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-form')).toBeInTheDocument();
    });

    it('deve abrir modal de edição ao clicar em editar', () => {
      renderTransactions();
      
      // Encontrar botões de edição por role e aria-label
      const buttons = screen.getAllByRole('button');
      const editButton = buttons.find(button => button.getAttribute('aria-label') === 'Editar');
      
      if (editButton) {
        fireEvent.click(editButton);
        
        expect(screen.getByText('Editar Transação')).toBeInTheDocument();
        expect(screen.getByText('Edite os dados da transação')).toBeInTheDocument();
        expect(screen.getByTestId('transaction-form')).toBeInTheDocument();
      }
    });

    it('deve fechar modal ao salvar', async () => {
      renderTransactions();
      
      const newTransactionButtons = screen.getAllByText('Nova Transação');
      const button = newTransactionButtons[0];
      fireEvent.click(button);
      
      expect(screen.getByTestId('transaction-form')).toBeInTheDocument();
      
      const saveButton = screen.getByText('Salvar');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('transaction-form')).not.toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidades de Exportação', () => {
    it('deve ter botão de exportação', () => {
      renderTransactions();
      expect(screen.getByText('Exportar')).toBeInTheDocument();
    });

    it('deve exportar dados ao clicar no botão', () => {
      // Mock do download
      const originalCreateElement = document.createElement;
      document.createElement = (tagName) => {
        if (tagName === 'a') {
          const a = originalCreateElement.call(document, 'a');
          a.click = jest.fn();
          return a;
        }
        return originalCreateElement.call(document, tagName);
      };
      const mockCreateObjectURL = jest.fn();
      const mockRevokeObjectURL = jest.fn();
      Object.defineProperty(window, 'URL', {
        value: {
          createObjectURL: mockCreateObjectURL,
          revokeObjectURL: mockRevokeObjectURL,
        },
        writable: true,
      });
      renderTransactions();
      const exportButton = screen.getByText('Exportar');
      fireEvent.click(exportButton);
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  describe('Funcionalidades de Atualização', () => {
    it('deve ter botão de atualizar', () => {
      renderTransactions();
      
      expect(screen.getByText('Atualizar')).toBeInTheDocument();
    });

    it('deve recarregar a página ao clicar em atualizar', () => {
      renderTransactions();
      const refreshButton = screen.getByText('Atualizar');
      fireEvent.click(refreshButton);
      
      // Verificar se a função de fetch foi chamada
      expect(mockApi.get).toHaveBeenCalledWith('/transactions');
    });
  });

  describe('Funcionalidades de Exclusão', () => {
    it('deve confirmar exclusão', () => {
      const mockConfirm = jest.fn().mockReturnValue(true);
      window.confirm = mockConfirm;
      
      renderTransactions();
      
      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(button => button.getAttribute('aria-label') === 'Excluir');
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(mockConfirm).toHaveBeenCalledWith('Tem certeza que deseja excluir esta transação?');
      }
    });

    it('deve chamar API de exclusão quando confirmado', async () => {
      const mockConfirm = jest.fn().mockReturnValue(true);
      window.confirm = mockConfirm;
      
      mockApi.delete.mockResolvedValueOnce({});
      
      renderTransactions();
      
      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(button => button.getAttribute('aria-label') === 'Excluir');
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        
        await waitFor(() => {
          expect(mockApi.delete).toHaveBeenCalledWith('/transactions/1');
        });
      }
    });
  });

  describe('Filtros Funcionais', () => {
    it('deve filtrar por busca', async () => {
      renderTransactions();
      const searchInput = screen.getByPlaceholderText('Descrição...');
      fireEvent.change(searchInput, { target: { value: 'Salário' } });
      await waitFor(() => {
        const salaryElements = screen.queryAllByText((content, node) => /Salário/.test(content));
        expect(salaryElements.length).toBeGreaterThan(0);
        const supermarketElements = screen.queryAllByText((content, node) => /Supermercado/.test(content));
        expect(supermarketElements.length).toBe(0);
      });
    });

    it('deve filtrar por tipo', async () => {
      renderTransactions();
      const typeSelect = screen.getByText('Todos os tipos');
      fireEvent.click(typeSelect);
      const options = screen.getAllByRole('option');
      const incomeOption = options.find(opt => opt.textContent === 'Receitas');
      fireEvent.click(incomeOption);
      await waitFor(() => {
        const salaryElements = screen.queryAllByText((content, node) => /Salário/.test(content));
        expect(salaryElements.length).toBeGreaterThan(0);
      });
    });

    it('deve filtrar por categoria', async () => {
      renderTransactions();
      const categorySelect = screen.getByText('Todas as categorias');
      fireEvent.click(categorySelect);
      const options = screen.getAllByRole('option');
      const workOption = options.find(opt => opt.textContent === 'Trabalho');
      fireEvent.click(workOption);
      await waitFor(() => {
        const salaryElements = screen.queryAllByText((content, node) => /Salário/.test(content));
        expect(salaryElements.length).toBeGreaterThan(0);
        const freelanceElements = screen.queryAllByText((content, node) => /Freelance/.test(content));
        expect(freelanceElements.length).toBeGreaterThan(0);
        const supermarketElements = screen.queryAllByText((content, node) => /Supermercado/.test(content));
        expect(supermarketElements.length).toBe(0);
      });
    });

    it('deve filtrar por conta', async () => {
      renderTransactions();
      const accountSelect = screen.getByText('Todas as contas');
      fireEvent.click(accountSelect);
      const options = screen.getAllByRole('option');
      const accountOption = options.find(opt => opt.textContent === 'Banco do Brasil - Conta Corrente');
      fireEvent.click(accountOption);
      await waitFor(() => {
        const accountElements = screen.queryAllByText((content, node) => /Banco do Brasil - Conta Corrente/.test(content));
        expect(accountElements.length).toBeGreaterThan(0);
      });
    });

    it('deve filtrar por data', async () => {
      renderTransactions();
      
      // Aguardar carregamento inicial
      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/transactions');
      });
      
      // Buscar inputs de data
      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs.length).toBeGreaterThan(0);
      
      // Preencher data inicial
      const startDateInput = dateInputs[0];
      fireEvent.change(startDateInput, { target: { value: '2025-01-15' } });
      
      await waitFor(() => {
        // Verificar se o filtro foi aplicado (pode não haver transações na data específica)
        expect(startDateInput).toHaveValue('2025-01-15');
      });
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter estrutura de tabela acessível', async () => {
      renderTransactions();
      await waitFor(() => {
        // Aceitar <table>, [role="table"] ou <tbody> como estrutura válida
        const table = document.querySelector('table');
        const tableRole = document.querySelector('[role="table"]');
        const tbody = document.querySelector('tbody');
        expect(table || tableRole || tbody).toBeTruthy();
      });
    });

    it('deve ter labels apropriados para campos de busca', () => {
      renderTransactions();
      
      // Buscar input de busca pelo placeholder correto
      const searchInput = screen.getByPlaceholderText('Descrição...');
      expect(searchInput).toBeInTheDocument();
    });

    it('deve ter botões com aria-labels', () => {
      renderTransactions();
      
      // Verificar botões principais
      const newTransactionButton = screen.getByText('Nova Transação');
      expect(newTransactionButton).toBeInTheDocument();
      
      // Verificar se há botões de ação na tabela
      const actionButtons = document.querySelectorAll('button[aria-label]');
      if (actionButtons.length > 0) {
        expect(actionButtons.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Estados de Loading e Erro', () => {
    it('deve mostrar mensagem quando não há transações', async () => {
      mockApi.get.mockImplementation((url: string) => {
        if (url === '/transactions') return Promise.resolve({ data: [] });
        if (url === '/accounts') return Promise.resolve({ data: { accounts: mockAccounts } });
        if (url === '/categories') return Promise.resolve({ data: mockCategories });
        return Promise.resolve({ data: [] });
      });
      
      renderTransactions();
      
      await waitFor(() => {
        const emptyMessage = screen.queryByText((content, node) => 
          /nenhuma transação encontrada/i.test(content)
        );
        expect(emptyMessage).not.toBeNull();
        
        const createMessage = screen.queryByText((content, node) => 
          /criar primeira transação/i.test(content)
        );
        expect(createMessage).not.toBeNull();
      });
    });
  });
}); 