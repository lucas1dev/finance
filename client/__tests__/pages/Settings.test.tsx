// @ts-nocheck
// Mock do axios deve vir antes de qualquer import que dependa dele
const mockApi = {
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
};

jest.mock('../../src/lib/axios', () => ({
  __esModule: true,
  default: mockApi,
}));

/// <reference types="jest" />

/**
 * Testes unitários para a página Settings
 * @author Lucas Santos
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { ThemeProvider } from '../../src/contexts/ThemeContext';
import { Settings } from '../../src/pages/Settings';

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock do react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock do react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(),
}));

// Mock do @hookform/resolvers/zod
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(),
}));

describe('Settings Page', () => {
  const mockUser = {
    id: 1,
    name: 'João Silva',
    email: 'joao@example.com',
    role: 'user'
  };

  const mockProfileForm = {
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => fn),
    formState: { errors: {} },
    watch: jest.fn(),
    setValue: jest.fn(),
    reset: jest.fn()
  };

  const mockPasswordForm = {
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => fn),
    formState: { errors: {} },
    reset: jest.fn()
  };

  const mockNotificationForm = {
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => fn),
    formState: { errors: {} },
    watch: jest.fn(),
    setValue: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock do useForm para diferentes formulários
    const { useForm } = require('react-hook-form');
    useForm.mockImplementation((config) => {
      if (config?.defaultValues?.name) {
        return mockProfileForm;
      } else if (config?.defaultValues?.currentPassword !== undefined) {
        return mockPasswordForm;
      } else {
        return mockNotificationForm;
      }
    });

    // Mock do AuthContext
    jest.spyOn(require('../../src/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: mockUser,
      logout: jest.fn()
    });

    // Mock do ThemeContext
    jest.spyOn(require('../../src/contexts/ThemeContext'), 'useTheme').mockReturnValue({
      theme: 'light',
      setTheme: jest.fn()
    });
  });

  const renderSettings = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Settings />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  describe('Renderização', () => {
    it('deve renderizar o título da página', () => {
      renderSettings();
      expect(screen.getByText('Configurações')).toBeInTheDocument();
    });

    it('deve renderizar todas as abas de configuração', () => {
      renderSettings();
      expect(screen.getByText('Perfil')).toBeInTheDocument();
      expect(screen.getByText('Segurança')).toBeInTheDocument();
      expect(screen.getByText('Notificações')).toBeInTheDocument();
      expect(screen.getByText('Aparência')).toBeInTheDocument();
      expect(screen.getByText('Privacidade')).toBeInTheDocument();
      expect(screen.getByText('Conta')).toBeInTheDocument();
    });

    it('deve mostrar a aba Perfil por padrão', () => {
      renderSettings();
      expect(screen.getByText('Informações Pessoais')).toBeInTheDocument();
    });
  });

  describe('Aba Perfil', () => {
    it('deve renderizar campos do formulário de perfil', () => {
      renderSettings();
      
      expect(screen.getByLabelText('Nome Completo *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email *')).toBeInTheDocument();
      expect(screen.getByLabelText('Telefone')).toBeInTheDocument();
      expect(screen.getByText('Fuso Horário')).toBeInTheDocument();
      expect(screen.getByText('Idioma')).toBeInTheDocument();
    });

    it('deve mostrar botão de salvar alterações', () => {
      renderSettings();
      expect(screen.getByText('Salvar Alterações')).toBeInTheDocument();
    });

    it('deve chamar handleProfileUpdate ao submeter formulário', async () => {
      mockApi.put.mockResolvedValueOnce({ data: { success: true } });
      
      renderSettings();
      
      const submitButton = screen.getByText('Salvar Alterações');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockApi.put).toHaveBeenCalledWith('/auth/profile', expect.any(Object));
      });
    });
  });

  describe('Aba Segurança', () => {
    it('deve mostrar seção de alteração de senha', () => {
      renderSettings();
      
      // Clicar na aba Segurança
      fireEvent.click(screen.getByText('Segurança'));
      
      expect(screen.getByText('Alterar Senha')).toBeInTheDocument();
      expect(screen.getByLabelText('Senha Atual *')).toBeInTheDocument();
      expect(screen.getByLabelText('Nova Senha *')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar Nova Senha *')).toBeInTheDocument();
    });

    it('deve mostrar seção de autenticação de dois fatores', () => {
      renderSettings();
      
      fireEvent.click(screen.getByText('Segurança'));
      
      expect(screen.getByText('Autenticação de Dois Fatores')).toBeInTheDocument();
      expect(screen.getByText('Verificação em duas etapas')).toBeInTheDocument();
    });

    it('deve mostrar seção de sessões ativas', () => {
      renderSettings();
      
      fireEvent.click(screen.getByText('Segurança'));
      
      expect(screen.getByText('Sessões Ativas')).toBeInTheDocument();
      expect(screen.getByText('Chrome - Windows 10')).toBeInTheDocument();
      expect(screen.getByText('Safari - iPhone 14')).toBeInTheDocument();
    });

    it('deve permitir encerrar sessões', async () => {
      renderSettings();
      
      fireEvent.click(screen.getByText('Segurança'));
      
      const endSessionButtons = screen.getAllByText('Encerrar');
      fireEvent.click(endSessionButtons[0]);
      
      await waitFor(() => {
        expect(require('sonner').toast.success).toHaveBeenCalledWith('Sessão encerrada com sucesso');
      });
    });
  });

  describe('Aba Notificações', () => {
    it('deve mostrar configurações de notificação', () => {
      renderSettings();
      
      fireEvent.click(screen.getByText('Notificações'));
      
      expect(screen.getByText('Configurações de Notificação')).toBeInTheDocument();
      expect(screen.getByText('Notificações por Email')).toBeInTheDocument();
      expect(screen.getByText('Notificações Push')).toBeInTheDocument();
      expect(screen.getByText('Notificações SMS')).toBeInTheDocument();
    });

    it('deve mostrar tipos de notificação', () => {
      renderSettings();
      
      fireEvent.click(screen.getByText('Notificações'));
      
      expect(screen.getByText('Alertas de Transação')).toBeInTheDocument();
      expect(screen.getByText('Lembretes de Pagamento')).toBeInTheDocument();
      expect(screen.getByText('Alertas de Segurança')).toBeInTheDocument();
      expect(screen.getByText('Emails de Marketing')).toBeInTheDocument();
    });
  });

  describe('Aba Aparência', () => {
    it('deve mostrar opções de tema', () => {
      renderSettings();
      
      fireEvent.click(screen.getByText('Aparência'));
      
      expect(screen.getByText('Aparência')).toBeInTheDocument();
      expect(screen.getByText('Claro')).toBeInTheDocument();
      expect(screen.getByText('Escuro')).toBeInTheDocument();
    });

    it('deve mostrar opções de densidade da interface', () => {
      renderSettings();
      
      fireEvent.click(screen.getByText('Aparência'));
      
      expect(screen.getByText('Densidade da Interface')).toBeInTheDocument();
    });
  });

  describe('Aba Privacidade', () => {
    it('deve mostrar configurações de privacidade', () => {
      renderSettings();
      
      fireEvent.click(screen.getByText('Privacidade'));
      
      expect(screen.getByText('Privacidade e Dados')).toBeInTheDocument();
      expect(screen.getByText('Visibilidade do Perfil')).toBeInTheDocument();
      expect(screen.getByText('Rastreamento de Atividade')).toBeInTheDocument();
      expect(screen.getByText('Exportação de Dados')).toBeInTheDocument();
    });

    it('deve permitir exportar dados', async () => {
      renderSettings();
      
      fireEvent.click(screen.getByText('Privacidade'));
      
      const exportButton = screen.getByText('Exportar Meus Dados');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(require('sonner').toast.success).toHaveBeenCalledWith(
          'Exportação iniciada. Você receberá um email com os dados.'
        );
      });
    });
  });

  describe('Aba Conta', () => {
    it('deve mostrar informações da conta', () => {
      renderSettings();
      
      fireEvent.click(screen.getByText('Conta'));
      
      expect(screen.getByText('Informações da Conta')).toBeInTheDocument();
      expect(screen.getByText('ID da Conta')).toBeInTheDocument();
      expect(screen.getByText('Tipo de Conta')).toBeInTheDocument();
      expect(screen.getByText('Data de Criação')).toBeInTheDocument();
      expect(screen.getByText('Último Login')).toBeInTheDocument();
    });

    it('deve mostrar ações da conta', () => {
      renderSettings();
      
      fireEvent.click(screen.getByText('Conta'));
      
      expect(screen.getByText('Fazer Logout de Todos os Dispositivos')).toBeInTheDocument();
      expect(screen.getByText('Excluir Conta')).toBeInTheDocument();
    });
  });

  describe('Funcionalidades Gerais', () => {
    it('deve mostrar loading state', () => {
      // Mock do estado de loading
      jest.spyOn(React, 'useState').mockImplementation(() => [true, jest.fn()]);
      
      renderSettings();
      
      expect(screen.getByText('Carregando configurações...')).toBeInTheDocument();
    });

    it('deve mostrar botão de atualizar', () => {
      renderSettings();
      expect(screen.getByText('Atualizar')).toBeInTheDocument();
    });

    it('deve navegar entre abas', () => {
      renderSettings();
      
      // Verificar que a aba Perfil está ativa por padrão
      expect(screen.getByText('Informações Pessoais')).toBeInTheDocument();
      
      // Clicar na aba Segurança
      fireEvent.click(screen.getByText('Segurança'));
      expect(screen.getByText('Alterar Senha')).toBeInTheDocument();
      
      // Clicar na aba Notificações
      fireEvent.click(screen.getByText('Notificações'));
      expect(screen.getByText('Configurações de Notificação')).toBeInTheDocument();
    });

    it('deve mostrar mensagens de erro ao falhar requisições', async () => {
      mockApi.put.mockRejectedValueOnce(new Error('Erro de rede'));
      
      renderSettings();
      
      const submitButton = screen.getByText('Salvar Alterações');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(require('sonner').toast.error).toHaveBeenCalledWith('Erro ao atualizar perfil');
      });
    });

    it('deve mostrar mensagens de sucesso ao completar ações', async () => {
      mockApi.put.mockResolvedValueOnce({ data: { success: true } });
      
      renderSettings();
      
      const submitButton = screen.getByText('Salvar Alterações');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(require('sonner').toast.success).toHaveBeenCalledWith('Perfil atualizado com sucesso');
      });
    });
  });

  describe('Validação de Formulários', () => {
    it('deve mostrar erros de validação no formulário de perfil', () => {
      mockProfileForm.formState.errors = {
        name: { message: 'Nome deve ter pelo menos 3 caracteres' },
        email: { message: 'Email inválido' }
      };
      
      renderSettings();
      
      expect(screen.getByText('Nome deve ter pelo menos 3 caracteres')).toBeInTheDocument();
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });

    it('deve mostrar erros de validação no formulário de senha', () => {
      mockPasswordForm.formState.errors = {
        currentPassword: { message: 'Senha atual é obrigatória' },
        newPassword: { message: 'Nova senha deve ter pelo menos 8 caracteres' },
        confirmPassword: { message: 'Senhas não coincidem' }
      };
      
      renderSettings();
      
      fireEvent.click(screen.getByText('Segurança'));
      
      expect(screen.getByText('Senha atual é obrigatória')).toBeInTheDocument();
      expect(screen.getByText('Nova senha deve ter pelo menos 8 caracteres')).toBeInTheDocument();
      expect(screen.getByText('Senhas não coincidem')).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels apropriados para campos de formulário', () => {
      renderSettings();
      
      expect(screen.getByLabelText('Nome Completo *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email *')).toBeInTheDocument();
      expect(screen.getByLabelText('Telefone')).toBeInTheDocument();
    });

    it('deve ter botões com texto descritivo', () => {
      renderSettings();
      
      expect(screen.getByText('Salvar Alterações')).toBeInTheDocument();
      expect(screen.getByText('Atualizar Senha')).toBeInTheDocument();
      expect(screen.getByText('Salvar Configurações')).toBeInTheDocument();
    });

    it('deve ter navegação por abas acessível', () => {
      renderSettings();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(6); // 6 abas
      
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('role', 'tab');
      });
    });
  });
}); 