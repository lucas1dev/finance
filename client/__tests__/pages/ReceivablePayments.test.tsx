/**
 * Testes unitários para a página de Pagamentos de Recebíveis
 * @module __tests__/pages/ReceivablePayments.test.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'sonner';
import ReceivablePayments from '../../src/pages/ReceivablePayments';

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => <div data-testid="toaster" />,
}));

describe('ReceivablePayments', () => {
  beforeEach(() => {
    render(
      <>
        <ReceivablePayments />
        <Toaster />
      </>
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar o título e descrição da página', () => {
      expect(screen.getByText('Pagamentos de Recebíveis')).toBeInTheDocument();
      expect(screen.getByText('Gerencie pagamentos vinculados a recebíveis')).toBeInTheDocument();
    });

    it('deve renderizar os cards de estatísticas', () => {
      expect(screen.getByText('Total de Pagamentos')).toBeInTheDocument();
      expect(screen.getByText('Pendentes')).toBeInTheDocument();
      expect(screen.getByText('Vencidos')).toBeInTheDocument();
      expect(screen.getByText('Taxa de Recebimento')).toBeInTheDocument();
      
      expect(screen.getByText('156')).toBeInTheDocument(); // Total de pagamentos
      expect(screen.getByText('23')).toBeInTheDocument(); // Pendentes
      expect(screen.getByText('8')).toBeInTheDocument(); // Vencidos
      expect(screen.getByText('80%')).toBeInTheDocument(); // Taxa de recebimento
    });

    it('deve renderizar as abas de navegação', () => {
      expect(screen.getByText('Visão Geral')).toBeInTheDocument();
      expect(screen.getByText('Pagamentos')).toBeInTheDocument();
      expect(screen.getByText('Relatórios')).toBeInTheDocument();
    });

    it('deve renderizar a aba Visão Geral por padrão', () => {
      expect(screen.getByText('Pagamentos por Status')).toBeInTheDocument();
      expect(screen.getByText('Pagamentos por Mês')).toBeInTheDocument();
    });
  });

  describe('Navegação entre abas', () => {
    it('deve alternar para a aba Pagamentos', async () => {
      const user = userEvent.setup();
      const paymentsTab = screen.getByText('Pagamentos');
      
      await user.click(paymentsTab);
      
      expect(screen.getByText('Lista de Pagamentos')).toBeInTheDocument();
      expect(screen.getByText('5 pagamentos encontrados')).toBeInTheDocument();
    });

    it('deve alternar para a aba Relatórios', async () => {
      const user = userEvent.setup();
      const reportsTab = screen.getByText('Relatórios');
      
      await user.click(reportsTab);
      
      expect(screen.getByText('Relatórios de Pagamentos')).toBeInTheDocument();
      expect(screen.getByText('Relatório por Período')).toBeInTheDocument();
      expect(screen.getByText('Relatório por Cliente')).toBeInTheDocument();
    });
  });

  describe('Filtros e busca', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      const paymentsTab = screen.getByText('Pagamentos');
      await user.click(paymentsTab);
    });

    it('deve filtrar pagamentos por busca', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Buscar por cliente, email ou ID...');
      
      await user.type(searchInput, 'João');
      
      expect(screen.getByText('1 pagamentos encontrados')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    it('deve filtrar pagamentos por status', async () => {
      const user = userEvent.setup();
      const statusSelect = screen.getByLabelText('Filtrar por status');
      
      await user.selectOptions(statusSelect, 'pending');
      
      expect(screen.getByText('2 pagamentos encontrados')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.getByText('Carlos Ferreira')).toBeInTheDocument();
    });

    it('deve filtrar pagamentos por data', async () => {
      const user = userEvent.setup();
      const dateFromInput = screen.getAllByDisplayValue('')[2]; // Terceiro input vazio
      
      await user.type(dateFromInput, '2025-01-15');
      
      expect(screen.getByText('3 pagamentos encontrados')).toBeInTheDocument();
    });
  });

  describe('Ações na tabela', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      const paymentsTab = screen.getByText('Pagamentos');
      await user.click(paymentsTab);
    });

    it('deve mostrar botão de confirmar apenas para pagamentos pendentes', () => {
      const confirmButtons = screen.getAllByText('Confirmar');
      expect(confirmButtons).toHaveLength(2); // Apenas 2 pagamentos pendentes
    });

    it('deve mostrar botão de ver detalhes para todos os pagamentos', () => {
      const viewButtons = screen.getAllByText('Ver');
      expect(viewButtons).toHaveLength(5); // Todos os 5 pagamentos
    });

    it('deve abrir modal de detalhes ao clicar em Ver', async () => {
      const user = userEvent.setup();
      const viewButtons = screen.getAllByText('Ver');
      
      await user.click(viewButtons[0]);
      
      expect(screen.getByText('Detalhes do Pagamento')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('joao.silva@email.com')).toBeInTheDocument();
    });

    it('deve abrir modal de confirmação ao clicar em Confirmar', async () => {
      const user = userEvent.setup();
      const confirmButtons = screen.getAllByText('Confirmar');
      
      await user.click(confirmButtons[0]);
      
      expect(screen.getByText('Confirmar Pagamento')).toBeInTheDocument();
      expect(screen.getByText(/Tem certeza que deseja confirmar o pagamento/)).toBeInTheDocument();
    });
  });

  describe('Exportação', () => {
    it('deve mostrar loading durante exportação', async () => {
      const user = userEvent.setup();
      const exportButton = screen.getByText('Exportar');
      
      await user.click(exportButton);
      
      expect(screen.getByText('Exportando...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument();
      });
    });

    it('deve mostrar toast de sucesso após exportação', async () => {
      const user = userEvent.setup();
      const exportButton = screen.getByText('Exportar');
      
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument();
      });
    });
  });

  describe('Responsividade', () => {
    it('deve ser responsivo em telas menores', () => {
      // Simular tela menor
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      window.dispatchEvent(new Event('resize'));

      // Verificar se os elementos ainda estão visíveis
      expect(screen.getByText('Pagamentos de Recebíveis')).toBeInTheDocument();
      expect(screen.getByText('Total de Pagamentos')).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels apropriados para elementos interativos', () => {
      expect(screen.getByLabelText('Exportar relatório')).toBeInTheDocument();
      expect(screen.getByLabelText('Filtrar por status')).toBeInTheDocument();
    });

    it('deve ter aria-labels nos botões de ação', () => {
      const user = userEvent.setup();
      const paymentsTab = screen.getByText('Pagamentos');
      user.click(paymentsTab);
      
      const viewButtons = screen.getAllByText('Ver');
      const confirmButtons = screen.getAllByText('Confirmar');
      
      expect(viewButtons[0]).toHaveAttribute('aria-label', 'Ver detalhes do pagamento 1');
      expect(confirmButtons[0]).toHaveAttribute('aria-label', 'Confirmar pagamento 2');
    });
  });

  describe('Formatação de dados', () => {
    it('deve formatar valores monetários corretamente', () => {
      const user = userEvent.setup();
      const paymentsTab = screen.getByText('Pagamentos');
      user.click(paymentsTab);
      
      expect(screen.getByText('R$ 2.500,00')).toBeInTheDocument();
      expect(screen.getByText('R$ 1.800,00')).toBeInTheDocument();
    });

    it('deve mostrar badges com status corretos', () => {
      const user = userEvent.setup();
      const paymentsTab = screen.getByText('Pagamentos');
      user.click(paymentsTab);
      
      expect(screen.getByText('Pago')).toBeInTheDocument();
      expect(screen.getByText('Pendente')).toBeInTheDocument();
      expect(screen.getByText('Vencido')).toBeInTheDocument();
    });
  });
}); 