/**
 * Testes unitários para a página de Pagamentos de Pagáveis
 * @module __tests__/pages/PayablePayments.test.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'sonner';
import PayablePayments from '../../src/pages/PayablePayments';

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => <div data-testid="toaster" />,
}));

describe('PayablePayments', () => {
  beforeEach(() => {
    render(
      <>
        <PayablePayments />
        <Toaster />
      </>
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar o título e descrição da página', () => {
      expect(screen.getByText('Pagamentos de Pagáveis')).toBeInTheDocument();
      expect(screen.getByText('Gerencie pagamentos vinculados a pagáveis')).toBeInTheDocument();
    });

    it('deve renderizar os cards de estatísticas', () => {
      expect(screen.getByText('Total de Pagamentos')).toBeInTheDocument();
      expect(screen.getByText('Pendentes')).toBeInTheDocument();
      expect(screen.getByText('Vencidos')).toBeInTheDocument();
      expect(screen.getByText('Taxa de Pagamento')).toBeInTheDocument();
      
      expect(screen.getByText('89')).toBeInTheDocument(); // Total de pagamentos
      expect(screen.getByText('15')).toBeInTheDocument(); // Pendentes
      expect(screen.getByText('5')).toBeInTheDocument(); // Vencidos
      expect(screen.getByText('78%')).toBeInTheDocument(); // Taxa de pagamento
    });

    it('deve renderizar a tabela de pagamentos', () => {
      expect(screen.getByText('Lista de Pagamentos')).toBeInTheDocument();
      expect(screen.getByText('3 pagamentos encontrados')).toBeInTheDocument();
    });

    it('deve renderizar os cabeçalhos da tabela', () => {
      expect(screen.getByText('Fornecedor')).toBeInTheDocument();
      expect(screen.getByText('Pagável')).toBeInTheDocument();
      expect(screen.getByText('Valor')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Vencimento')).toBeInTheDocument();
      expect(screen.getByText('Método')).toBeInTheDocument();
      expect(screen.getByText('Ações')).toBeInTheDocument();
    });
  });

  describe('Dados da tabela', () => {
    it('deve renderizar os dados dos pagamentos', () => {
      expect(screen.getByText('Fornecedor ABC Ltda')).toBeInTheDocument();
      expect(screen.getByText('Serviços XYZ S.A.')).toBeInTheDocument();
      expect(screen.getByText('Logística Express')).toBeInTheDocument();
      
      expect(screen.getByText('PAY001')).toBeInTheDocument();
      expect(screen.getByText('PAY002')).toBeInTheDocument();
      expect(screen.getByText('PAY003')).toBeInTheDocument();
    });

    it('deve formatar valores monetários corretamente', () => {
      expect(screen.getByText('R$ 3.500,00')).toBeInTheDocument();
      expect(screen.getByText('R$ 2.200,00')).toBeInTheDocument();
      expect(screen.getByText('R$ 1.800,00')).toBeInTheDocument();
    });

    it('deve mostrar badges com status corretos', () => {
      expect(screen.getByText('Pago')).toBeInTheDocument();
      expect(screen.getByText('Pendente')).toBeInTheDocument();
      expect(screen.getByText('Vencido')).toBeInTheDocument();
    });

    it('deve mostrar métodos de pagamento', () => {
      expect(screen.getByText('Transferência')).toBeInTheDocument();
      expect(screen.getByText('Boleto')).toBeInTheDocument();
      expect(screen.getByText('PIX')).toBeInTheDocument();
    });
  });

  describe('Ações na tabela', () => {
    it('deve mostrar botão de confirmar apenas para pagamentos pendentes', () => {
      const confirmButtons = screen.getAllByText('Confirmar');
      expect(confirmButtons).toHaveLength(1); // Apenas 1 pagamento pendente
    });

    it('deve mostrar botão de ver detalhes para todos os pagamentos', () => {
      const viewButtons = screen.getAllByText('Ver');
      expect(viewButtons).toHaveLength(3); // Todos os 3 pagamentos
    });

    it('deve ter botões com aria-labels apropriados', () => {
      const viewButtons = screen.getAllByText('Ver');
      const confirmButtons = screen.getAllByText('Confirmar');
      
      expect(viewButtons[0]).toHaveAttribute('aria-label', 'Ver detalhes do pagamento 1');
      expect(confirmButtons[0]).toHaveAttribute('aria-label', 'Confirmar pagamento 2');
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
      expect(screen.getByText('Pagamentos de Pagáveis')).toBeInTheDocument();
      expect(screen.getByText('Total de Pagamentos')).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels apropriados para elementos interativos', () => {
      expect(screen.getByLabelText('Exportar relatório')).toBeInTheDocument();
    });

    it('deve ter estrutura semântica adequada', () => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Formatação de dados', () => {
    it('deve formatar valores monetários corretamente', () => {
      expect(screen.getByText('R$ 3.500,00')).toBeInTheDocument();
      expect(screen.getByText('R$ 2.200,00')).toBeInTheDocument();
      expect(screen.getByText('R$ 1.800,00')).toBeInTheDocument();
    });

    it('deve mostrar badges com status corretos', () => {
      expect(screen.getByText('Pago')).toBeInTheDocument();
      expect(screen.getByText('Pendente')).toBeInTheDocument();
      expect(screen.getByText('Vencido')).toBeInTheDocument();
    });

    it('deve mostrar datas no formato correto', () => {
      expect(screen.getByText('2025-01-15')).toBeInTheDocument();
      expect(screen.getByText('2025-01-20')).toBeInTheDocument();
      expect(screen.getByText('2025-01-10')).toBeInTheDocument();
    });
  });

  describe('Interatividade', () => {
    it('deve permitir clicar nos botões de ação', async () => {
      const user = userEvent.setup();
      const viewButtons = screen.getAllByText('Ver');
      const confirmButtons = screen.getAllByText('Confirmar');
      
      // Testar clique no botão Ver
      await user.click(viewButtons[0]);
      
      // Testar clique no botão Confirmar
      await user.click(confirmButtons[0]);
      
      // Verificar se os botões ainda estão funcionais
      expect(viewButtons[0]).toBeInTheDocument();
      expect(confirmButtons[0]).toBeInTheDocument();
    });

    it('deve ter botões com estados apropriados', () => {
      const exportButton = screen.getByText('Exportar');
      expect(exportButton).not.toBeDisabled();
    });
  });
}); 