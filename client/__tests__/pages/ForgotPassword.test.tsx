import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ForgotPassword } from '../../src/pages/ForgotPassword';
import { AuthProvider } from '../../src/contexts/AuthContext';

// Mock do navigate
const mockNavigate = jest.fn();

jest.mock('../../src/lib/axios', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { toast } from 'sonner';
import api from '../../src/lib/axios';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ForgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.post as jest.Mock).mockReset();
  });

  describe('Renderização inicial', () => {
    it('deve renderizar o formulário de recuperação de senha', () => {
      renderWithProviders(<ForgotPassword />);
      
      expect(screen.getByText('Recuperar senha')).toBeInTheDocument();
      expect(screen.getByText('Digite seu email para receber as instruções de recuperação')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Enviar instruções' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Voltar para o login' })).toBeInTheDocument();
    });

    it('deve ter campos acessíveis com labels apropriados', () => {
      renderWithProviders(<ForgotPassword />);
      
      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'seu@email.com');
      expect(emailInput).toHaveAttribute('required');
    });

    it('deve ter botão de envio habilitado inicialmente', () => {
      renderWithProviders(<ForgotPassword />);
      
      const submitButton = screen.getByRole('button', { name: 'Enviar instruções' });
      expect(submitButton).toBeEnabled();
    });
  });

  describe('Validação de email', () => {
    it('deve mostrar erro de validação para email inválido', async () => {
      renderWithProviders(<ForgotPassword />);
      
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Enviar instruções' });
      
      // Preencher email inválido
      fireEvent.change(emailInput, { target: { value: 'email-invalido' } });
      
      // Enviar formulário
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email inválido')).toBeInTheDocument();
      });
    });

    it('deve limpar erro quando email válido for digitado', async () => {
      renderWithProviders(<ForgotPassword />);
      
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Enviar instruções' });
      
      // Causar erro
      fireEvent.change(emailInput, { target: { value: 'email-invalido' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email inválido')).toBeInTheDocument();
      });
      
      // Corrigir email - agora deve limpar o erro automaticamente
      fireEvent.change(emailInput, { target: { value: 'teste@exemplo.com' } });
      
      await waitFor(() => {
        expect(screen.queryByText('Email inválido')).not.toBeInTheDocument();
      });
    });
  });

  describe('Envio do formulário', () => {
    it('deve enviar requisição com email válido', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'Email enviado com sucesso' } });
      
      renderWithProviders(<ForgotPassword />);
      
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Enviar instruções' });
      
      // Preencher email
      fireEvent.change(emailInput, { target: { value: 'teste@exemplo.com' } });
      
      // Enviar formulário
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', {
          email: 'teste@exemplo.com'
        });
      });
    });

    it('deve mostrar loading durante o envio', async () => {
      // Mock de uma requisição lenta
      (api.post as jest.Mock).mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProviders(<ForgotPassword />);
      
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Enviar instruções' });
      
      // Preencher email
      fireEvent.change(emailInput, { target: { value: 'teste@exemplo.com' } });
      
      // Enviar formulário
      fireEvent.click(submitButton);
      
      // Verificar loading
      await waitFor(() => {
        expect(screen.getByText('Enviando...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });

    it('deve mostrar mensagem de sucesso após envio bem-sucedido', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'Email enviado com sucesso' } });
      
      renderWithProviders(<ForgotPassword />);
      
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Enviar instruções' });
      
      // Preencher email
      fireEvent.change(emailInput, { target: { value: 'teste@exemplo.com' } });
      
      // Enviar formulário
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Instruções de recuperação enviadas para seu email');
      });
    });

    it('deve mostrar toast de sucesso e redirecionar', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'Email enviado com sucesso' } });
      
      renderWithProviders(<ForgotPassword />);
      
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Enviar instruções' });
      
      // Preencher email
      fireEvent.change(emailInput, { target: { value: 'teste@exemplo.com' } });
      
      // Enviar formulário
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Instruções de recuperação enviadas para seu email');
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Tratamento de erros', () => {
    it('deve mostrar erro de API quando requisição falhar', async () => {
      (api.post as jest.Mock).mockRejectedValueOnce({
        response: {
          data: { error: 'Email não encontrado' },
          status: 404
        }
      });
      
      renderWithProviders(<ForgotPassword />);
      
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Enviar instruções' });
      
      // Preencher email
      fireEvent.change(emailInput, { target: { value: 'teste@exemplo.com' } });
      
      // Enviar formulário
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Email não encontrado');
      });
    });

    it('deve mostrar erro genérico quando não houver mensagem específica', async () => {
      (api.post as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 500
        }
      });
      
      renderWithProviders(<ForgotPassword />);
      
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Enviar instruções' });
      
      // Preencher email
      fireEvent.change(emailInput, { target: { value: 'teste@exemplo.com' } });
      
      // Enviar formulário
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erro ao processar recuperação de senha');
      });
    });

    it('deve reabilitar botão após erro', async () => {
      (api.post as jest.Mock).mockRejectedValueOnce({
        response: {
          data: { error: 'Email não encontrado' },
          status: 404
        }
      });
      
      renderWithProviders(<ForgotPassword />);
      
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Enviar instruções' });
      
      // Preencher email
      fireEvent.change(emailInput, { target: { value: 'teste@exemplo.com' } });
      
      // Enviar formulário
      fireEvent.click(submitButton);
      
      // Verificar que botão fica desabilitado durante loading
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
      
      // Verificar que botão é reabilitado após erro
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
    });
  });

  describe('Navegação', () => {
    it('deve navegar para login quando clicar em "Voltar para o login"', () => {
      renderWithProviders(<ForgotPassword />);
      
      const backButton = screen.getByRole('button', { name: 'Voltar para o login' });
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter estrutura semântica adequada', () => {
      renderWithProviders(<ForgotPassword />);
      
      // Verificar se há um heading principal
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      
      // Verificar se há um campo de email
      expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    });

    it('deve ter mensagens de erro associadas aos campos', async () => {
      renderWithProviders(<ForgotPassword />);
      
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: 'Enviar instruções' });
      
      // Causar erro
      fireEvent.change(emailInput, { target: { value: 'email-invalido' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Email inválido');
        expect(errorMessage).toBeInTheDocument();
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
      });
    });
  });

  describe('Estados do formulário', () => {
    it('deve limpar o formulário após envio bem-sucedido', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'Email enviado com sucesso' } });
      
      renderWithProviders(<ForgotPassword />);
      
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: 'Enviar instruções' });
      
      // Preencher email
      fireEvent.change(emailInput, { target: { value: 'teste@exemplo.com' } });
      
      // Enviar formulário
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(emailInput.value).toBe('');
      });
    });

    it('deve manter dados do formulário após erro', async () => {
      (api.post as jest.Mock).mockRejectedValueOnce({
        response: {
          data: { error: 'Email não encontrado' },
          status: 404
        }
      });
      
      renderWithProviders(<ForgotPassword />);
      
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: 'Enviar instruções' });
      
      // Preencher email
      fireEvent.change(emailInput, { target: { value: 'teste@exemplo.com' } });
      
      // Enviar formulário
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(emailInput.value).toBe('teste@exemplo.com');
        expect(submitButton).toBeEnabled();
      });
    });
  });
}); 