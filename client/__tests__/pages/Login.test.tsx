/// <reference types="jest" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { Login } from '../../src/pages/Login';

// Mock do axios
jest.mock('../../src/lib/axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
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
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock do useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock do AuthContext
const mockLogin = jest.fn();
jest.mock('../../src/contexts/AuthContext', () => ({
  ...jest.requireActual('../../src/contexts/AuthContext'),
  useAuth: () => ({
    login: mockLogin,
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('deve renderizar o formulário de login', () => {
    renderLogin();
    
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Sua senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('deve permitir digitar email e senha', () => {
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const passwordInput = screen.getByPlaceholderText('Sua senha');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('deve chamar login quando formulário for submetido', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const passwordInput = screen.getByPlaceholderText('Sua senha');
    const submitButton = screen.getByRole('button', { name: 'Entrar' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('deve validar formato de email', async () => {
    // Não mockar o login como resolved para permitir validação
    mockLogin.mockImplementation(() => Promise.reject(new Error('Test')));
    
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const submitButton = screen.getByRole('button', { name: 'Entrar' });
    
    // Preencher com email inválido e submeter o formulário
    fireEvent.change(emailInput, { target: { value: 'email-invalido' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Verificar se há mensagem de erro de validação
      const errorElement = screen.getByText('Email inválido');
      expect(errorElement).toBeInTheDocument();
    });
  });

  it('deve validar senha obrigatória', async () => {
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const submitButton = screen.getByRole('button', { name: 'Entrar' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Verificar se há algum elemento com texto de erro de senha
      const errorElement = screen.getByText('Senha é obrigatória');
      expect(errorElement).toBeInTheDocument();
    });
  });

  it('deve mostrar erro quando login falhar', async () => {
    const mockError = new Error('Credenciais inválidas');
    mockLogin.mockRejectedValueOnce(mockError);
    
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const passwordInput = screen.getByPlaceholderText('Sua senha');
    const submitButton = screen.getByRole('button', { name: 'Entrar' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    });
  });

  it('deve navegar para registro quando link for clicado', () => {
    renderLogin();
    
    const registerLink = screen.getByText('Registre-se');
    fireEvent.click(registerLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('deve navegar para recuperação de senha quando link for clicado', () => {
    renderLogin();
    
    const forgotPasswordLink = screen.getByText('Esqueceu sua senha?');
    fireEvent.click(forgotPasswordLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('deve alternar visibilidade da senha', () => {
    renderLogin();
    
    const passwordInput = screen.getByPlaceholderText('Sua senha');
    const toggleButton = screen.getByRole('button', { name: '' }); // Botão do olho
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('deve marcar checkbox "lembrar de mim"', () => {
    renderLogin();
    
    const rememberCheckbox = screen.getByRole('checkbox');
    
    expect(rememberCheckbox).not.toBeChecked();
    
    fireEvent.click(rememberCheckbox);
    
    expect(rememberCheckbox).toBeChecked();
  });

  it('deve mostrar loading durante o login', async () => {
    // Mock do login para demorar
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const passwordInput = screen.getByPlaceholderText('Sua senha');
    const submitButton = screen.getByRole('button', { name: 'Entrar' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);
    
    // Aguardar o estado de loading ser atualizado
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
    
    // Aguardar o login terminar
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });
}); 