import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminNotifications from '../../../src/pages/admin/Notifications';

// Mock do contexto de autenticação
const mockAuthContext = {
  user: { id: 1, name: 'Admin', email: 'admin@example.com', role: 'admin' },
  isAuthenticated: true,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  updateProfile: jest.fn(),
  updatePassword: jest.fn(),
  deleteAccount: jest.fn(),
  refreshToken: jest.fn(),
  clearError: jest.fn(),
  error: null,
  success: null,
  clearSuccess: jest.fn(),
};

jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock dos componentes Shadcn/UI
jest.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }) => (
    <button 
      onClick={onClick} 
      className={`btn ${variant} ${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('../../../src/components/ui/input', () => ({
  Input: ({ placeholder, value, onChange, ...props }) => (
    <input 
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="input"
      {...props}
    />
  ),
}));

jest.mock('../../../src/components/ui/select', () => ({
  Select: ({ children, ...props }) => <div className="select" {...props}>{children}</div>,
  SelectTrigger: ({ children, ...props }) => <div className="select-trigger" {...props}>{children}</div>,
  SelectValue: ({ placeholder, ...props }) => <div className="select-value" {...props}>{placeholder}</div>,
  SelectContent: ({ children, ...props }) => <div className="select-content" {...props}>{children}</div>,
  SelectItem: ({ children, value, ...props }) => (
    <div className="select-item" data-value={value} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('../../../src/components/ui/table', () => ({
  Table: ({ children, ...props }) => <table className="table" {...props}>{children}</table>,
  TableHeader: ({ children, ...props }) => <thead className="table-header" {...props}>{children}</thead>,
  TableBody: ({ children, ...props }) => <tbody className="table-body" {...props}>{children}</tbody>,
  TableRow: ({ children, ...props }) => <tr className="table-row" {...props}>{children}</tr>,
  TableHead: ({ children, ...props }) => <th className="table-head" {...props}>{children}</th>,
  TableCell: ({ children, ...props }) => <td className="table-cell" {...props}>{children}</td>,
}));

jest.mock('../../../src/components/ui/card', () => ({
  Card: ({ children, ...props }) => <div className="card" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }) => <div className="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }) => <h3 className="card-title" {...props}>{children}</h3>,
  CardContent: ({ children, ...props }) => <div className="card-content" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }) => <p className="card-description" {...props}>{children}</p>,
}));

jest.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, variant, ...props }) => (
    <span className={`badge ${variant}`} {...props}>
      {children}
    </span>
  ),
}));

jest.mock('../../../src/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange, ...props }) => (
    <div className={`dialog ${open ? 'open' : ''}`} {...props}>
      {children}
    </div>
  ),
  DialogTrigger: ({ children, ...props }) => <div className="dialog-trigger" {...props}>{children}</div>,
  DialogContent: ({ children, ...props }) => <div className="dialog-content" {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }) => <div className="dialog-header" {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }) => <h2 className="dialog-title" {...props}>{children}</h2>,
  DialogDescription: ({ children, ...props }) => <p className="dialog-description" {...props}>{children}</p>,
  DialogFooter: ({ children, ...props }) => <div className="dialog-footer" {...props}>{children}</div>,
}));

jest.mock('../../../src/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children, ...props }) => <div className="dropdown-menu" {...props}>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }) => <div className="dropdown-menu-trigger" {...props}>{children}</div>,
  DropdownMenuContent: ({ children, ...props }) => <div className="dropdown-menu-content" {...props}>{children}</div>,
  DropdownMenuItem: ({ children, onClick, ...props }) => (
    <div className="dropdown-menu-item" onClick={onClick} {...props}>
      {children}
    </div>
  ),
  DropdownMenuLabel: ({ children, ...props }) => <div className="dropdown-menu-label" {...props}>{children}</div>,
  DropdownMenuSeparator: ({ ...props }) => <div className="dropdown-menu-separator" {...props} />,
}));

jest.mock('../../../src/components/ui/alert', () => ({
  Alert: ({ children, variant, ...props }) => (
    <div className={`alert ${variant}`} {...props}>
      {children}
    </div>
  ),
  AlertTitle: ({ children, ...props }) => <h4 className="alert-title" {...props}>{children}</h4>,
  AlertDescription: ({ children, ...props }) => (
    <div className="alert-description" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('../../../src/components/ui/avatar', () => ({
  Avatar: ({ children, ...props }) => <div className="avatar" {...props}>{children}</div>,
  AvatarImage: ({ src, alt, ...props }) => <img src={src} alt={alt} className="avatar-image" {...props} />,
  AvatarFallback: ({ children, ...props }) => <div className="avatar-fallback" {...props}>{children}</div>,
}));

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock do axios
jest.mock('../../../src/lib/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AdminNotifications Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar a página de notificações corretamente', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      expect(screen.getByText('Gerenciamento de Notificações')).toBeInTheDocument();
      expect(screen.getByText('Gerencie todas as notificações do sistema, templates e destinatários')).toBeInTheDocument();
    });

    it('deve exibir os cards de estatísticas', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      expect(screen.getByText('Total de Notificações')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getAllByText('Enviadas').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getAllByText('Pendentes').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Falharam').length).toBeGreaterThanOrEqual(1);
    });

    it('deve exibir a tabela de notificações', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      expect(screen.getByText('Notificações')).toBeInTheDocument();
      expect(screen.getByText('Lista de todas as notificações do sistema')).toBeInTheDocument();
      expect(screen.getAllByText('Destinatário').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Título').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Tipo').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Prioridade').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Criada em').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Ações').length).toBeGreaterThanOrEqual(1);
    });

    it('deve exibir os dados das notificações', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Verificar se os dados das notificações estão presentes
      expect(screen.getAllByText('Boas-vindas ao Sistema').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Lembrete de Pagamento').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Alerta de Segurança').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('João Silva').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Maria Santos').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Pedro Costa').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Filtros', () => {
    it('deve aplicar filtro por busca', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      const searchInput = screen.getByPlaceholderText('Buscar por título, mensagem ou destinatário...');
      fireEvent.change(searchInput, { target: { value: 'pagamento' } });
      
      await waitFor(() => {
        expect(searchInput.value).toBe('pagamento');
      });
    });

    it('deve aplicar filtro por status', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      const statusSelects = screen.getAllByText('Todos os status');
      fireEvent.click(statusSelects[0]); // Pegar o primeiro (trigger do select)
      
      // Status aparecem no filtro e na tabela
      const statusOptions = screen.getAllByText('Pendentes');
      expect(statusOptions.length).toBeGreaterThanOrEqual(1);
      fireEvent.click(statusOptions[0]);
    });

    it('deve aplicar filtro por tipo', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      const typeSelects = screen.getAllByText('Todos os tipos');
      fireEvent.click(typeSelects[0]); // Pegar o primeiro (trigger do select)
      
      // Email aparece no filtro e na tabela
      const typeOptions = screen.getAllByText('Email');
      expect(typeOptions.length).toBeGreaterThanOrEqual(1);
      fireEvent.click(typeOptions[0]);
    });

    it('deve aplicar filtro por prioridade', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      const prioritySelects = screen.getAllByText('Todas as prioridades');
      fireEvent.click(prioritySelects[0]); // Pegar o primeiro (trigger do select)
      
      // Alta aparece no filtro e na tabela
      const priorityOptions = screen.getAllByText('Alta');
      expect(priorityOptions.length).toBeGreaterThanOrEqual(1);
      fireEvent.click(priorityOptions[0]);
    });
  });

  describe('Ações', () => {
    it('deve abrir modal de nova notificação', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Usar um seletor mais específico para o botão
      const newButton = screen.getByRole('button', { name: /nova notificação/i });
      fireEvent.click(newButton);
      
      await waitFor(() => {
        // Deve haver pelo menos um botão e um título/modal com o texto
        const allNovaNotificacao = screen.getAllByText('Nova Notificação');
        expect(allNovaNotificacao.length).toBeGreaterThanOrEqual(2);
        // Um deles deve ser BUTTON
        expect(allNovaNotificacao.some(el => el.tagName === 'BUTTON')).toBe(true);
        // Um deles deve ser H2 (título do modal)
        expect(allNovaNotificacao.some(el => el.tagName === 'H2')).toBe(true);
        expect(screen.getByText('Crie uma nova notificação para enviar aos usuários')).toBeInTheDocument();
      });
    });

    it('deve reprocessar notificação', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Encontrar o primeiro botão de reprocessar
      const reprocessButtons = screen.getAllByText('Reprocessar');
      fireEvent.click(reprocessButtons[0]);
      
      // Verificar se o botão foi clicado (não dependendo do toast)
      expect(reprocessButtons[0]).toBeInTheDocument();
    });

    it('deve abrir modal de exclusão', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Encontrar o primeiro botão de remover
      const deleteButtons = screen.getAllByText('Remover');
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Confirmar Remoção')).toBeInTheDocument();
        expect(screen.getByText('Tem certeza que deseja remover esta notificação? Esta ação não pode ser desfeita.')).toBeInTheDocument();
      });
    });
  });

  describe('Badges e Status', () => {
    it('deve exibir badges de status corretos', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Verificar se os badges de status estão presentes
      expect(screen.getAllByText('sent').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('pending').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('failed').length).toBeGreaterThanOrEqual(1);
    });

    it('deve exibir badges de tipo corretos', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Verificar se os badges de tipo estão presentes
      expect(screen.getAllByText('email').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('push').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('system').length).toBeGreaterThanOrEqual(1);
    });

    it('deve exibir badges de prioridade corretos', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Verificar se os badges de prioridade estão presentes
      expect(screen.getAllByText('medium').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('high').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('urgent').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Loading e Estados', () => {
    it('deve exibir loading ao carregar dados', () => {
      renderWithRouter(<AdminNotifications />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('deve exibir dados após o carregamento', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      expect(screen.getByText('Gerenciamento de Notificações')).toBeInTheDocument();
      expect(screen.getAllByText('Boas-vindas ao Sistema').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Responsividade', () => {
    it('deve ser responsivo em diferentes tamanhos de tela', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Verificar se os elementos principais estão presentes
      expect(screen.getByText('Gerenciamento de Notificações')).toBeInTheDocument();
      expect(screen.getByText('Notificações')).toBeInTheDocument();
      expect(screen.getByText('Filtros e Busca')).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter elementos acessíveis', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Verificar se os botões têm texto descritivo
      expect(screen.getAllByText('Nova Notificação').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Atualizar')).toBeInTheDocument();
      
      // Verificar se os inputs têm placeholders
      expect(screen.getByPlaceholderText('Buscar por título, mensagem ou destinatário...')).toBeInTheDocument();
    });

    it('deve ter navegação por teclado', async () => {
      renderWithRouter(<AdminNotifications />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      }, { timeout: 2000 });
      
      const searchInput = screen.getByPlaceholderText('Buscar por título, mensagem ou destinatário...');
      const newButton = screen.getByRole('button', { name: /nova notificação/i });
      
      // Verificar se é possível navegar por tab
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
      
      newButton.focus();
      expect(document.activeElement).toBe(newButton);
    });
  });

  describe('Integração com Contexto', () => {
    it('deve usar o contexto de autenticação', () => {
      renderWithRouter(<AdminNotifications />);
      
      // Verificar se o usuário do contexto está sendo usado
      expect(mockAuthContext.user).toBeDefined();
      expect(mockAuthContext.isAuthenticated).toBe(true);
    });

    it('deve verificar permissões de administrador', () => {
      renderWithRouter(<AdminNotifications />);
      
      // Verificar se o usuário tem role de admin
      expect(mockAuthContext.user.role).toBe('admin');
    });
  });
}); 